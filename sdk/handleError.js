const get = require('lodash.get');
const { inspect } = require('util');
const rp = require('request-promise-native');

const logger = require('../lib/logger');

const { translateErrorCode } = require('binaris-pickle');

class APIError extends Error {}

function validateResponse(response) {
  const errorCode = get(response, 'body.errorCode');
  if (errorCode) {
    throw new APIError(translateErrorCode(errorCode));
  }

  const errorText = get(response, 'body.errorText');
  if (errorText) {
    throw new APIError(errorText);
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new APIError(`Unexpected response ${response.statusCode}`);
  }

  return response.body || response;
}

async function loggedRequest(options, type = 'post') {
  const response = await rp[type]({
    json: true,
    simple: false,
    resolveWithFullResponse: true,
    ...options,
  });
  logger.debug('raw response', inspect(response, { depth: null }));
  return validateResponse(response);
}

module.exports = {
  APIError,
  loggedRequest,
  validateResponse,
};
