'use strict';

const { loadTest } = require('loadtest');

const { getInvokeUrl } = require('./url');
const logger = require('../lib/logger');

/**
 * Run performance measurements on deployed function
 *
 * @param {string} accountId - Binaris account id
 * @param {string} funcName - name of the function to invoke
 * @param {string} apiKey - API Key
 * @param {number} maxRequests - How many invocations in total
 * @param {number} concurrency - How many invocations run in parallel
 * @param {number} maxSeconds - Maximum seconds to run
 *
 * @returns {object} - latency report (based on the loadtest npm package)
 */
const perf = async function perf(
  accountId, funcName, apiKey, maxRequests, concurrency, funcData, maxSeconds,
) {
  const baseHeaders = apiKey ? { 'X-Binaris-Api-Key': apiKey } : {};
  const options = {
    url: getInvokeUrl(accountId, funcName, apiKey),
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/json',
    },
    body: funcData,
    // body: TODO: add optional json body
    concurrency,
    maxRequests,
    maxSeconds,
    agentKeepAlive: true,
  };
  logger.debug('Running perf test on function', options);
  const report = await new Promise((res, rej) => {
    loadTest(options, (err, result) => {
      if (err) {
        rej(err);
      } else {
        res(result);
      }
    });
  });
  logger.debug('Perf report', { report });
  return report;
};

module.exports = perf;
