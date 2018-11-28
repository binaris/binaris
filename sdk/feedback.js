'use strict';

const { IncomingWebhook } = require('@slack/client');

const feedback = async function feedback(realm, funcData) {
  let slackWebhookUrl;
  if (realm === 'prod') {
    slackWebhookUrl = String('https://hooks.slack.com/services/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');
  } else {
    slackWebhookUrl = String('https://hooks.slack.com/services/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');
  }

  const webhook = new IncomingWebhook(slackWebhookUrl);
  return webhook.send(`User with email ${funcData.email} provided feedback: ${funcData.message}`);
};

module.exports = feedback;
