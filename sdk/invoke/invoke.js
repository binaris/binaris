const urljoin = require('urljoin');
const request = require('request');

const util = require('../shared/util');
const log = require('../shared/logger');

// TODO: ensure that this is configured in a better way, having a single
// variable in the deploy file is inadequate
const invokeEndpoint =
      process.env.BINARIS_INVOKE_ENDPOINT || 'run-staging.binaris.io';

const invoke = async function invoke(invokeFilePath, invokeData) {
  const binarisConf = util.loadBinarisConf(invokeFilePath);
  const funcName = util.getFuncName(binarisConf);
  const endpoint = urljoin(`https://${invokeEndpoint}/v1/user/`, funcName);
  log.debug(`attempting to invoke @endpoint ${endpoint}`);
  // TODO: switch to request promise at a later time
  const requestPromise = new Promise((resolve, reject) => {
    request.post({
      url: endpoint,
      body: JSON.stringify(invokeData),
      headers: {
        'Content-Type': 'application/json',
      },
    }, (err, resp, body) => {
      if (resp.statusCode !== 200) {
        log.debug('request error', {
          statusCode: resp.statusCode,
          body,
        });
        reject(new Error('Non 200 status code returned from invocation'));
      } else {
        log.debug('request success', { body });
        resolve(body);
      }
    });
  });
  const body = await requestPromise;
  return body;
};

module.exports = invoke;
