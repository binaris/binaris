'use strict';

const rp = require('request-promise-native');

const { getInvokeUrl } = require('./url');
const logger = require('../lib/logger');

/**
 * Invokes a previously deployed Binaris function.
 *
 * @param {string} accountId - Binaris account id
 * @param {string} funcName - name of the function to invoke
 * @param {string} apiKey - Optional Binaris API key used to authenticate function invocation
 * @param {string} funcData - valid JSON string to send with your invocation
 * @param {string} methodName - uppercase name of HTTP method to use, default "POST"
 *
 * @returns {object} - response of function invocation
 */
const invoke = async function invoke(accountId, funcName, apiKey, funcData, methodName) {
  const baseHeaders = apiKey ? { 'X-Binaris-Api-Key': apiKey } : {};
  const options = {
    method: methodName || 'POST',
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
    const res = await rp(options);
    const { statusCode, headers, body } = res;
    logger.debug('Invoke response', { statusCode, headers, body });
    return res;
  } catch (err) {
    let parsedError;
    try {
      parsedError = JSON.parse(err.error);
    } catch (nestedErr) {
      logger.debug('Failed to parse JSON response', { nestedErr });
    }

    if (parsedError) {
      const errorOrMsg = parsedError.error || parsedError.message;
      if (parsedError.stack && errorOrMsg) {
        throw new Error(`${errorOrMsg}\n${parsedError.stack}`);
      }
      if (parsedError.message && parsedError.request_id) {
        throw new Error(`${parsedError.message}\nrequest_id: ${parsedError.request_id}`);
      }
    }

    throw new Error(err.error || err);
  }
};

module.exports = invoke;
