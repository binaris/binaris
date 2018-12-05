'use strict';

const { getConfTagUrl } = require('./url');
const { getValidatedBody } = require('./handleError');

/**
 * Removes the function from the Binaris cloud.
 *
 * @param {string} accountId - Binaris account ID
 * @param {string} funcName - the name of the function to remove
 * @param {string} apiKey - the apiKey to authenticate the removal with
 */
const remove = async function remove(accountId, funcName, apiKey) {
  const options = {
    url: getConfTagUrl(accountId, funcName, apiKey, 'latest'),
    headers: {
      'X-Binaris-Api-Key': apiKey,
    },
  };
  return getValidatedBody(options, 'delete');
};

module.exports = remove;
