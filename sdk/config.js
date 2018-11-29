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

module.exports = {
  getDeployEndpoint,
  getInvokeEndpoint,
  getLogEndpoint,
};

