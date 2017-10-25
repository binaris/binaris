const urljoin = require('urljoin');
const rp = require('request-promise-native');
const { invokeEndpoint } = require('./config');

const invoke = async function invoke(apiKey, funcName, funcData) {
  const endpoint = urljoin(`https://${invokeEndpoint}`, 'v1', apiKey, funcName);
  const options = {
    url: endpoint,
    body: funcData,
    resolveWithFullResponse: true,
    json: true,
  };
  return rp.post(options);
};

module.exports = invoke;
