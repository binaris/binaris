const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const logger = require('./loggerInit.js');

const binarisYMLPath = 'binaris.yml';
const packageJSONPath = 'package.json';

// attempts to parse a json and throws if an issue is encountered
const attemptJSONParse = async function attemptJSONParse(rawJSON) {
  try {
    const parsedJSON = JSON.parse(rawJSON);
    if (parsedJSON && typeof parsedJSON === 'object') {
      return parsedJSON;
    }
  } catch (err) {
    logger.binaris.debug(err);
  }
  throw new Error('invalid JSON received, unable to parse');
};

// this loads our binaris.yml file from the users current
// function directory. If it does not exist in the expected
// location the object returned will have a false 'success'
// field and a associated error field
const loadBinarisYML = async function loadBinarisYML(funcDirPath) {
  try {
    const fullYAMLPath = path.join(funcDirPath, binarisYMLPath);
    if (fs.existsSync(fullYAMLPath)) {
      const YAMLObj = yaml.safeLoad(fs.readFileSync(fullYAMLPath, 'utf8'));
      return YAMLObj;
    }
    throw new Error(`no binaris.yml file was found @path ${fullYAMLPath}`);
  } catch (err) {
    logger.binaris.debug(err);
    throw new Error(`failed to load binaris.yml file @path ${funcDirPath}`);
  }
};

// this loads our package.json file from the users current
// function directory. If it does not exist in the expected
// location the object returned will have a false 'success'
// field and a associated error field
const loadPackageJSON = async function loadPackageJSON(funcDirPath) {
  try {
    const fullJSONPath = path.join(funcDirPath, packageJSONPath);
    if (fs.existsSync(fullJSONPath)) {
      // eslint doesn't understand this case
      const JSONObj = require(fullJSONPath);
      return JSONObj;
    }
    throw new Error(`no package.json file was found @path ${fullJSONPath}`);
  } catch (err) {
    logger.binaris.debug(err);
    throw new Error(`failed to load package.json file @path ${funcDirPath}`);
  }
};

// this loads our _______.js file from the users current
// function directory. It determines the correct name of the
// file by inspecting the functions package.json main field.
// If it does not exist in the expected location the object
// returned will have a false 'success' field and a
// associated error field
const loadFunctionJS = async function loadFunctionJS(funcDirPath, packageJSON) {
  try {
    if (Object.prototype.hasOwnProperty.call(packageJSON, 'main')) {
      const JSFileName = packageJSON.main;
      const fullJSPath = path.join(funcDirPath, JSFileName);
      if (fs.existsSync(fullJSPath)) {
        const JSFile = fs.readFileSync(fullJSPath, 'utf8');
        return JSFile;
      }
      throw new Error(`no JS file could be located @path ${fullJSPath}`);
    } else {
      throw new Error('package.json file did not contain a main field!');
    }
  } catch (err) {
    logger.binaris.debug(err);
    throw err;
  }
};

// loads all our files at once handling the potential errors in
// batch. Unfortunately the load still needs to be done in sync
// because of file dependencies
const loadAllFiles = async function loadAllFiles(funcDirPath) {
  try {
    const packageJSON = await loadPackageJSON(funcDirPath);
    const JSFile = await loadFunctionJS(funcDirPath, packageJSON);
    const binarisYML = await loadBinarisYML(funcDirPath);
    return {
      binarisYML,
      packageJSON,
      JSFile,
    };
  } catch (err) {
    throw err;
  }
};

// determines the current functions entrypoint based on the data
// available in the binarisYML
const getFuncEntry = async function getFuncEntry(binarisYML) {
  const funcStr = 'function';
  // ensure that our YML was populated by the correct fields
  if (Object.prototype.hasOwnProperty.call(binarisYML, funcStr)) {
    const funcObj = binarisYML[funcStr];
    const funcKeys = Object.keys(funcObj);
    if (funcKeys.length !== 1) {
      throw new Error('binarisYML function field did not contain an appropriate definition');
    }
    const defKey = funcKeys[0];
    const defObj = funcObj[defKey];
    const defKeys = Object.keys(defObj);
    if (defKeys.length !== 1) {
      throw new Error('binarisYML function-defintion field did not contain an appropriate definition');
    }
    // here we split between the file name and entrypoint
    return defObj[defKeys[0]].split('.')[1];
  }
  throw new Error('binarisYML did not contain a require field: <function>');
};

// helper to create an object with key information about
// a function and its config
const getFuncMetadata = async function getFuncMetaData(binarisYML, packageJSON) {
  const metadata = {};
  try {
    metadata.entrypoint = await getFuncEntry(binarisYML);
    metadata.main = packageJSON.main;
    metadata.name = packageJSON.name;
    return metadata;
  } catch (err) {
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
