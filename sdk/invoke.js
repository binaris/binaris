const urljoin = require('urljoin');
const rp = require('request-promise');
const { invokeEndpoint } = require('./config');

const invoke = async function invoke(funcName, funcData) {
  const endpoint = urljoin(`https://${invokeEndpoint}/v1/user/`, funcName);
  const options = {
    url: endpoint,
    body: JSON.stringify(funcData),
    headers: { 'Content-Type': 'application/json' },
    resolveWithFullResponse: true,
  };
  return rp.post(options);
};

module.exports = invoke;
