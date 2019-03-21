'use strict';

const { getAPIKey } = require('./userConf');
const { triggers } = require('../sdk');

async function upsert(triggerName, triggerOptions) {
  const apiKey = await getAPIKey();
  return triggers.upsert(apiKey, triggerName, triggerOptions);
}

async function remove(triggerName) {
  const apiKey = await getAPIKey();
  return triggers.remove(apiKey, triggerName);
}

async function list() {
  const apiKey = await getAPIKey();
  return triggers.list(apiKey);
}

module.exports = {
  upsert,
  remove,
  list,
};
