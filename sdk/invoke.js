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
  try {
    const res = await rp.post(options);
    const { statusCode, headers, body } = res;
    logger.debug('Invoke response', { statusCode, headers, body });
    return res;
  } catch (err) {
    let parsedError;
    try {
      parsedError = JSON.parse(err.error);
    } catch (nestedErr) {
      throw new Error(err.error || err);
    }
    if (parsedError.stack && (parsedError.error || parsedError.message)) {
      throw new Error(`${parsedError.error || parsedError.message}\n${parsedError.stack}`);
    } else if (parsedError.message && parsedError.request_id) {
      throw new Error(`${parsedError.message}\nrequest_id: ${parsedError.request_id}`);
    }
    throw new Error(err.error || err);
  }
};

module.exports = invoke;
