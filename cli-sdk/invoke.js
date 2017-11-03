const { getApiKey } = require('./userConf');
const { invoke } = require('../sdk');

// invokes a binaris function that has been previously
// deployed either through the CLI or other means
const invokeCLI = async function invokeCLI(funcPath, funcName, funcData) {
  const apiKey = await getApiKey();
  return invoke(apiKey, funcName, funcData);
};

module.exports = invokeCLI;
