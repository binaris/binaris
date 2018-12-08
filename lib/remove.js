'use strict';

const { remove } = require('../sdk');
const { getAccountId, getAPIKey } = require('./userConf');

/**
 * Removes the function from the Binaris cloud.
 *
 * @param {string} funcName - the name of the function to remove
 */
const removeCLI = async function removeCLI(funcName) {
  const apiKey = await getAPIKey();
  const accountId = await getAccountId(undefined);
  return remove(accountId, funcName, apiKey);
};

module.exports = removeCLI;
