const urljoin = require('urljoin');

const { getDeployEndpoint } = require('./config');
const { loggedRequest } = require('./handleError');

const list = async function list(apiKey, endpoint = getDeployEndpoint()) {
  const listOptions = {
    url: urljoin(`https://${endpoint}`, 'v2', 'functions', apiKey),
    json: true,
  };
  return loggedRequest(listOptions, 'get');
};

module.exports = list;
