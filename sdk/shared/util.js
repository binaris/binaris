const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const binarisYMLPath = 'binaris.yml';
const packageJSONPath = 'package.json';

// this loads our binaris.yml file from the users current
// function directory. If it does not exist in the expected
// location the object returned will have a false 'success'
// field and a associated error field
const loadBinarisYML = async function loadBinarisYML(funcDirPath) {
  const completionObj = {
    success: false,
  };
  try {
    const fullYAMLPath = path.join(funcDirPath, binarisYMLPath);
    if (fs.existsSync(fullYAMLPath)) {
      const YAMLObj = yaml.safeLoad(fs.readFileSync(fullYAMLPath, 'utf8'));
      completionObj.success = true;
      completionObj.data = YAMLObj;
    } else {
      completionObj.error = `no binaris.yml file was found @path ${fullYAMLPath}`;
    }
  } catch (err) {
    completionObj.error = err;
  }
  return completionObj;
};

// this loads our package.json file from the users current
// function directory. If it does not exist in the expected
// location the object returned will have a false 'success'
// field and a associated error field
const loadPackageJSON = async function loadPackageJSON(funcDirPath) {
  const completionObj = {
    success: false,
  };

  try {
    const fullJSONPath = path.join(funcDirPath, packageJSONPath);
    if (fs.existsSync(fullJSONPath)) {
      // eslint doesn't understand this case
      const JSONObj = require(fullJSONPath);
      completionObj.success = true;
      completionObj.data = JSONObj;
    } else {
      completionObj.error = `no package.json file was found @path ${fullJSONPath}`;
    }
  } catch (err) {
    completionObj.error = err;
  }
  return completionObj;
};

// this loads our _______.js file from the users current
// function directory. It determines the correct name of the
// file by inspecting the functions package.json main field.
// If it does not exist in the expected location the object
// returned will have a false 'success' field and a
// associated error field
const loadFunctionJS = async function loadFunctionJS(funcDirPath, packageJSON) {
  const completionObj = {
    success: false,
  };

  try {
    if (Object.prototype.hasOwnProperty.call(packageJSON, 'main')) {
      const JSFileName = packageJSON.main;
      const fullJSPath = path.join(funcDirPath, JSFileName);
      if (fs.existsSync(fullJSPath)) {
        const JSFile = fs.readFileSync(fullJSPath, 'utf8');
        completionObj.success = true;
        completionObj.data = JSFile;
      } else {
        completionObj.error = `no JS file could be located @path ${fullJSPath}`;
      }
    } else {
      completionObj.error = 'package.json file did not contain a main field!';
    }
  } catch (err) {
    completionObj.error = err;
  }
  return completionObj;
};

const loadAllFiles = async function loadAllFiles(funcDirPath) {
  const completionObj = {
    success: false,
  };

  const packageJSONObj = await loadPackageJSON(funcDirPath);
  if (packageJSONObj.success) {
    const packageJSON = packageJSONObj.data;
    const JSFileObj = await loadFunctionJS(funcDirPath, packageJSON);
    if (JSFileObj.success) {
      const JSFile = JSFileObj.data;
      const binarisYMLObj = await loadBinarisYML(funcDirPath);
      if (binarisYMLObj.success) {
        const binarisYML = binarisYMLObj.data;
        completionObj.success = true;
        completionObj.data = {
          binarisYML,
          packageJSON,
          JSFile,
        };
      } else {
        completionObj.error = binarisYMLObj.error;
      }
    } else {
      completionObj.error = JSFileObj.error;
    }
  } else {
    completionObj.error = packageJSONObj.error;
  }
  return completionObj;
};

module.exports = {
  loadBinarisYML,
  loadPackageJSON,
  loadFunctionJS,
  loadAllFiles,
};
