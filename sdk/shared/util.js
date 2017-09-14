const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const logger = require('./loggerInit.js');

const binarisYMLPath = 'binaris.yml';
const packageJSONPath = 'package.json';

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
    //throw new Error(`failed to load JS file @path ${funcDirPath}`);
  }
};

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

module.exports = {
  loadBinarisYML,
  loadPackageJSON,
  loadFunctionJS,
  loadAllFiles,
};
