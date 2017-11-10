const urljoin = require('urljoin');
const rp = require('request-promise-native');
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
  };
  const response = await rp.delete(options);
  if (response.statusCode === 404) {
    throw new Error(`Function ${funcName} unknown`);
  }
  if (response.statusCode !== 200) {
    throw new Error(`Failed to remove function ${funcName}`);
  }
};

module.exports = remove;
