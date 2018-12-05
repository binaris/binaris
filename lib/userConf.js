'use strict';

const fs = require('mz/fs');
const { homedir } = require('os');
const path = require('path');
const yaml = require('js-yaml');
const partial = require('lodash.partial');

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
 * Updates a configuration value of the user's Binaris conf file.
 * If no conf file exists one will be created.
 *
 * @param {string} key - key to update conf file with
 * @param {string} value - value to update conf file with
 */
const updateConf = async function updateAPIKey(key, value) {
  let config = {};
  try {
    config = await loadUserConf();
  } catch (err) {} // eslint-disable-line no-empty
  // TODO: only ignore file not found / permission errors

  if (value) {
    config[key] = value;
  } else {
    delete config[key];
  }

  await saveUserConf(config);
};

const getConf = async function getConf(key, envVar, ...defaultValue) {
  if (defaultValue.length > 1) {
    throw new Error(`defaultValue parameter should be an array of 1 or less (got ${defaultValue.length})`);
  }
  const value = process.env[envVar];
  if (value) return value;

  let userConf;
  try {
    userConf = await loadUserConf();
  } catch (err) {} // eslint-disable-line no-empty
  // TODO: only ignore file not found / permission errors

  if (!userConf || !Object.prototype.hasOwnProperty.call(userConf, key)) {
    if (defaultValue.length === 1) {
      return defaultValue[0];
    }
    if (!userConf) {
      throw new Error(`Binaris conf file could not be read and ${envVar} is undefined, please use "bn login"`);
    }
    throw new Error(
`Invalid Binaris conf file (missing ${key}) ${userConfPath}`);
  }
  return userConf[key];
};

module.exports = {
  updateAPIKey: partial(updateConf, 'apiKey'),
  getAPIKey: partial(getConf, 'apiKey', 'BINARIS_API_KEY'),
  updateAccountId: partial(updateConf, 'accountId'),
  getAccountId: partial(getConf, 'accountId', 'BINARIS_ACCOUNT_ID'),
  updateRealm: partial(updateConf, 'realm'),
  getRealm: partial(getConf, 'realm', 'realm', ''),
};
