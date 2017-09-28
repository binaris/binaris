const YMLUtil = require('./binarisYML');
const { invoke } = require('../sdk');

// invokes a binaris function that you have previously
// deployed either through the CLI or other means
const invokeCLI = async function invokeCLI(funcPath, funcData) {
  const binarisConf = YMLUtil.loadBinarisConf(funcPath);
  const funcName = YMLUtil.getFuncName(binarisConf);
  return invoke(funcName, funcData);
};

module.exports = invokeCLI;
