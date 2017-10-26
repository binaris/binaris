const fs = require('mz/fs');
const { homedir } = require('os');
const path = require('path');
const yaml = require('js-yaml');
const log = require('./logger');

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


const getApiKey = async function getApiKey() {
  const apiKey = process.env.BINARIS_API_KEY;
  if (apiKey) {
    return apiKey;
  }
  const userConf = await loadUserConf();
  if (!Object.prototype.hasOwnProperty.call(userConf, 'apiKey')) {
    throw new Error('Missing Binaris API key. Please set env var BINARIS_API_KEY');
  }
  return userConf['apiKey'];
};

module.exports = {
  getApiKey,
};
