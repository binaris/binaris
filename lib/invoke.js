'use strict';

const { getAccountId, getAPIKey } = require('./userConf');
const { invoke } = require('../sdk');

/**
 * Invokes a previously deployed Binaris function.
 *
 * @param {string} funcName - name of the function to invoke
 * @param {string} funcData - valid JSON string to send with function invocation
 * @param {string} methodName - name of HTTP method to invoke (default POST).
 *
 * @returns {object} - response of function invocation
 */
const invokeCLI = async function invokeCLI(funcName, funcData, methodName) {
  const apiKey = await getAPIKey();
  const accountId = await getAccountId(undefined);
  return invoke(accountId, funcName, apiKey, funcData, methodName && methodName.toUpperCase());
};

module.exports = invokeCLI;
