const path = require('path');

const log = require('../shared/logger');
const util = require('../shared/util');
const { deploy } = require('../../sdk');

const ignoredTarFiles = ['.git', '.binaris', 'binaris.yml'];

// simply handles the process of deploying a function and its
// associated metadata to the Binaris cloud
const deployHelper = async function deployHelper(funcPath) {
  // this should throw an error when it fails
  util.validateBinarisLogin();
  const fullIgnorePaths = [];
  ignoredTarFiles.forEach((entry) => {
    fullIgnorePaths.push(path.join(funcPath, entry));
  });
  const binarisConf = util.loadBinarisConf(funcPath);
  const funcName = util.getFuncName(binarisConf);
  const funcConf = util.getFuncConf(binarisConf, funcName);
  log.debug('funcConf is', funcConf);
  util.checkFuncConf(funcConf, funcPath);
  const funcTarPath = path.join(util.genBinarisDir(funcPath), `${funcName}.tgz`);
  await util.genTarBall(funcPath, funcTarPath, fullIgnorePaths);
  await deploy(funcName, funcConf, funcTarPath);
};

module.exports = deployHelper;
