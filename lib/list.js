const { getAPIKey } = require('./userConf');
const { list } = require('../sdk');

/**
 * Run performance measurements on deployed function
 *
 * @param {string} funcName - name of the function to invoke
 * @param {number} maxRequests - How many invocations in total
 * @param {number} concurrency - How many invocations run in parallel
 *
 * @returns {object} - latency report (based on the loadtest npm package)
 */
const listCLI = async function listCLI() {
  const apiKey = await getAPIKey();
  return list(apiKey);
};

module.exports = listCLI;
