'use strict';

const get = require('lodash.get');
const { inspect } = require('util');
const rp = require('request-promise-native');

const logger = require('../lib/logger');

const { maybeTranslateErrorCode } = require('binaris-pickle');

const { version } = require('../package.json');

class APIError extends Error {}

function appendDebugId(message, debugId) {
  if (debugId) {
    return `${message}\nPlease refer to the request ID: ${debugId} for support on this error`;
  }
  return message;
}

function validateResponse(response) {
  const errorCode = get(response, 'body.errorCode');
  const debugId = get(response, 'body.debugId');
  if (errorCode) {
    const readableErrorMessage = maybeTranslateErrorCode(errorCode);
    if (readableErrorMessage) {
      throw new APIError(appendDebugId(`Error: ${readableErrorMessage}`, errorCode === 'ERR_INTERNAL' && debugId));
    }
  }

  // An error is anything with an error message, or any error code
  // with an untranslated message.
  const errorText = get(response, 'body.error') || (errorCode && get(response, 'body.message'));
  if (errorText) {
    throw new APIError(errorText);
  }

  if (errorCode) {
    throw new APIError(`Error: ${errorCode}`);
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new APIError(`Unexpected response ${response.statusCode}`);
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
