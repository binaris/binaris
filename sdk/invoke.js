const urljoin = require('urljoin');
const request = require('request');

// TODO: ensure that this is configured in a better way, having a single
// variable in the deploy file is inadequate
const invokeEndpoint =
      process.env.BINARIS_INVOKE_ENDPOINT || 'run.binaris.com';

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
      if (resp.statusCode !== 200) {
        reject(new Error('Non 200 status code returned from invocation'));
      } else {
        resolve({ statusCode: resp.statusCode, body });
      }
    });
  });
  const body = await requestPromise;
  return body;
};

module.exports = invoke;
