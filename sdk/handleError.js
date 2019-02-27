'use strict';

const get = require('lodash.get');
const { inspect } = require('util');
const rp = require('request-promise-native');

const logger = require('../lib/logger');

const { maybeTranslateErrorCode } = require('binaris-pickle');

const { version } = require('../package.json');

class APIError extends Error {
  constructor(message, requestId) {
    super(message);
    const requestIdString = requestId ? `RequestId: ${requestId}\n` : '';
    this.message = `${requestIdString}${message}`;
  }
}

function validateResponse(response) {
  const requestId = get(response, 'headers.x-binaris-request-id');
  const errorCode = get(response, 'body.errorCode');
  if (errorCode) {
    const readableErrorMessage = maybeTranslateErrorCode(errorCode);
    if (readableErrorMessage) {
      throw new APIError(`Error: ${readableErrorMessage}`, requestId);
    }
  }

  // An error is anything with an error message, or any error code
  // with an untranslated message.
  const errorText = get(response, 'body.error') || (errorCode && get(response, 'body.message'));
  if (errorText) {
    throw new APIError(errorText, requestId);
  }

  if (errorCode) {
    throw new APIError(`Error: ${errorCode}`, requestId);
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new APIError(`Unexpected response ${response.statusCode}`, requestId);
  }

  return response;
}

async function loggedRequest(options, type = 'post') {
  const response = await rp[type]({
    json: true,
    simple: false,
    resolveWithFullResponse: true,
    ...options,
    headers: {
      ...(options.headers || {}),
      'X-Binaris-Client-Version': version,
    },
  });
  logger.debug('raw response', inspect(response, { depth: null }));
  return response;
}

async function getValidatedBody(options, type = 'post') {
  const response = await loggedRequest(options, type);
  return validateResponse(response).body;
}

module.exports = {
  APIError,
  getValidatedBody,
  loggedRequest,
  validateResponse,
  version,
};
