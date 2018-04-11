const urljoin = require('urljoin');
const rp = require('request-promise-native');

const { getInvokeEndpoint } = require('./config');
const logger = require('../lib/logger');

/**
 * Invokes a previously deployed Binaris function.
 *
 * @param {string} funcName - name of the function to invoke
 * @param {string} apiKey - Binaris API key used to authenticate function invocation
 * @param {string} funcData - valid JSON string to send with your invocation
 *
 * @returns {object} - response of function invocation
 */
const invoke = async function invoke(funcName, apiKey, funcData) {
  const options = {
    url: urljoin(`https://${getInvokeEndpoint()}`, 'v1', 'run', apiKey, funcName),
    headers: { 'Content-Type': 'application/json' },
    body: funcData,
    resolveWithFullResponse: true,
  };
  logger.debug('Invoking function', options);
  const res = await rp.post(options);
  const { statusCode, headers, body } = res;
  logger.debug('Invoke response', { statusCode, headers, body });
  return res;
};

module.exports = invoke;
