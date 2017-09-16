const urljoin = require('urljoin');
const request = require('request');

const util = require('../shared/util');
const logger = require('../shared/loggerInit');

// TODO: ensure that this is configured in a better way, having a single
// variable in the deploy file is inadequate
const invokeEndpoint =
      process.env.BINARIS_INVOKE_ENDPOINT || 'run-staging.binaris.io:80';

const invoke = async function invoke(data) {
  const invokeFilePath = data.functionPath;
  const invokeData = data.functionData;
  try {
    const { binarisYML, packageJSON } =
      await util.loadAllFiles(invokeFilePath).catch(() => {
        throw new Error('your current directory does not contain a valid binaris function!');
      });
    const metadata = await util.getFuncMetadata(binarisYML, packageJSON);
    const endpoint = urljoin(`http://${invokeEndpoint}/v1/user/`, metadata.funcName);
    logger.binaris.debug(`attempting to invoke @endpoint ${endpoint}`);
    const requestPromise = new Promise((resolve, reject) => {
      request.post({
        url: endpoint,
        body: JSON.stringify(invokeData),
        headers: {
          'Content-Type': 'application/json',
        },
      }, (err, resp, body) => {
        if (resp.statusCode !== 200) {
          logger.binaris.debug(body);
          reject(new Error('non 200 status code returned from invocation'));
        } else {
          logger.binaris.debug(body);
          resolve(body);
        }
      });
    });
    const body = await requestPromise;
    return body;
  } catch (err) {
    throw err;
  }
};

module.exports = invoke;
