'use strict';

const { IncomingWebhook } = require('@slack/client');

const feedback = async function feedback(realm, funcData) {
  const slackWebhookUrl = String('https://hooks.slack.com/services/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');
  let result = {};

  if (!funcData.message.includes('ZL3FtCMyqeRQjP5GESTRbDRwMEjshHhjYAXHiMRZg3EOtutyWvEWcYJN7704ch3W')) {
    const webhook = new IncomingWebhook(slackWebhookUrl);
    result = webhook.send(`User with email ${funcData.email} on realm ${realm} provided feedback: ${funcData.message}`);
  }
  return result;
};

module.exports = feedback;
