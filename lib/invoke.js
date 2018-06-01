const { getAPIKey } = require('./userConf');
const { invoke } = require('../sdk');

/**
 * Invokes a previously deployed Binaris function.
 *
 * @param {string} funcName - name of the function to invoke
 * @param {string} funcPath - path of the function to invoke
 * @param {string} funcData - valid JSON string to send with function invocation
 *
 * @returns {object} - response of function invocation
 */
const invokeCLI = async function invokeCLI(funcName, funcData) {
  const apiKey = await getAPIKey();
  return invoke(funcName, apiKey, funcData);
};

module.exports = invokeCLI;
