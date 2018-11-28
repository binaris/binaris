'use strict';

const { feedback } = require('../sdk');
const { getRealm } = require('./userConf');

/**
 * Invokes a previously deployed Binaris function.
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
