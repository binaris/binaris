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

async function loadAndValidateUserConf() {
  try {
    const userConf = await loadUserConf();
    return userConf;
  } catch (err) {
    throw new Error('Binaris conf file could not be read, please use "bn login"');
  }
}

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
const updateConf = async function updateConf(key, value) {
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
    userConf = await loadAndValidateUserConf();
  } catch (err) {} // eslint-disable-line no-empty

  if (!userConf || !Object.prototype.hasOwnProperty.call(userConf, key)) {
    if (defaultValue.length === 1) {
      return defaultValue[0];
    }
    if (!userConf) {
      throw new Error(`Binaris conf file could not be read and ${envVar} is undefined, please use "bn login"`);
    }
    throw new Error(`Invalid Binaris conf file (missing ${key}) ${userConfPath}`);
  }
  return userConf[key];
};

// Matches printable ASCII-only values.
const ascii = /^[\u0020-\u007E]*$/;

// Validates a header can be sent.  In practice ISO 8859-1 is allowed,
// but that is rejected by the Binaris backend.  Disallow it on
// principle, for aesthetic reasons
const validateHeaderValue = function validateHeaderValue(value, context) {
  if (!ascii.test(value)) {
    throw new Error(`Non-ASCII characters are not allowed in ${context}`);
  }
  return value;
};

// Wraps func in validateHeaderValue.
const validateGet = function validateGet(func, context) {
  return async function get(...args) { return validateHeaderValue(await func(...args), context); };
};

// Wraps func argument in validateHeaderValue.
const validateUpdate = function validateUpdate(func, context) {
  return async function update(value) { await func(validateHeaderValue(value, context)); };
};

module.exports = {
  loadAndValidateUserConf,
  validateHeaderValue,
  updateAPIKey: validateUpdate(partial(updateConf, 'apiKey'), 'API key'),
  getAPIKey: validateGet(partial(getConf, 'apiKey', 'BINARIS_API_KEY'), 'API key'),
  updateAccountId: validateUpdate(partial(updateConf, 'accountId'), 'account ID'),
  getAccountId: validateGet(partial(getConf, 'accountId', 'BINARIS_ACCOUNT_ID'), 'account ID'),
  updateRealm: partial(updateConf, 'realm'),
  getRealm: partial(getConf, 'realm', 'realm', ''),
};
