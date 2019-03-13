'use strict';

const fs = require('mz/fs');
const { homedir } = require('os');
const path = require('path');
const yaml = require('js-yaml');
const partial = require('lodash.partial');
const bind = require('lodash.bind');

const userConfDirectory = process.env.BINARIS_CONF_DIR || process.env.HOME || homedir();
const userConfFile = '.binaris.yml';
const userConfPath = path.join(userConfDirectory, userConfFile);

const confMapping = {
  apiKey: {
    env: 'BINARIS_API_KEY',
    printable: 'API key',
  },
  accountId: {
    env: 'BINARIS_ACCOUNT_ID',
    printable: 'account ID',
  },
};

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
    userConf = await loadUserConf();
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

const confGetters = Object.keys(confMapping).reduce((aggr, curr) => {
  const item = confMapping[curr];
  return {
    ...aggr,
    [curr]: validateGet(bind(getConf, {}, curr, item.env), item.printable),
  };
}, {});

async function getAllConf() {
  const allConf = {};
  for (const getterKey of Object.keys(confGetters)) {
    // eslint-disable-next-line no-await-in-loop
    allConf[getterKey] = await confGetters[getterKey]();
  }
  return allConf;
}

module.exports = {
  getAllConf,
  validateHeaderValue,
  updateAPIKey: validateUpdate(partial(updateConf, 'apiKey'), 'API key'),
  getAPIKey: confGetters.apiKey,
  updateAccountId: validateUpdate(partial(updateConf, 'accountId'), 'account ID'),
  getAccountId: confGetters.accountId,
  updateRealm: partial(updateConf, 'realm'),
  getRealm: partial(getConf, 'realm', 'realm', ''),
};
