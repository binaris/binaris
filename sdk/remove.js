const urljoin = require('urljoin');
const request = require('request');
const { deployEndpoint } = require('./config');

const removeFunction = async function removeFunction(url) {
  const options = {
    url
  };

  const removePromise = new Promise((resolve, reject) => {
    request.delete(options, (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
  return await removePromise;
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
