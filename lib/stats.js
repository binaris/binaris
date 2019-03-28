'use strict';

const { stats } = require('../sdk');
const { getAccountId, getAPIKey } = require('./userConf');

/**
 * Retrieves account usage statistics
 *
 * @param {moment} since - get stats since (inclusive)
 * @param {moment} until - get stats until (non-inclusive)
 */
const statsCLI = async function statsCLI(since, until) {
  const apiKey = await getAPIKey();
  const accountId = await getAccountId();
  return stats(accountId, apiKey, since, until);
};

module.exports = statsCLI;
