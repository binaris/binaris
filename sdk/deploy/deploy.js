const fs = require('fs');
const urljoin = require('urljoin');
const request = require('request');

const log = require('../shared/logger');

// TODO: ensure that this is configured in a better way, having a single
// variable in the deploy file is inadequate
const publishEndpoint =
  process.env.BINARIS_PUBLISH_ENDPOINT || 'api-staging.binaris.io:11011';

const deployFunction = async function uploadFunction(tarPath, conf, publishURL) {
  const options = {
    url: publishURL,
    qs: conf,
  };
  try {
    const uploadPromise = new Promise((resolve, reject) => {
      fs.createReadStream(tarPath)
        .pipe(request.post(options, (uploadErr, uploadResponse) => {
          if (uploadErr) {
            reject(uploadErr);
          } else {
            resolve(uploadResponse);
          }
        }));
    });
    return await uploadPromise;
  } catch (err) {
    log.debug(err);
    throw new Error('Failed to upload function tar file to Binaris backend');
  }
};

// TODO: thing that returns metadata
const deploy = async function deploy(funcName, funcConf, tarPath) {
  const endpoint = urljoin(`http://${publishEndpoint}/v1/function`, funcName);
  const response = await deployFunction(tarPath, funcConf, endpoint);
  if (response.statusCode !== 200) {
    log.debug(response);
    throw new Error('Function was not deployed successfully, check logs for more details');
  }
  return response.body;
};

module.exports = deploy;
