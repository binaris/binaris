// this is just a convenience/wrapper for the individual commands
const fs = require('fs');
const path = require('path');

const targz = require('targz');
const yaml = require('js-yaml');

const log = require('./logger');

const binarisConfFile = 'binaris.yml';
const funcStr = 'functions';
const entryStr = 'entrypoint';
const fileStr = 'file';
const binarisDir = '.binaris/';
const templateDir = './functionTemplates/nodejs/';

// attempts to parse a json and throws if an issue is encountered
const attemptJSONParse = function attemptJSONParse(rawJSON) {
  try {
    const parsedJSON = JSON.parse(rawJSON);
    if (parsedJSON && typeof parsedJSON === 'object') {
      return parsedJSON;
    }
  } catch (err) {
    log.debug(err);
  }
  throw new Error('Invalid JSON received, unable to parse');
};

// creates our hidden .binaris directory in the users function
// directory if it doesn't already exist
const genBinarisDir = function genBinarisDir(genPath) {
  let fullPath;
  try {
    fullPath = path.join(genPath, binarisDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }
  } catch (err) {
    log.debug(err);
    throw new Error(`Unable to generate ${binarisDir} hidden directory!`);
  }
  return fullPath;
};

const genTarBall = async function genTarBall(dirToTar, dest, ignoredFiles) {
  // our CLI pipeline is forced and intentionally synchronous,
  // this wrapper is to ensure that vanilla cbs don't interfere
  // with the order of things
  const tarPromise = new Promise((resolve, reject) => {
    targz.compress({
      src: dirToTar,
      dest,
      tar: {
        ignore: (name) => {
          if (ignoredFiles.indexOf(name) > -1) {
            return true;
          }
          return false;
        },
      },
    }, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });

  const success = await tarPromise;
  return success;
};

// this loads our binaris.yml file from the users current
// function directory. If it does not exist in the expected
// location the object returned will have a false 'success'
// field and a associated error field
const loadBinarisConf = function loadBinarisConf(funcDirPath) {
  try {
    const fullYAMLPath = path.join(funcDirPath, binarisConfFile);
    const binarisConf = yaml.safeLoad(fs.readFileSync(fullYAMLPath, 'utf8'));
    return binarisConf;
  } catch (err) {
    log.debug(err);
    throw new Error(`${funcDirPath} does not contain a valid binaris function!`);
  }
};

const saveBinarisConf = function saveBinarisConf(funcDirPath, binarisConf) {
  const fullYAMLPath = path.join(funcDirPath, binarisConfFile);
  const confString = yaml.dump(binarisConf);
  fs.writeFileSync(fullYAMLPath, confString, 'utf8');
};

// this loads our _______.js file from the users current
// function directory. It determines the correct name of the
// file by inspecting the functions package.json main field.
// If it does not exist in the expected location the object
// returned will have a false 'success' field and a
// associated error field
const readFunctionJS = function readFunctionJS(funcDirPath, JSFileName) {
  const fullJSPath = path.join(funcDirPath, JSFileName);
  const JSFile = fs.readFileSync(fullJSPath, 'utf8');
  return JSFile;
};

const getFunctionsSection = function getFunctionsSection(binarisConf) {
  // ensure our configuration has the field
  if (!Object.prototype.hasOwnProperty.call(binarisConf, funcStr)) {
    throw new Error(`Your ${binarisConfFile} did not contain a require field: <${funcStr}>`);
  }
  const funcSection = binarisConf[funcStr];
  return funcSection;
};

// Assumes a single function.
const getFuncName = function getFuncName(binarisConf) {
  const funcSection = getFunctionsSection(binarisConf);
  const funcKeys = Object.keys(funcSection);
  // There's not yet support for multiple functions per yaml
  // The first (and only) entry is used
  if (funcKeys.length !== 1) {
    throw new Error(`Your ${binarisConfFile} ${funcStr} section did not contain an appropriate definition`);
  }
  const funcName = funcKeys[0];
  return funcName;
};

const checkFuncConf = function checkFuncConf(funcConf, funcDirPath) {
  if (!Object.prototype.hasOwnProperty.call(funcConf, fileStr)) {
    throw new Error(`Your ${binarisConfFile} function did not contain a require field: <${fileStr}>`);
  }
  if (!Object.prototype.hasOwnProperty.call(funcConf, entryStr)) {
    throw new Error(`Your ${binarisConfFile} function did not contain a require field: <${entryStr}>`);
  }
  readFunctionJS(funcDirPath, funcConf.file);
};

// Assumes a single function.
const getFuncConf = function getFuncConf(binarisConf, funcName) {
  const funcSection = getFunctionsSection(binarisConf);
  // ensure our configuration has the correct function
  if (!Object.prototype.hasOwnProperty.call(funcSection, funcName)) {
    throw new Error(`Your ${binarisConfFile} did not contain function ${funcName}`);
  }
  const funcConf = funcSection[funcName];
  return funcConf;
};

const addFuncConf = function addFuncConf(binarisConf, funcName, funcConf) {
  const funcSection = getFunctionsSection(binarisConf);
  if (Object.prototype.hasOwnProperty.call(funcSection, funcName)) {
    throw new Error(`Your ${binarisConfFile} already contain function ${funcName}`);
  }
  funcSection[funcName] = JSON.parse(JSON.stringify(funcConf));
};

const delFuncConf = function delFuncConf(binarisConf, funcName) {
  const funcSection = getFunctionsSection(binarisConf);
  if (!Object.prototype.hasOwnProperty.call(funcSection, funcName)) {
    throw new Error(`Your ${binarisConfFile} did not contain function ${funcName}`);
  }
  delete funcSection[funcName];
};

const init = async function init(functionName, functionPath) {
  if (!functionName) {
    throw new Error('Invalid function name provided!');
  }
  if (!functionPath) {
    throw new Error('Invalid function path provided!');
  }

  log.debug('attempting to load template files for function dir creation');
  // parse our templated yml and make the necessary modifications
  const templatePath = path.join(__dirname, templateDir);
  const binarisConf = loadBinarisConf(templatePath);
  const templateName = getFuncName(binarisConf);
  const funcConf = getFuncConf(binarisConf, templateName);
  // replace the generic function name with the actual name
  addFuncConf(binarisConf, functionName, funcConf);
  delFuncConf(binarisConf, templateName);

  const newDir = path.join(functionPath, functionName);
  // ensure that the function directory doesn't already exist
  try {
    fs.mkdirSync(newDir);
  } catch (err) {
    log.debug(err);
    throw new Error(`Function ${functionName} could not be initialized because a directory already exists with that name!`);
  }
  log.debug('loading and replicating all template files');

  // now we have to write out all our files that we've modified
  const file = funcConf.file;
  fs.writeFileSync(path.join(newDir, file),
    fs.readFileSync(path.join(__dirname, templateDir, file)));
  saveBinarisConf(newDir, binarisConf);
};

module.exports = {
  attemptJSONParse,
  genBinarisDir,
  genTarBall,
  loadBinarisConf,
  saveBinarisConf,
  getFuncName,
  getFuncConf,
  checkFuncConf,
  addFuncConf,
  delFuncConf,
  init,
  log,
};
