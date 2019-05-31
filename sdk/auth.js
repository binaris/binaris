'use strict';

const { inspect } = require('util');
const urljoin = require('urljoin');
const rp = require('request-promise-native');

const logger = require('../lib/logger');
const { getDeployEndpoint } = require('./config');

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
      family: 4,
      json: true,
    });

    return {
      error: undefined,
      accountId,
    };
  } catch (accountErr) {
    logger.debug('Failed to authenticate', { error: inspect(accountErr) });
    return {
      error: accountErr,
      accountId: undefined,
    };
  }
};

module.exports = {
  verifyAPIKey,
};
