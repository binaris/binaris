const fs = require('mz/fs');
const { homedir } = require('os');
const path = require('path');
const yaml = require('js-yaml');
const log = require('./logger');

const userConfFile = '.binaris';
const userConfPath = path.join(homedir(), userConfFile);

const apiKeyStr = 'apiKey';

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
  if (apiKey === undefined) {
    const userConf = await loadUserConf();
    console.log('user conf', userConf);
    return userConf[apiKeyStr];
    throw new Error('Missing Binaris API key. Please set env var BINARIS_API_KEY');
  }
  return apiKey;
};

module.exports = {
  loadUserConf,
  saveUserConf,
  getApiKey,
};
