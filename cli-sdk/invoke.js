const YMLUtil = require('./binarisYML');
const { getApiKey } = require('./userConf');
const { invoke } = require('../sdk');

// invokes a binaris function that has been previously
// deployed either through the CLI or other means
const invokeCLI = async function invokeCLI(funcPath, funcName, funcData) {
  const binarisConf = await YMLUtil.loadBinarisConf(funcPath);
  const validFuncName = YMLUtil.getFuncName(binarisConf);
  if (validFuncName !== funcName) {
    throw new Error(`${funcName} is not a deployed function!`);
  }
  const apiKey = getApiKey();
  return invoke(apiKey, validFuncName, funcData);
};

module.exports = invokeCLI;
