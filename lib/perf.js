'use strict';

const { getAccountId, getAPIKey } = require('./userConf');
const { perf } = require('../sdk');

/**
 * Run performance measurements on deployed function
 *
 * @param {string} funcName - name of the function to invoke
 * @param {number} maxRequests - How many invocations in total
 * @param {number} concurrency - How many invocations run in parallel
 *
 * @returns {object} - latency report (based on the loadtest npm package)
 */
const perfCLI = async function perfCLI(funcName, maxRequests, concurrency, funcData, maxSeconds) {
  const accountId = await getAccountId(undefined);
  const apiKey = await getAPIKey();
  return perf(accountId, funcName, apiKey, maxRequests, concurrency, funcData, maxSeconds);
};

module.exports = perfCLI;
