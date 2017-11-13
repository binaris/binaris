const urljoin = require('urljoin');
const rp = require('request-promise-native');

const { logEndpoint } = require('./config');

/**
 * Retrieves the logs of a previously deployed Binaris function.
 *
 * @param {string} functionName - name of functions whose logs will be retrieved
 * @param {string} apiKey - Binaris API key used to authenticate function invocation
 * @param {string} startingEntry - the log entry to start from(but not including)
 */
const logs = async function logs(functionName, apiKey, startingEntry) {
  const options = {
    json: true,
    forever: true,
    resolveWithFullResponse: true,
  };

  // determine which mode to query the log endpoint with
  const mode = startingEntry ? 'tailf' : 'logs';
  options.url = urljoin(`https://${logEndpoint}`, 'v1',
    'logs', `${apiKey}-${functionName}`, mode);
  if (mode === 'tailf') {
    options.qs = {
      startEpochMillisecs: startingEntry.timestamp,
      token: startingEntry.offset,
    };
  }

  return (await rp.get(options)).body || [];
};

module.exports = logs;
