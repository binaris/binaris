'use strict';

const { feedback } = require('../sdk');
const { getRealm } = require('./userConf');

/**
 * Supplies feedback from the CLI input.
 *
 * @param {object} funcData - a JSON object that contains a string email and feedback message.
 *
 * @returns {object} - response of function invocation
 */
const feedbackCLI = async function feedbackCLI(funcData) {
  const realm = await getRealm();
  return feedback(realm, funcData);
};

module.exports = feedbackCLI;
