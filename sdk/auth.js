const urljoin = require('urljoin');
const rp = require('request-promise-native');

const { invokeEndpoint } = require('./config');

/**
 * Verifies that the provided Binaris API key is correct by
 * querying the remote authentication server.
 *
 * @param {string} apiKey - the apiKey to validate
 */
const verifyAPIKey = async function verifyAPIKey(apiKey) {
  const options = {
    url: urljoin(`https://${invokeEndpoint}`, 'v1', 'apikey', apiKey),
    json: true,
    resolveWithFullResponse: true,
  };
  try {
    await rp.get(options);
  } catch (err) {
    if (err.error && err.error.valid === false) {
      return false;
    }
    throw err;
  }
  return true;
};

module.exports = {
  verifyAPIKey,
};
