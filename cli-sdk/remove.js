const { remove } = require('../sdk');
const log = require('./logger');
const YMLUtil = require('./binarisYML');

const removeCLI = async function removeCLI(funcName, funcPath) {
  if (funcName) {
    return remove(funcName);
  }

  let configuredFuncName;
  try {
    const binarisConf = YMLUtil.loadBinarisConf(funcPath);
    configuredFuncName = YMLUtil.getFuncName(binarisConf);
  } catch (err) {
    log.verbose('Failed to read config file', { err, functionName: funcName, path: funcPath });
    throw new Error(`Failed to read config file for ${funcPath}; specify function name to remove!`);
  }
  return remove(configuredFuncName);
};

module.exports = removeCLI;
