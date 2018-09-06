const urljoin = require('urljoin');
const logger = require('../lib/logger');
const { loggedRequest } = require('./handleError');

const { getDeployEndpoint } = require('./config');

/**
 * Retrieves account usage statistics
 *
 * @param {string} apiKey - Binaris API key
 * @param {Date} since - All stats since the date-time
 * @param {Date} until - All stats until the date-time
 */
const stats = async function stats(apiKey, since, until) { // eslint-disable-line consistent-return,max-len
  const statsURLBase = `https://${getDeployEndpoint()}`;
  const statsOptions = {
    url: urljoin(statsURLBase, 'v2', 'metrics', apiKey),
    body: {
      since,
      until,
    },
  };

  logger.debug('Fetching account usage stats', { statsOptions });
  const metrics = await loggedRequest(statsOptions, 'get');
  return metrics;
};

module.exports = stats;
