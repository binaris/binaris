const urljoin = require('urljoin');
const rp = require('request-promise-native');
const { deployEndpoint } = require('./config');

const removeFunction = async function removeFunction(url) {
  const options = {
    url,
    resolveWithFullResponse: true,
  };
  return rp.delete(options);
};

const remove = async function remove(funcName) {
  const endpoint = urljoin(`https://${deployEndpoint}/v1/function`, funcName);
  const response = await removeFunction(endpoint);
  if (response.statusCode === 404) {
    throw new Error(`Function ${funcName} unknown`);
  }
  if (response.statusCode !== 200) {
    throw new Error(`Failed to remove function ${funcName}`);
  }
};

module.exports = remove;
