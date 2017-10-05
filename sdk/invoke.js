const urljoin = require('urljoin');
const request = require('request');
const { invokeEndpoint } = require('./config');

const invoke = async function invoke(funcName, funcData) {
  const endpoint = urljoin(`https://${invokeEndpoint}/v1/user/`, funcName);
  // TODO: switch to request promise at a later time
  const requestPromise = new Promise((resolve, reject) => {
    request.post({
      url: endpoint,
      body: JSON.stringify(funcData),
      headers: { 'Content-Type': 'application/json', },
    }, (err, res, body) => {
      if (err) {
        return reject(new Error(err));
      }
      return resolve({ statusCode: res.statusCode, body });
    });
  });
  const body = await requestPromise;
  return body;
};

module.exports = invoke;
