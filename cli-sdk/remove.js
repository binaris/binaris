const { remove } = require('../sdk');
const YMLUtil = require('./binarisYML');

const removeCLI = async function removeCLI(funcName, funcPath) {
  const binarisConf = YMLUtil.loadBinarisConf(funcPath);
  const configuredFuncName = YMLUtil.getFuncName(binarisConf);
  return remove(funcName || configuredFuncName);
};

module.exports = removeCLI;
