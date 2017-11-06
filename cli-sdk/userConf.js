const fs = require('mz/fs');
const { homedir } = require('os');
const path = require('path');
const yaml = require('js-yaml');

const urljoin = require('urljoin');
const rp = require('request-promise-native');
const { invokeEndpoint } = require('../sdk/config');

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
 * Verifies that the provided Binaris API key is correct by
 * querying the remote authentication server.
 *
 * @param {string} apiKey - the apiKey to validate
 */
const verifyAPIKey = async function verifyAPIKey(apiKey) {
  const options = {
    url: urljoin(`https://${invokeEndpoint}`, 'v1', 'apikey', apiKey),
    json: true,
    resolveWithFullResponse: true,
  };
  try {
    await rp.get(options);
  } catch (err) {
    // if the key is simply invalid respond with a constructive and
    // direct error message, otherwise just pass back the original
    if (err.error && err.error.valid === false) {
      throw new Error('Invalid API key, please try again');
    }
    throw err;
  }
};

const getApiKey = async function getApiKey() {
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
  getApiKey,
  saveUserConf,
  verifyAPIKey,
};
