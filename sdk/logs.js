'use strict';

const { loggedRequest, validateResponse } = require('./handleError');

const { getLogsUrl } = require('./url');

const msleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function orError(func) {
  try {
    return [await func()];
  } catch (e) {
    return [null, e];
  }
}

/**
 * Retrieves the logs of a previously deployed Binaris function.
 *
 * @param {string} accountId - Binaris account id
 * @param {string} funcName - name of functions whose logs will be retrieved
 * @param {string} apiKey - Binaris API key used to authenticate function invocation
 * @param {boolean} follow - as in tail -f
 * @param {Date} startAfter - datetime of first log record to fetch
 * @param {string} token - token for fetching next page (returned by this function)
 */
const logs = async function logs(accountId, funcName, apiKey, follow, startAfter, token) { // eslint-disable-line consistent-return,max-len
  const options = {
    forever: true,
    url: getLogsUrl(accountId, funcName),
    headers: {
      'X-Binaris-Api-Key': apiKey,
    },
    qs: {
      startAfter,
      token,
      follow,
    },
  };

  const backoffSecs = [1, 2, 4];
  // eslint-disable-next-line no-constant-condition
  while (true) { // exits inside loop.
    // eslint-disable-next-line no-await-in-loop
    const [ok, notOk] = await orError(async () => {
      const { body, headers } =
        validateResponse(await loggedRequest(options, 'get'));
      return {
        body,
        nextToken: headers['x-binaris-next-token'],
      };
    });

    if (ok) return ok;
    const backoffSec = backoffSecs.shift();
    if (backoffSec === undefined) throw notOk;
    msleep(backoffSec * 1000);
  }
};

module.exports = logs;
