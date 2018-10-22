const get = require('lodash.get');
const { inspect } = require('util');
const rp = require('request-promise-native');

const logger = require('../lib/logger');

const { translateErrorCode } = require('binaris-pickle');

const { version } = require('../package.json');

class APIError extends Error {}

function validateResponse(response) {
  const errorCode = get(response, 'body.errorCode');
  if (errorCode) {
    throw new APIError(`Error: ${translateErrorCode(errorCode)}`);
  }

  const errorText = get(response, 'body.error');
  if (errorText) {
    throw new APIError(errorText);
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
      'X-binaris-CLI-Version': version,
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
