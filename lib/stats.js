const { stats } = require('../sdk');
const { getAPIKey } = require('./userConf');

/**
 * Retrieves account usage statistics
 *
 * @param {moment} since - get stats since (inclusive)
 * @param {moment} until - get stats until (non-inclusive)
 */
const statsCLI = async function statsCLI(since, until) {
  const apiKey = await getAPIKey();
  return stats(apiKey, since, until);
};

module.exports = statsCLI;
