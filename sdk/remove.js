const urljoin = require('urljoin');
const rp = require('request-promise-native');

const { getDeployEndpoint } = require('./config');
const { HTTPError, tryRequest } = require('./httpError');

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
    resolveWithFullResponse: true,
    simple: false,
  };
  try {
    const response = await tryRequest(rp.delete(options));
    return { status: response.statusCode, body: response.body };
  } catch (err) {
    if (err instanceof HTTPError) {
      return { status: err.response.statusCode, body: err.response.body };
    }
    // NOTE: This 'err' returned in the error field is in NodeJS error format
    return { error: err };
  }
};

module.exports = remove;
