const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const log = require('../shared/logger');

const binarisYMLName = 'binaris.yml';
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
const loadBinarisYML = function loadBinarisYML(funcDirPath) {
  try {
    const fullYAMLPath = path.join(funcDirPath, binarisYMLName);
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
const getFuncName = function getFuncName(binarisYML) {
  // ensure that our YML was populated by the correct fields
  if (!Object.prototype.hasOwnProperty.call(binarisYML, funcStr)) {
    throw new Error(`Your ${binarisYMLName} did not contain a require field: <${funcStr}>`);
  }
  const funcSection = binarisYML[funcStr];
  const funcKeys = Object.keys(funcSection);
  // There's not yet support for multiple functions per yaml
  // The first (and only) entry is used
  if (funcKeys.length !== 1) {
    throw new Error(`Your ${binarisYMLName} ${funcStr} section did not contain an appropriate definition`);
  }
  const funcName = funcKeys[0];
  return funcName;
};

// Assumes a single function.
const getFuncConf = function getFuncConf(binarisYML, funcName) {
  // ensure that our YML was populated by the correct fields
  if (!Object.prototype.hasOwnProperty.call(binarisYML, funcStr)) {
    throw new Error(`Your ${binarisYMLName} did not contain a require field: <${funcStr}>`);
  }
  const funcSection = binarisYML[funcStr];
  if (!Object.prototype.hasOwnProperty.call(funcSection, funcName)) {
    throw new Error(`Your ${binarisYMLName} did not contain function ${funcName}`);
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
  const binarisYML = loadBinarisYML(funcDirPath);
  const conf = getFunctionConf(binarisYML);
  const JSFile = loadFunctionJS(funcDirPath, conf.file);
  return {
    binarisYML,
    JSFile,
  };
};

// determines the current functions entrypoint based on the data
// available in the binarisYML
const getFuncEntry = function getFuncEntry(binarisYML) {
  const funcConf = getFuncConf(binarisYML)
  const entryStr = 'entrypoint';
  if (!Object.prototype.hasOwnProperty.call(funcConf, entryStr)) {
    throw new Error(`Your ${binarisYMLName} function did not contain a require field: <entrypoint>`);
  }
  return funcConf[entryStr];
};

module.exports = {
  attemptJSONParse,
  loadBinarisYML,
  loadAllFiles,
  getFuncName,
  getFuncConf,
};
