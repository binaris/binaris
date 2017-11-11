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
    const response = await rp.get(options);
    if (response.statusCode !== 200) {
      throw new Error('Failed to verify API key');
    }
  } catch (err) {
    // if the key is simply invalid respond with a constructive and
    // direct error message, otherwise just pass back the original
    if (err.error && err.error.valid === false) {
      throw new Error('Invalid API key, please try again');
    }
    throw err;
  }
};

module.exports = {
  verifyAPIKey,
};
