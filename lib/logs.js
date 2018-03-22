const { logs } = require('../sdk');
const { getAPIKey } = require('./userConf');

/**
 * Retrieves the logs of a previously deployed Binaris function.
 *
 * @param {string} functionName - name of functions whose logs will be retrieved
 * @param {boolean} follow - read the logs in tail -f fashion
 * @param {ReadableStream} logStream - output stream to feed log records
 */
const logCLI = async function logCLI(funcName, follow, logStream) {
  const apiKey = await getAPIKey();
  let token;
  do {
    // eslint-disable-next-line no-await-in-loop
    const { nextToken, body } = await logs(funcName, apiKey, follow, undefined, token);
    for (const record of body) {
      logStream.push(record);
    }
    token = nextToken;
  } while (token);
};

module.exports = logCLI;
