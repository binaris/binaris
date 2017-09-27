const fs = require('fs');
const path = require('path');

const targz = require('targz');

const log = require('./logger');
const YMLUtil = require('./binarisYML');
const { deploy } = require('../sdk');

const binarisDir = '.binaris/';
const ignoredTarFiles = ['.git', '.binaris', 'binaris.yml'];

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

// simply handles the process of deploying a function and its
// associated metadata to the Binaris cloud
const deployCLI = async function deployCLI(funcPath) {
  // this should throw an error when it fails
  const fullIgnorePaths = [];
  ignoredTarFiles.forEach((entry) => {
    fullIgnorePaths.push(path.join(funcPath, entry));
  });
  const binarisConf = YMLUtil.loadBinarisConf(funcPath);
  const funcName = YMLUtil.getFuncName(binarisConf);
  const funcConf = YMLUtil.getFuncConf(binarisConf, funcName);
  log.debug('funcConf is', funcConf);
  YMLUtil.checkFuncConf(funcConf, funcPath);
  const funcTarPath = path.join(genBinarisDir(funcPath), `${funcName}.tgz`);
  await genTarBall(funcPath, funcTarPath, fullIgnorePaths);
  await deploy(funcName, funcConf, funcTarPath);
};

module.exports = deployCLI;
