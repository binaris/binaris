const fs = require('fs');
const urljoin = require('urljoin');
const request = require('request');
const rp = require('request-promise-native');

const { getDeployEndpoint } = require('./config');

/**
 * Deploys a tarball, whose contents represent a Binaris function deployment
 *
 * @param {string} deployURLBase - root deployment URL for conf endpoint
 * @param {string} apiKey - Binaris apiKey used to authenticate remote request
 * @param {string} tarPath - path to tarball that will be deployed
 *
 * @return {object} - digest of deployed function
 */
const deployCode = async function deployCode(deployURLBase, apiKey, tarPath) {
  const codeDeployOptions = {
    url: urljoin(deployURLBase, 'v2', 'code'),
    headers: { 'X-Binaris-Api-Key': apiKey },
    json: true,
  };
  // use raw request here(as opposed to rp) because the
  // request-promise module explicitly discourages using
  // request-promise for pipe
  // https://github.com/request/request-promise
  const codeDeployment = await (new Promise((resolve, reject) => {
    fs.createReadStream(tarPath)
      .pipe(request.post(codeDeployOptions, (uploadErr, uploadResponse) => {
        if (uploadErr) {
          reject(uploadErr);
        } else {
          resolve(uploadResponse);
        }
      }));
  }));
  return codeDeployment.body.digest;
};

/**
 * Deploys the configuration of a previously deployed `tgz` file
 * holding the code for a Binaris function.
 *
 * @param {string} deployURLBase - root deployment URL for conf endpoint
 * @param {string} apiKey - Binaris apiKey used to authenticate remote request
 * @param {string} funcName - name of function whose conf is being deployed
 * @param {string} funcConf - configuration object to deploy for the function
 *
 * @return {object} - response of conf deployment
 */
const deployConf = async function deployConf(deployURLBase, apiKey, funcName, funcConf) {
  const confDeployOptions = {
    url: urljoin(deployURLBase, 'v2', 'conf', apiKey, funcName),
    headers: { 'Content-Type': 'application/json' },
    body: funcConf,
    resolveWithFullResponse: true,
  };
  return rp.post(confDeployOptions);
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
  try {
    const deployURLBase = `https://${getDeployEndpoint()`;
    const codeDigest = await deployCode(deployURLBase, apiKey, tarPath);
    const confWithDigest = Object.assign({}, funcConf, { codeDigest });
    const confDeployResp = await deployConf(deployURLBase, apiKey,
      funcName, confWithDigest);
    return { status: confDeployResp.statusCode, body: confDeployResp.body };
  } catch (err) {
    // NOTE: This 'err' returned in the error field is in NodeJS error format
    return { error: err };
  }
};

module.exports = deploy;
