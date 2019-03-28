'use strict';

const logger = require('../lib/logger');
const { getValidatedBody } = require('./handleError');
const { getStatsUrl } = require('./url');

/**
 * Retrieves account usage statistics
 *
 * @param {string} accountId - Binaris account ID
 * @param {string} apiKey - Binaris API key
 * @param {Date} since - All stats since the date-time
 * @param {Date} until - All stats until the date-time
 */
const stats = async function stats(accountId, apiKey, since, until) { // eslint-disable-line consistent-return,max-len
  const statsOptions = {
    url: getStatsUrl(accountId),
    headers: {
      'X-Binaris-Api-Key': apiKey,
    },
    body: {
      since,
      until,
    },
  };

  logger.debug('Fetching account usage stats', { statsOptions });
  return getValidatedBody(statsOptions, 'get');
};

module.exports = stats;
