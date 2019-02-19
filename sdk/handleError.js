'use strict';

const get = require('lodash.get');
const { inspect } = require('util');
const rp = require('request-promise-native');

const logger = require('../lib/logger');

const { maybeTranslateErrorCode } = require('binaris-pickle');

const { version } = require('../package.json');

class APIError extends Error {
  constructor(message, debugIDString) {
    super(`${debugIDString || ''}${message}`);
  }
}

function validateResponse(response) {
  const debugId = get(response, 'body.debugId');
  const debugIdString = debugId ? `DebugId: ${debugId}\n` : '';
  const errorCode = get(response, 'body.errorCode');
  if (errorCode) {
    const readableErrorMessage = maybeTranslateErrorCode(errorCode);
    if (readableErrorMessage) {
      throw new APIError(`Error: ${readableErrorMessage}`, debugIdString);
    }
  }

  // An error is anything with an error message, or any error code
  // with an untranslated message.
  const errorText = get(response, 'body.error') || (errorCode && get(response, 'body.message'));
  if (errorText) {
    throw new APIError(errorText, debugIdString);
  }

  if (errorCode) {
    throw new APIError(`Error: ${errorCode}`, debugIdString);
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new APIError(`Unexpected response ${response.statusCode}`, debugIdString);
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
