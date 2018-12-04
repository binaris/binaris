'use strict';

const urljoin = require('urljoin');
const rp = require('request-promise-native');

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
      simple: false,
    });

    return {
      error: undefined,
      accountId,
    };
  } catch (_) {
    try {
      await rp.get({
        url: urljoin(`https://${getInvokeEndpoint()}`, 'v1', 'apikey', apiKey),
        json: true,
        simple: false,
      });
      return {
        error: undefined,
        accountId: undefined,
      };
    } catch (err) {
      return {
        error: err,
        accountId: undefined,
      };
    }
  }
};

module.exports = {
  verifyAPIKey,
};
