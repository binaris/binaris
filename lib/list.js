'use strict';

const { getAccountId, getAPIKey } = require('./userConf');
const { list } = require('../sdk');

/**
 * List currently deployed functions.
 *
 * @returns {object} Map of function name to tag, mod date and digest.
 * e.g.
 * {
 *   "foo": {
 *     "tags": {
 *       "latest": {
 *         "modifiedAt": "2018-05-21T12:13:15.145Z",
 *         "digest": "b8c7c75d25fd6d5d93518373f4bbbd7e11ee28fcb609fc28b6f134c5eaa0c9ba"
 *       }
 *     }
 *   }
 * }
 */
const listCLI = async function listCLI() {
  const apiKey = await getAPIKey();
  const accountId = await getAccountId();
  return list(accountId, apiKey);
};

module.exports = listCLI;
