const fs = require('fs');
const urljoin = require('urljoin');
const request = require('request');

const logger = require('../lib/logger');

const { getDeployEndpoint } = require('./config');
const { loggedRequest, validateResponse } = require('./handleError');

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
    headers: {
      'Content-Type': 'application/gzip',
      'X-Binaris-Api-Key': apiKey,
    },
    json: true,
  };
  // use raw request here(as opposed to rp) because the
  // request-promise module explicitly discourages using
  // request-promise for pipe
  // https://github.com/request/request-promise
  try {
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
    validateResponse(codeDeployment);
    return codeDeployment.body.digest;
  } catch (err) {
    throw new Error(`Error: ${err.message}`);
  }
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
 * @return {object} - response of tag operation
 */
const deployConf = async function deployConf(deployURLBase, apiKey, funcName, funcConf) {
  const { env } = funcConf;
  if (env) {
    for (const key of Object.keys(env)) {
      if (env[key] === '') {
        logger.error(`
  Empty string values for env key ${key} not supported.
  To forward the calling process's environment variables when deploying, use the following syntax in binaris.yml:
    env:
      ${key}:
  Instead of:
    env:
      ${key}: ''
  `);
        throw new Error('Invalid env param');
      }
      if (env[key] == null) {
        env[key] = process.env[key];
        if (!env[key] || env[key] === '') {
          delete env[key];
        }
      } else if (typeof env[key] !== 'string') {
        logger.error(`Only string values are supported in function env configuration.
${key}'s value is not a string.`);
      }
    }
  }
  const confDeployOptions = {
    url: urljoin(deployURLBase, 'v2', 'conf', apiKey, funcName),
    body: funcConf,
  };
  const digest = (await loggedRequest(confDeployOptions)).digest;

  const tagDeployOptions = {
    url: urljoin(deployURLBase, 'v2', 'tag', apiKey, funcName, 'latest'),
    body: { digest },
  };
  const response = await loggedRequest(tagDeployOptions);
  return response;
};

/**
 * Deploy a function to the Binaris cloud.
 *
 * @param {string} funcName - name of the function to deploy
 * @param {string} apiKey - Binaris API key used to authenticate function removal
 * @param {object} funcConf - configuration of the function to deploy
 * @param {string} tarPath - path of the tarball containing the function to deploy
 * @param {string} endpoint - binaris deploy endpoint
 *
 * @returns {object} - response { status, body }
 */
const deploy = async function deploy(
  funcName,
  apiKey,
  funcConf,
  tarPath,
  endpoint = getDeployEndpoint(),
) {
  const deployURLBase = `https://${endpoint}`;
  const codeDigest = await deployCode(deployURLBase, apiKey, tarPath);
  const confWithDigest = Object.assign({}, funcConf, { codeDigest });
  const confDeployResp = await deployConf(deployURLBase, apiKey,
    funcName, confWithDigest);
  return confDeployResp;
};

module.exports = deploy;
