const { log } = require('../sdk');
const { getAPIKey } = require('./userConf');

// time(ms) it takes between log retrievals
const msLogPollInterval = 1000;

/**
 * Imitates stdc sleep behavior using es6 async/await
 *
 * @param {int} ms - the duration in milliseconds to sleep
 */
const msSleep = function msSleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retrieves the logs of a previously deployed Binaris function.
 *
 * @param {string} functionName - name of functions whose logs will be retrieved
 * @param {boolean} tail - read the logs in tail -f fashion
 * @param {string} startingEntry - the log entry to start from(but not including)
 */
const logCLI = async function logCLI(funcName, tail, logStream) {
  const apiKey = await getAPIKey();
  let latestLog;
  let streamingLogs = true;
  while (streamingLogs) {
    // eslint-disable-next-line no-await-in-loop
    const logs = await log(funcName, apiKey, latestLog);
    if (logs.length !== 0) {
      latestLog = logs[logs.length - 1];
      logs.forEach(logEntry =>
        logStream.push(logEntry));
    }
    if (tail) {
      // eslint-disable-next-line no-await-in-loop
      await msSleep(msLogPollInterval);
    } else {
      streamingLogs = false;
    }
  }
};

module.exports = logCLI;
