const urljoin = require('urljoin');
const rp = require('request-promise-native');
const logger = require('../lib/logger');

const { logEndpoint } = require('./config');

/**
 * Retrieves the logs of a previously deployed Binaris function.
 *
 * @param {string} functionName - name of functions whose logs will be retrieved
 * @param {string} apiKey - Binaris API key used to authenticate function invocation
 * @param {boolean} follow - As in tail -f
 * @param {Date} startAfter - Datetime of first log record to fetch
 * @param {string} token - Token for fetching next page (returned by this function)
 */
const logs = async function logs(functionName, apiKey, follow, startAfter, token) {
  const options = {
    json: true,
    forever: true,
    resolveWithFullResponse: true,
    url: urljoin(`https://${logEndpoint}`, 'v1', 'logs', `${apiKey}-${functionName}`),
    qs: {
      startAfter,
      token,
      follow,
    },
  };

  logger.debug('Logs request', options);
  const { statusCode, headers, body } = await rp.get(options);
  logger.debug('Logs response', { statusCode, headers, body });
  return {
    body,
    nextToken: headers['x-binaris-next-token'],
  };
};

module.exports = logs;
