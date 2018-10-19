const urljoin = require('urljoin');
const { loggedRequest, validateResponse } = require('./handleError');
const logger = require('../lib/logger');

const { getLogEndpoint } = require('./config');

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
    forever: true,
    url: urljoin(`https://${getLogEndpoint()}`, 'v1', 'logs', `${apiKey}-${functionName}`),
    qs: {
      startAfter,
      token,
      follow,
    },
  };

  for (let attempt = 1, backoff = 3; attempt <= 3; attempt += 1, backoff *= 2) {
    // eslint-disable-next-line no-await-in-loop
    try {
      const { body, headers } = validateResponse(await loggedRequest(options, 'get'));
      return {
        body,
        nextToken: headers['x-binaris-next-token'],
      };
    } catch (err) {
      logger.debug('failed to fetch logs', {
        err,
        attempt,
      });
      // eslint-disable-next-line no-await-in-loop
      await msleep(backoff);
    }
  }
};

module.exports = logs;
