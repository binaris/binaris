'use strict';

const getDeployEndpoint = function getDeployEndpoint() {
  return process.env.BINARIS_DEPLOY_ENDPOINT || 'api.binaris.com';
};

const getInvokeEndpoint = function getInvokeEndpoint() {
  return process.env.BINARIS_INVOKE_ENDPOINT || 'run.binaris.com';
};

const getLogEndpoint = function getLogEndpoint() {
  return process.env.BINARIS_LOG_ENDPOINT || 'log.binaris.com';
};

const forceRealm = function forceRealm(realm) {
  process.env.BINARIS_DEPLOY_ENDPOINT = process.env.BINARIS_DEPLOY_ENDPOINT || `api-${realm}.binaris.com`;
  process.env.BINARIS_INVOKE_ENDPOINT = process.env.BINARIS_INVOKE_ENDPOINT || `run-${realm}.binaris.com`;
  process.env.BINARIS_LOG_ENDPOINT = process.env.BINARIS_LOG_ENDPOINT || `log-${realm}.binaris.com`;
};

module.exports = {
  getDeployEndpoint,
  getInvokeEndpoint,
  getLogEndpoint,
  forceRealm,
};

