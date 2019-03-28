'use strict';

const { logs } = require('../sdk');
const { getAccountId, getAPIKey } = require('./userConf');

/**
 * Retrieves the logs of a previously deployed Binaris function.
 *
 * @param {string} funcName - name of functions whose logs will be retrieved
 * @param {boolean} follow - read the logs in tail -f fashion
 * @param {moment} since - get log since date
 * @param {ReadableStream} logStream - output stream to feed log records
 */
const logCLI = async function logCLI(funcName, follow, since, logStream) {
  const apiKey = await getAPIKey();
  const accountId = await getAccountId();
  let token;
  let startAfter = since && since.toISOString();
  if (!follow && !startAfter) {
    const baseDate = new Date();
    baseDate.setTime(0);
    startAfter = baseDate.toISOString();
  }
  do {
    // eslint-disable-next-line no-await-in-loop
    const { nextToken, body } = await logs(accountId, funcName, apiKey, follow, startAfter, token);
    for (const record of body) {
      logStream.push(record);
    }
    token = nextToken;
  } while (token);
};

module.exports = logCLI;
