const urljoin = require('urljoin');
const rp = require('request-promise-native');

const { invokeEndpoint } = require('./config');

/**
 * Invokes a previously deployed Binaris function.
 *
 * @param {string} funcName - name of the function to invoke
 * @param {string} apiKey - Binaris API key used to authenticate function invocation
 * @param {string} funcData - valid JSON string to send with your invocation
 *
 * @returns {object} - response of function invocation
 */
const invoke = async function invoke(funcName, apiKey, funcData) {
  return rp.post({
    url: urljoin(`https://${invokeEndpoint}`, 'v1', 'run', apiKey, funcName),
    headers: {
      'Content-Type': 'application/json',
    },
    body: funcData,
    resolveWithFullResponse: true,
  });
};

module.exports = invoke;
