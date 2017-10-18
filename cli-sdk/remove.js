const { remove } = require('../sdk');
const log = require('./logger');
const YMLUtil = require('./binarisYML');

const removeCLI = async function removeCLI(funcName) {
  return remove(funcName);
};

module.exports = removeCLI;
