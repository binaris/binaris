'use strict';

const { IncomingWebhook } = require('@slack/client');

const feedback = async function feedback(realm, funcData) {
  let slackWebhookUrl;
  slackWebhookUrl = String('https://hooks.slack.com/services/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');

  const webhook = new IncomingWebhook(slackWebhookUrl);
  return webhook.send(`User with email ${funcData.email} on realm ${realm} provided feedback: ${funcData.message}`);
};

module.exports = feedback;