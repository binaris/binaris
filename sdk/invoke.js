'use strict';

const rp = require('request-promise-native');
const { StatusCodeError } = require('request-promise-native/errors');

const { getInvokeUrl } = require('./url');
const logger = require('../lib/logger');

/**
 * Invokes a previously deployed Binaris function.
 *
 * @param {string} accountId - Binaris account id
 * @param {string} funcName - name of the function to invoke
 * @param {string} apiKey - Optional Binaris API key used to authenticate function invocation
 * @param {string} funcData - valid JSON string to send with your invocation
 *
 * @returns {object} - response of function invocation
 */
const invoke = async function invoke(accountId, funcName, apiKey, funcData) {
  const baseHeaders = apiKey ? { 'X-Binaris-Api-Key': apiKey } : {};
  const options = {
    url: getInvokeUrl(accountId, funcName, apiKey),
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/json',
    },
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
    if (err instanceof StatusCodeError) {
      const requestId = err.response.headers['x-binaris-request-id'];
      const parsedError = JSON.parse(err.error);
      const fullError = [`RequestId: ${requestId}`, parsedError.error || parsedError.message];

      if (parsedError.stack) {
        fullError.push(parsedError.stack);
      }
      throw new Error(fullError.join('\n'));
    }

    throw new Error(err.error || err);
  }
};

module.exports = invoke;
