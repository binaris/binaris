const { remove } = require('../sdk');

const removeCLI = async function removeCLI(funcName) {
  return await remove(funcName);
};

module.exports = removeCLI;
