'use strict';

const urljoin = require('urljoin');
const rp = require('request-promise-native');

const { getDeployEndpoint } = require('./config');

/**
 * Verifies that the provided Binaris API key is correct by
 * querying the remote authentication server.
 *
 * @param {string} accountId - account ID to validate against
 * @param {string} apiKey - the apiKey to validate
 */
const verifyAPIKey = async function verifyAPIKey(accountId, apiKey) {
  // TODO: call some new URL in spice
  const options = {
    url: urljoin(`https://${getDeployEndpoint()}`, 'v3', 'authenticate', accountId),
    headers: {
      'X-Binaris-Api-Key': apiKey,
    },
    json: true,
    simple: false,
    resolveWithFullResponse: true,
  };
  try {
    const response = await rp.get(options);
    if (response.statusCode !== 200) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
};

module.exports = {
  verifyAPIKey,
};
