const urljoin = require('urljoin');
const rp = require('request-promise-native');
const logger = require('../lib/logger');

const { logEndpoint } = require('./config');

const msleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retrieves the logs of a previously deployed Binaris function.
 *
 * @param {string} functionName - name of functions whose logs will be retrieved
 * @param {string} apiKey - Binaris API key used to authenticate function invocation
 * @param {boolean} follow - as in tail -f
 * @param {Date} startAfter - datetime of first log record to fetch
 * @param {string} token - token for fetching next page (returned by this function)
 */
const logs = async function logs(functionName, apiKey, follow, startAfter, token) { // eslint-disable-line consistent-return,max-len
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

  for (let attempt = 1, backoff = 3; attempt <= 3; attempt += 1, backoff *= 2) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { statusCode, headers, body } = await rp.get(options);
      logger.debug('logs response', { statusCode, headers, body });
      return {
        body,
        nextToken: headers['x-binaris-next-token'],
      };
    } catch (err) {
      // Not a 5xx error
      if (!err.statusCode || err.statusCode < 500
        || err.statusCode >= 600) {
        throw err;
      }
      logger.debug('failed to fetch logs', {
        statusCode: err.statusCode,
        message: err.message,
        attempt,
      });
      // eslint-disable-next-line no-await-in-loop
      await msleep(backoff);
    }
  }
};

module.exports = logs;
