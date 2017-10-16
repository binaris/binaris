const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const { compress } = require('targz');

const tgzCompress = promisify(compress);

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
    throw new Error(`Error creating working directory: ${binarisDir}`);
  }
  return fullPath;
};

const genTarBall = async function genTarBall(dirToTar, dest, ignoredFiles) {
  await tgzCompress({
    src: dirToTar,
    dest,
    tar: {
      ignore: name => ignoredFiles.includes(name),
    },
  });
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
  log.debug({ funcConf });
  YMLUtil.checkFuncConf(funcConf, funcPath);
  const funcTarPath = path.join(genBinarisDir(funcPath), `${funcName}.tgz`);
  await genTarBall(funcPath, funcTarPath, fullIgnorePaths);
  return deploy(funcName, funcConf, funcTarPath);
};

module.exports = deployCLI;
