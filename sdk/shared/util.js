const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const log = require('../shared/logger');

const binarisConfFile = 'binaris.yml';
const funcStr = 'function';

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

// this loads our binaris.yml file from the users current
// function directory. If it does not exist in the expected
// location the object returned will have a false 'success'
// field and a associated error field
const loadBinarisConf = function loadBinarisConf(funcDirPath) {
  try {
    const fullYAMLPath = path.join(funcDirPath, binarisConfFile);
    const YAMLObj = yaml.safeLoad(fs.readFileSync(fullYAMLPath, 'utf8'));
    return YAMLObj;
  } catch (err) {
    log.debug(err);
    throw new Error(`${funcDirPath} does not contain a valid binaris function!`);
  }
};

// this loads our _______.js file from the users current
// function directory. It determines the correct name of the
// file by inspecting the functions package.json main field.
// If it does not exist in the expected location the object
// returned will have a false 'success' field and a
// associated error field
const loadFunctionJS = function loadFunctionJS(funcDirPath, JSFileName) {
  const fullJSPath = path.join(funcDirPath, JSFileName);
  const JSFile = fs.readFileSync(fullJSPath, 'utf8');
  return JSFile;
};

// Assumes a single function.
const getFuncName = function getFuncName(binarisConf) {
  // ensure that our YML was populated by the correct fields
  if (!Object.prototype.hasOwnProperty.call(binarisConf, funcStr)) {
    throw new Error(`Your ${binarisConfFile} did not contain a require field: <${funcStr}>`);
  }
  const funcSection = binarisConf[funcStr];
  const funcKeys = Object.keys(funcSection);
  // There's not yet support for multiple functions per yaml
  // The first (and only) entry is used
  if (funcKeys.length !== 1) {
    throw new Error(`Your ${binarisConfFile} ${funcStr} section did not contain an appropriate definition`);
  }
  const funcName = funcKeys[0];
  return funcName;
};

// Assumes a single function.
const getFuncConf = function getFuncConf(binarisConf, funcName) {
  // ensure that our YML was populated by the correct fields
  if (!Object.prototype.hasOwnProperty.call(binarisConf, funcStr)) {
    throw new Error(`Your ${binarisConfFile} did not contain a require field: <${funcStr}>`);
  }
  const funcSection = binarisConf[funcStr];
  if (!Object.prototype.hasOwnProperty.call(funcSection, funcName)) {
    throw new Error(`Your ${binarisConfFile} did not contain function ${funcName}`);
  }
  const funcConf = funcSection[funcName];

  // verify all fields?
  // see getFuncEntry
  return funcConf;
};

// loads all our files at once handling the potential errors in
// batch. Unfortunately the load still needs to be done in sync
// because of file dependencies
const loadAllFiles = async function loadAllFiles(funcDirPath) {
  const binarisConf = loadBinarisConf(funcDirPath);
  const conf = getFunctionConf(binarisConf);
  const JSFile = loadFunctionJS(funcDirPath, conf.file);
  return {
    binarisConf,
    JSFile,
  };
};

// determines the current functions entrypoint based on the data
// available in the binarisConf
const getFuncEntry = function getFuncEntry(binarisConf) {
  const funcConf = getFuncConf(binarisConf)
  const entryStr = 'entrypoint';
  if (!Object.prototype.hasOwnProperty.call(funcConf, entryStr)) {
    throw new Error(`Your ${binarisConfFile} function did not contain a require field: <entrypoint>`);
  }
  return funcConf[entryStr];
};

module.exports = {
  attemptJSONParse,
  loadBinarisConf,
  loadAllFiles,
  getFuncName,
  getFuncConf,
};
