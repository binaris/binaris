const fs = require('fs');
const urljoin = require('urljoin');
const request = require('request');
const { deployEndpoint } = require('./config');

const deployFunction = async function uploadFunction(tarPath, conf, deployURL) {
  const options = {
    url: deployURL,
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
    throw new Error('Failed to upload function tar file to Binaris backend');
  }
};

// TODO: thing that returns metadata
const deploy = async function deploy(funcName, funcConf, tarPath) {
  const endpoint = urljoin(`https://${deployEndpoint}/v1/function`, funcName);
  const response = await deployFunction(tarPath, funcConf, endpoint);
  if (response.statusCode !== 200) {
    throw new Error('Function was not deployed successfully, check logs for more details');
  }
};

module.exports = deploy;