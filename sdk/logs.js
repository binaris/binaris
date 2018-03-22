const urljoin = require('urljoin');
const rp = require('request-promise-native');

const { logEndpoint } = require('./config');

/**
 * Retrieves the logs of a previously deployed Binaris function.
 *
 * @param {string} functionName - name of functions whose logs will be retrieved
 * @param {string} apiKey - Binaris API key used to authenticate function invocation
 * @param {boolean} follow - As in tail -f
 * @param {number} startEpochMillisecs - Epoch of first log time to fetch
 * @param {string} token - Token for fetching next page (returned by this function)
 */
const logs = async function logs(functionName, apiKey, follow, startEpochMillisecs, token) {
  const options = {
    json: true,
    forever: true,
    resolveWithFullResponse: true,
    url: urljoin(`https://${logEndpoint}`, 'v1', 'logs', `${apiKey}-${functionName}`),
    qs: {
      startEpochMillisecs,
      token,
      follow,
    },
  };

  const res = await rp.get(options);
  return {
    body: res.body,
    nextToken: res.headers['x-binaris-next-token'],
  };
};

module.exports = logs;
