const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const log = require('../shared/logger');

const binarisConfFile = 'binaris.yml';
const funcStr = 'functions';
const entryStr = 'entrypoint';
const fileStr = 'file';

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
    const binarisConf = yaml.safeLoad(fs.readFileSync(fullYAMLPath, 'utf8'));
    return binarisConf;
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
const readFunctionJS = function readFunctionJS(funcDirPath, JSFileName) {
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

const checkFuncConf = function checkFuncConf(funcConf, funcDirPath) {
  if (!Object.prototype.hasOwnProperty.call(funcConf, fileStr)) {
    throw new Error(`Your ${binarisConfFile} function did not contain a require field: <${fileStr}>`);
  }
  if (!Object.prototype.hasOwnProperty.call(funcConf, entryStr)) {
    throw new Error(`Your ${binarisConfFile} function did not contain a require field: <${entryStr}>`);
  }
  const JSFile = readFunctionJS(funcDirPath, funcConf.file);
}

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
  return funcConf;
};

module.exports = {
  attemptJSONParse,
  loadBinarisConf,
  getFuncName,
  getFuncConf,
  checkFuncConf,
};
