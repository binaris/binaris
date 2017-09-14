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
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }
  } catch (err) {
    throw err;
  }
};

const deploy = async function (data) {
  const deployPath = data.functionPath;
  try {
    const functionFiles = await util.loadAllFiles(deployPath);
    const packageJSON = functionFiles.packageJSON;
    const binarisYML = functionFiles.binarisYML;
    const JSFile = functionFiles.JSFile;
    await genHiddenDir(deployPath);
    return;
  } catch (err0) {
    throw err0;
  }
};

module.exports = deploy;
