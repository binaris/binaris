const { remove } = require('../sdk');
const { getApiKey } = require('./userConf');

/**
 * Removes the function from the Binaris cloud.
 *
 * @param {string} funcName - the name of the function to remove
 */
const removeCLI = async function removeCLI(funcName) {
  const apiKey = await getApiKey();
  return remove(funcName, apiKey);
};

module.exports = removeCLI;
