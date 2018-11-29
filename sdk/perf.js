'use strict';

const urljoin = require('urljoin');
const { loadTest } = require('loadtest');

const { getInvokeEndpoint } = require('./config');
const logger = require('../lib/logger');

/**
 * Run performance measurements on deployed function
 *
 * @param {string} apiKey - API Key
 * @param {string} funcName - name of the function to invoke
 * @param {number} maxRequests - How many invocations in total
 * @param {number} concurrency - How many invocations run in parallel
 * @param {number} maxSeconds - Maximum seconds to run
 *
 * @returns {object} - latency report (based on the loadtest npm package)
 */
const perf = async function perf(apiKey, funcName, maxRequests, concurrency, funcData, maxSeconds) {
  const options = {
    url: urljoin(`https://${getInvokeEndpoint()}`, 'v1', 'run', apiKey, funcName),
    headers: { 'Content-Type': 'application/json' },
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
