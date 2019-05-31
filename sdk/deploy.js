'use strict';

const fs = require('fs');
const request = require('request');

const logger = require('../lib/logger');

const { getCodeUploadUrl, getConfUploadUrl, getConfTagUrl } = require('./url');
const { getValidatedBody, validateResponse, version } = require('./handleError');

/**
 * Deploys a tarball, whose contents represent a Binaris function deployment
 *
 * @param {string} accountId - Binaris account ID
 * @param {string} apiKey - Binaris apiKey used to authenticate remote request
 * @param {string} tarPath - path to tarball that will be deployed
 *
 * @return {object} - digest of deployed function
 */
const deployCode = async function deployCode(accountId, apiKey, tarPath) {
  const codeDeployOptions = {
    url: getCodeUploadUrl(accountId),
    headers: {
      'Content-Type': 'application/gzip',
      'X-Binaris-Api-Key': apiKey,
      'X-Binaris-Client-Version': version,
    },
    family: 4,
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
          reject(new Error(uploadErr.toString()));
        } else {
          resolve(uploadResponse);
        }
      }));
  }));
  validateResponse(codeDeployment);
  return codeDeployment.body.digest;
};

/**
 * Deploys the configuration of a previously deployed `tgz` file
 * holding the code for a Binaris function.
 *
 * @param {string} accountId - Binaris account ID
 * @param {string} funcName - name of function whose conf is being deployed
 * @param {string} apiKey - Binaris apiKey used to authenticate remote request
 * @param {string} funcConf - configuration object to deploy for the function
 *
 * @return {object} - response of tag operation
 */
const deployConf = async function deployConf(accountId, funcName, apiKey, funcConf) {
  const { env } = funcConf;
  if (env) {
    if (typeof env !== 'object') {
      throw new Error('binaris.yml section <env> is not a dictionary');
    }
    for (const key of Object.keys(env)) {
      if (env[key] === '') {
        throw new Error(`Empty string env '${key}' in binaris.yml is not supported`);
      }
      if (env[key] == null) {
        env[key] = process.env[key];
        if (env[key] === undefined) {
          logger.warn(`Non existing env var '${key}' is ignored`);
        }
        if (env[key] === '') {
          throw new Error(`Empty existing env var '${key}' is not supported`);
        }
      } else if (typeof env[key] !== 'string') {
        throw new Error(`binaris.yml env var '${key}' is not a string`);
      }
      if (!env[key]) {
        delete env[key];
      }
    }
  }
  const confDeployOptions = {
    url: getConfUploadUrl(accountId, funcName),
    headers: {
      'X-Binaris-Api-Key': apiKey,
    },
    body: funcConf,
  };

  const { digest } = await getValidatedBody(confDeployOptions);
  const tagDeployOptions = {
    url: getConfTagUrl(accountId, funcName, 'latest'),
    headers: {
      'X-Binaris-Api-Key': apiKey,
    },
    body: { digest },
  };
  const response = await getValidatedBody(tagDeployOptions);
  return response;
};

/**
 * Deploy a function to the Binaris cloud.
 *
 * @param {string} accountId - Binaris account ID
 * @param {string} funcName - name of the function to deploy
 * @param {string} apiKey - Binaris API key used to authenticate function removal
 * @param {object} funcConf - configuration of the function to deploy
 * @param {string} tarPath - path of the tarball containing the function to deploy
 *
 * @returns {object} - response { status, body }
 */
const deploy = async function deploy(accountId, funcName, apiKey, funcConf, tarPath) {
  const codeDigest = await deployCode(accountId, apiKey, tarPath);
  const confWithDigest = Object.assign({}, funcConf, { codeDigest });
  const confDeployResp = await deployConf(accountId, funcName, apiKey, confWithDigest);
  return confDeployResp;
};

module.exports = deploy;
