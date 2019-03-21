'use strict';

const { getTriggersListUrl, getSpecificTriggerUrl } = require('./url');
const { getValidatedBody } = require('./handleError');

function callTriggersApi(apiKey, url, method, body) {
  const options = {
    url,
    headers: {
      'X-Binaris-Api-Key': apiKey,
    },
    json: true,
    body,
  };
  return getValidatedBody(options, method);
}

async function upsert(apiKey, triggerName, triggerOptions) {
  return callTriggersApi(
    apiKey,
    getSpecificTriggerUrl(triggerName),
    'post',
    triggerOptions,
  );
}

async function remove(apiKey, triggerName) {
  return callTriggersApi(
    apiKey,
    getSpecificTriggerUrl(triggerName),
    'delete',
  );
}

async function list(apiKey) {
  return callTriggersApi(
    apiKey,
    getTriggersListUrl(),
    'get',
  );
}

module.exports = {
  upsert,
  remove,
  list,
};
