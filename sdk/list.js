const urljoin = require('urljoin');
const rp = require('request-promise-native');

const { getDeployEndpoint } = require('./config');

const list = async function list(apiKey, endpoint = getDeployEndpoint()) {
  const listURLBase = `https://${endpoint}`;
  const listOptions = {
    url: urljoin(listURLBase, 'v2', 'functions', apiKey),
    json: true,
  };
  const items = await rp.get(listOptions);
  return items;
};

module.exports = list;
