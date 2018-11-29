'use strict';

const fs = require('mz/fs');
const { homedir } = require('os');
const path = require('path');
const yaml = require('js-yaml');

const userConfDirectory = process.env.BINARIS_CONF_DIR || process.env.HOME || homedir();
const userConfFile = '.binaris.yml';
const userConfPath = path.join(userConfDirectory, userConfFile);

const loadUserConf = async function loadUserConf() {
  const confString = await fs.readFile(userConfPath, 'utf8');
  const userConf = yaml.safeLoad(confString);
  return userConf;
};

const saveUserConf = async function saveUserConf(userConf) {
  const confString = yaml.dump(userConf);
  await fs.writeFile(userConfPath, confString, 'utf8');
};

/**
 * Updates the API key of the users Binaris conf file.
 * If no conf file exists when the key update request
 * is sent, one will be created.
 *
 * @param {string} apiKey - apiKey to update conf file with
 */
const updateAPIKey = async function updateAPIKey(apiKey) {
  let currentConf = {};
  try {
    currentConf = await loadUserConf();
  } catch (err) {} // eslint-disable-line no-empty
  await saveUserConf(Object.assign({}, currentConf, { apiKey }));
};

const getAPIKey = async function getAPIKey() {
  const apiKey = process.env.BINARIS_API_KEY;
  if (apiKey) return apiKey;

  let userConf;
  try {
    userConf = await loadUserConf();
  } catch (err) {
    throw new Error('Binaris conf file could not be read and BINARIS_API_KEY is undefined, please use "bn login"');
  }

  if (!Object.prototype.hasOwnProperty.call(userConf, 'apiKey')) {
    throw new Error(
`Invalid Binaris conf file (missing API key) ${userConfPath}`);
  }
  return userConf.apiKey;
};

module.exports = {
  getAPIKey,
  updateAPIKey,
};
