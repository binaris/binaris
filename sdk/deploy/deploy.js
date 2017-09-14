const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');
const colors = require('colors');

const util = require('../shared/util');
const logger = require('../shared/loggerInit');

const hiddenDir = '.binaris/';

const checkDirValidity = async function checkDirValidity(dirPath) {
  // things to check
  // 1. package.json
  // 2. binaris.yml
  // 3. handler.js
  // 4.
};

// creates our hidden .binaris directory in the users function
// directory if it doesn't already exist
const genHiddenDir = async function genHiddenDir(genPath) {
  try {
    const fullPath = path.join(genPath, hiddenDir);
    if (fs.existsSync(fullPath)) {
      return true;
    }
    fs.mkdirSync(fullPath);
    return true;
  } catch (err) {
    logger.binaris.error(err.red);
    return false;
  }
};

// we also need to ensure that the .binaris directory exists
// in the deployment directory

const deploy = async function (data) {
  const completionObj = {
    success: false,
  };

  const deployPath = data.functionPath;
  const functionFiles = await util.loadAllFiles(deployPath);
  if (functionFiles.success) {
    const packageJSON = functionFiles.data.packageJSON;
    const binarisYML = functionFiles.data.binarisYML;
    const JSFile = functionFiles.data.JSFile;
    if (genHiddenDir(deployPath)) {


      completionObj.success = true;
    } else {
      completionObj.error = `failed to generate .binaris directory @path ${deployPath}`;
    }
  } else {
    completionObj.error = functionFiles.error;
  }
  return completionObj;
};

module.exports = deploy;
