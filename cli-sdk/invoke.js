const YMLUtil = require('./binarisYML');
const { invoke } = require('../sdk');

// invokes a binaris function that you have previously
// deployed either through the CLI or other means
const invokeCLI = async function invokeCLI(funcPath, funcName, funcData) {
  const binarisConf = YMLUtil.loadBinarisConf(funcPath);
  const validFuncName = YMLUtil.getFuncName(binarisConf);
  if (validFuncName !== funcName) {
    throw new Error(`${funcName} is not a deployed function!`);
  }
  return invoke(validFuncName, funcData);
};

module.exports = invokeCLI;
