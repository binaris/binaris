'use strict';

const { getListUrl } = require('./url');
const { getValidatedBody } = require('./handleError');

const list = async function list(accountId, apiKey) {
  const listOptions = {
    url: getListUrl(accountId, apiKey),
    headers: {
      'X-Binaris-Api-Key': apiKey,
    },
    json: true,
  };
  return getValidatedBody(listOptions, 'get');
};

module.exports = list;
