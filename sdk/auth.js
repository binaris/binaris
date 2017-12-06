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
