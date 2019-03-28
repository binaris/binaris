'use strict';

const fse = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const { compress } = require('targz');

const tgzCompress = promisify(compress);

const { getAccountId, getAPIKey } = require('./userConf');
const { deploy } = require('../sdk');
const { getInvokeUrl } = require('../sdk/url');

const binarisDir = '.binaris/';
const ignoredTarFiles = ['.git', '.binaris', 'binaris.yml'];

/**
 * Generates the .binaris directory inside of the current
 * functions directory. This directory is used to hold temporary
 * CLI files related to the function.
 *
 * @param {string} genPath - path at which to generate the .binaris dir
 * @returns {string} - full path to the generated .binaris dir
 */
const genBinarisDir = async function genBinarisDir(genPath) {
  const fullPath = path.join(genPath, binarisDir);
  await fse.mkdirp(fullPath);
  return fullPath;
};

/**
 * Deploy a function to the Binaris cloud.
 *
 * @param {string} funcName - name of the function to deploy
 * @param {string} funcPath - path of the function to deploy
 * @param {object} funcConf - configuration of the function to deploy
 *
 * @returns {string} - curlable URL of the endpoint used to invoke your function
 */
const deployCLI = async function deployCLI(funcName, funcPath, funcConf) {
  // path where temporary function tar will be stored
  const funcTarPath = path.join(await genBinarisDir(funcPath), `${funcName}.tgz`);
  const fullIgnorePaths = ignoredTarFiles.map(entry =>
    path.join(funcPath, entry));
  await tgzCompress({
    src: funcPath,
    dest: funcTarPath,
    tar: {
      ignore: name => fullIgnorePaths.includes(name),
    },
  });
  const apiKey = await getAPIKey();
  const accountId = await getAccountId(undefined);
  await deploy(accountId, funcName, apiKey, funcConf, funcTarPath);
  return getInvokeUrl(accountId, funcName);
};

module.exports = deployCLI;
