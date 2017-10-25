const { remove } = require('../sdk');
const log = require('./logger');
const YMLUtil = require('./binarisYML');
const { getApiKey } = require('./userConf');

const removeCLI = async function removeCLI(funcName, funcPath) {
  const apiKey = await getApiKey();
  if (funcName) {
    return remove(apiKey, funcName);
  }

  let configuredFuncName;
  try {
    const binarisConf = await YMLUtil.loadBinarisConf(funcPath);
    configuredFuncName = YMLUtil.getFuncName(binarisConf);
  } catch (err) {
    log.verbose('Failed to read config file', { err, functionName: funcName, path: funcPath });
    throw new Error(`Failed to read config file for ${funcPath}; specify function name to remove.`);
  }
  return remove(apiKey, configuredFuncName);
};

module.exports = removeCLI;
