const fs = require('fs');
const urljoin = require('urljoin');
const request = require('request');
const { deployEndpoint, invokeEndpoint } = require('./config');

const deployFunction = async function uploadFunction(tarPath, conf, deployURL) {
  const options = {
    url: deployURL,
    qs: conf,
  };
  try {
    // use raw request here(as opposed to rp) because the
    // request-promise module explicitly discourages using
    // request-promise for pipe
    // https://github.com/request/request-promise
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
    throw new Error('Failed to upload function tar file to Binaris backend');
  }
};

const deploy = async function deploy(apiKey, funcName, funcConf, tarPath) {
  const endpoint = urljoin(`https://${deployEndpoint}`, 'v1', apiKey, funcName);
  const response = await deployFunction(tarPath, funcConf, endpoint);
  if (response.statusCode !== 200) {
    throw new Error(`Error deploying function: ${response.statusCode} ${JSON.parse(response.body).error}`);
  }
  // TODO: deploy itself should return the run url / key
  return urljoin(`https://${invokeEndpoint}`, 'v1', apiKey, funcName);
};

module.exports = deploy;
