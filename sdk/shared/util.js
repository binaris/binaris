const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const log = require('../shared/logger');

const binarisYMLPath = 'binaris.yml';
const packageJSONPath = 'package.json';

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
    const fullYAMLPath = path.join(funcDirPath, binarisYMLPath);
    const YAMLObj = yaml.safeLoad(fs.readFileSync(fullYAMLPath, 'utf8'));
    return YAMLObj;
  } catch (err) {
    log.debug(err);
    throw new Error(`Failed to load binaris.yml file @path ${funcDirPath}`);
  }
};

// this loads our package.json file from the users current
// function directory. If it does not exist in the expected
// location the object returned will have a false 'success'
// field and a associated error field
const loadPackageJSON = function loadPackageJSON(funcDirPath) {
  try {
    const fullJSONPath = path.join(funcDirPath, packageJSONPath);
    // eslint doesn't understand this case
    const JSONObj = require(fullJSONPath);
    return JSONObj;
  } catch (err) {
    log.debug(err);
    throw new Error(`Failed to load package.json file @path ${funcDirPath}`);
  }
};

// this loads our _______.js file from the users current
// function directory. It determines the correct name of the
// file by inspecting the functions package.json main field.
// If it does not exist in the expected location the object
// returned will have a false 'success' field and a
// associated error field
const loadFunctionJS = function loadFunctionJS(funcDirPath, packageJSON) {
  if (Object.prototype.hasOwnProperty.call(packageJSON, 'main')) {
    const JSFileName = packageJSON.main;
    const fullJSPath = path.join(funcDirPath, JSFileName);
    const JSFile = fs.readFileSync(fullJSPath, 'utf8');
    return JSFile;
  }
  throw new Error('The package.json file did not contain a main field!');
};

// loads all our files at once handling the potential errors in
// batch. Unfortunately the load still needs to be done in sync
// because of file dependencies
const loadAllFiles = async function loadAllFiles(funcDirPath) {
  const packageJSON = loadPackageJSON(funcDirPath);
  const JSFile = loadFunctionJS(funcDirPath, packageJSON);
  const binarisYML = loadBinarisYML(funcDirPath);
  return {
    binarisYML,
    packageJSON,
    JSFile,
  };
};

// determines the current functions entrypoint based on the data
// available in the binarisYML
const getFuncEntry = function getFuncEntry(binarisYML) {
  const funcStr = 'function';
  const entryStr = 'entrypoint';
  // ensure that our YML was populated by the correct fields
  if (Object.prototype.hasOwnProperty.call(binarisYML, funcStr)) {
    const funcObj = binarisYML[funcStr];
    const funcKeys = Object.keys(funcObj);
    // We do not yet support multiple functions per yaml
    if (funcKeys.length !== 1) {
      throw new Error('Your binaris.yml function field did not contain an appropriate definition');
    }
    const name = funcKeys[0];
    const defObj = funcObj[name];
    if (Object.prototype.hasOwnProperty.call(defObj, entryStr)) {
      return defObj.entrypoint;
    }
    throw new Error('Your binaris.yml function did not contain a require field: <entrypoint>');
  }
  throw new Error('Your binaris.yml did not contain a require field: <function>');
};

// helper to create an object with key information about
// a function and its config
const getFuncMetadata = function getFuncMetaData(binarisYML, packageJSON) {
  const metadata = {};
  try {
    metadata.entrypoint = getFuncEntry(binarisYML);
    metadata.file = packageJSON.main;
    metadata.name = packageJSON.name;
    return metadata;
  } catch (err) {
    log.debug('failed to extract metadata', err);
    throw err;
  }
};


module.exports = {
  attemptJSONParse,
  loadBinarisYML,
  loadPackageJSON,
  loadFunctionJS,
  loadAllFiles,
  getFuncMetadata,
};
