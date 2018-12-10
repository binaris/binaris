'use strict';

const { inspect } = require('util');
const urljoin = require('urljoin');
const rp = require('request-promise-native');

const logger = require('../lib/logger');
const { getInvokeEndpoint, getDeployEndpoint } = require('./config');

/**
 * Verifies that the provided Binaris API key is correct by
 * querying the remote authentication server.
 *
 * @param {string} apiKey - the apiKey to validate
 */
const verifyAPIKey = async function verifyAPIKey(apiKey) {
  try {
    const { accountId } = await rp.get({
      url: urljoin(`https://${getDeployEndpoint()}`, 'v3', 'authenticate'),
      headers: {
        'X-Binaris-Api-Key': apiKey,
      },
      json: true,
    });

    return {
      error: undefined,
      accountId,
    };
  } catch (accountErr) {
    logger.debug('Failed to authenticate via account', { error: inspect(accountErr) });
    if (accountErr.statusCode !== 403) {
      return {
        error: accountErr,
        accountId: undefined,
      };
    }
  }
  try {
    await rp.get({
      url: urljoin(`https://${getInvokeEndpoint()}`, 'v1', 'apikey', apiKey),
      json: true,
    });

    return {
      error: undefined,
      accountId: undefined,
    };
  } catch (apiErr) {
    logger.debug('Failed to authenticate via api key', { error: inspect(apiErr) });
    if (apiErr.statusCode !== 404) {
      return {
        error: apiErr,
        accountId: undefined,
      };
    }
    return {
      error: new Error('Invalid API key'),
      accountId: undefined,
    };
  }
};

module.exports = {
  verifyAPIKey,
};
