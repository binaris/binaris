const { remove } = require('../sdk');
const { getApiKey } = require('./userConf');

const removeCLI = async function removeCLI(funcName) {
  const apiKey = await getApiKey();
  return remove(apiKey, funcName);
};

module.exports = removeCLI;
