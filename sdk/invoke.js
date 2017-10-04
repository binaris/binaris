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
      headers: {
        'Content-Type': 'application/json',
      },
    }, (err, resp, body) => {
      if (err) {
        return reject(new Error(err));
      } else if (resp.statusCode !== 200) {
        return reject(new Error('Non 200 status code returned from invocation'));
      }
      let finalBody;
      try {
        finalBody = JSON.parse(body);
      } catch (err0) {
        finalBody = body;
      }

      return resolve({ statusCode: resp.statusCode, body: finalBody });
    });
  });
  const body = await requestPromise;
  return body;
};

module.exports = invoke;
