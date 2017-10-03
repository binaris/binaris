const { remove } = require('../sdk');
const log = require('./logger');
const YMLUtil = require('./binarisYML');

const removeCLI = async function removeCLI(funcName, funcPath) {
  let configuredFuncName;
  try {
    const binarisConf = YMLUtil.loadBinarisConf(funcPath);
    configuredFuncName = YMLUtil.getFuncName(binarisConf);
  } catch (err) {
    log.verbose('Failed to read config file', { err, functionName: funcName, path: funcPath });
    // OK if functionName specified.
  }
  return remove(funcName || configuredFuncName);
};

module.exports = removeCLI;
