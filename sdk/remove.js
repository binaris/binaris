const urljoin = require('urljoin');
const rp = require('request-promise-native');

const { translateErrorCode } = require('./errorCodes');
const { deployEndpoint } = require('./config');

/**
 * Removes the function from the Binaris cloud.
 *
 * @param {string} funcName - the name of the function to remove
 * @param {string} apiKey - the apiKey to authenticate the removal with
 */
const remove = async function remove(funcName, apiKey) {
  const options = {
    url: urljoin(`https://${deployEndpoint}`, 'v1', 'function', `${apiKey}-${funcName}`),
    resolveWithFullResponse: true,
    simple: false,
  };
  let response;
  try {
    response = await rp.delete(options);
  } catch (err) {
    throw new Error(translateErrorCode('ERR_NO_BACKEND'));
  }
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`Failed to remove function ${funcName}`);
  }
};

module.exports = remove;
