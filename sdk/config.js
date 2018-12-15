'use strict';

const defaultEndpoints = {
  deploy: 'api-prod.binaris.com',
  invoke: 'run-prod.binaris.com',
  logs: 'log-prod.binaris.com',
};

const getDeployEndpoint = function getDeployEndpoint() {
  return process.env.BINARIS_DEPLOY_ENDPOINT || defaultEndpoints.deploy;
};

const getInvokeEndpoint = function getInvokeEndpoint() {
  return process.env.BINARIS_INVOKE_ENDPOINT || defaultEndpoints.invoke;
};

const getLogEndpoint = function getLogEndpoint() {
  return process.env.BINARIS_LOG_ENDPOINT || defaultEndpoints.logs;
};

const forceRealm = function forceRealm(realm) {
  defaultEndpoints.deploy = `api-${realm}.binaris.com`;
  defaultEndpoints.invoke = `run-${realm}.binaris.com`;
  defaultEndpoints.logs = `logs-${realm}.binaris.com`;
};

module.exports = {
  getDeployEndpoint,
  getInvokeEndpoint,
  getLogEndpoint,
  forceRealm,
};

