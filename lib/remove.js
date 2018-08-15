const { remove } = require('../sdk');
const { getAPIKey } = require('./userConf');
const { checkAndHandleError } = require('./handleError');

/**
 * Removes the function from the Binaris cloud.
 *
 * @param {string} funcName - the name of the function to remove
 */
const removeCLI = async function removeCLI(funcName) {
  const apiKey = await getAPIKey();
  const removeResponse = await remove(funcName, apiKey);
  const advice = checkAndHandleError(removeResponse);
  return {
    advice,
    response: removeResponse,
  };
};

module.exports = removeCLI;
