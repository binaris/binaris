const urljoin = require('urljoin');

const { getDeployEndpoint } = require('./config');
const { getValidatedBody } = require('./handleError');

/**
 * Removes the function from the Binaris cloud.
 *
 * @param {string} funcName - the name of the function to remove
 * @param {string} apiKey - the apiKey to authenticate the removal with
 */
const remove = async function remove(funcName, apiKey) {
  const options = {
    url: urljoin(`https://${getDeployEndpoint()}`, 'v2', 'tag', apiKey, funcName, 'latest'),
    json: true,
  };
  return getValidatedBody(options, 'delete');
};

module.exports = remove;
