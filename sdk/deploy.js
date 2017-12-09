const fs = require('fs');
const urljoin = require('urljoin');
const request = require('request');
const _ = require('lodash');

const { translateErrorCode } = require('./errorCodes');
const { deployEndpoint, invokeEndpoint } = require('./config');

/**
 * Deploys the function to the Binaris cloud by streaming
 * a tarball containing the function to the Binaris deployment
 * endpoint.
 *
 * @param {string} tarPath - path of the tarball containing the function to deploy
 * @param {string} funcConf -  configuration of the function to deploy
 * @param {string} deployURL - URL of Binaris deployment endpoint
 *
 * @returns {object} - response of the deployment request
 */
const deployFunction = async function uploadFunction(tarPath, funcConf, deployURL) {
  const options = {
    url: deployURL,
    qs: funcConf,
    json: true,
  };
  try {
    // use raw request here(as opposed to rp) because the
    // request-promise module explicitly discourages using
    // request-promise for pipe
    // https://github.com/request/request-promise
    return new Promise((resolve, reject) => {
      fs.createReadStream(tarPath)
        .pipe(request.post(options, (uploadErr, uploadResponse) => {
          if (uploadErr) {
            reject(uploadErr);
          } else {
            resolve(uploadResponse);
          }
        }));
    });
  } catch (err) {
    throw new Error('Failed to upload function tar file to Binaris backend');
  }
};

/**
 * Deploy a function to the Binaris cloud.
 *
 * @param {string} funcName - name of the function to deploy
 * @param {string} apiKey - Binaris API key used to authenticate function removal
 * @param {object} funcConf - configuration of the function to deploy
 * @param {string} tarPath - path of the tarball containing the function to deploy
 *
 * @returns {string} - curlable URL of the endpoint used to invoke your function
 */
const deploy = async function deploy(funcName, apiKey, funcConf, tarPath) {
  const response = await deployFunction(tarPath, funcConf,
    urljoin(`https://${deployEndpoint}`, 'v1', 'function', `${apiKey}-${funcName}`));
  if (response.statusCode >= 200 && response.statusCode < 300) {
    return urljoin(`https://${invokeEndpoint}`, 'v1', 'run', apiKey, funcName);
  }
  if (_.get(response, 'body.errorCode')) {
    throw new Error(translateErrorCode(response.body.errorCode));
  } else {
    throw new Error(`Failed to deploy function ${funcName}`);
  }
};

module.exports = deploy;
