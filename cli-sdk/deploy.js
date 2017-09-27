const path = require('path');

const log = require('./logger');
const util = require('./util');
const { deploy } = require('../sdk');

const ignoredTarFiles = ['.git', '.binaris', 'binaris.yml'];

// simply handles the process of deploying a function and its
// associated metadata to the Binaris cloud
const deployCLI = async function deployCLI(funcPath) {
  // this should throw an error when it fails
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

module.exports = deployCLI;
