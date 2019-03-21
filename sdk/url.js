'use strict';

const urljoin = require('urljoin');
const { getDeployEndpoint, getInvokeEndpoint, getLogEndpoint } = require('./config');

const getInvokeUrl = function getInvokeUrl(accountId, funcName) {
  return urljoin(`https://${getInvokeEndpoint()}`, 'v2', 'run', accountId, funcName);
};

const getLogsUrl = function getLogsUrl(accountId, funcName) {
  return urljoin(`https://${getLogEndpoint()}`, 'v2', 'logs', accountId, funcName);
};

const getCodeUploadUrl = function getCodeUploadUrl(accountId) {
  return urljoin(`https://${getDeployEndpoint()}`, 'v3', 'code', accountId);
};

const getConfUploadUrl = function getConfUploadUrl(accountId, funcName) {
  return urljoin(`https://${getDeployEndpoint()}`, 'v3', 'conf', accountId, funcName);
};

const getConfTagUrl = function getConfTagUploadUrl(accountId, funcName, tag) {
  return urljoin(`https://${getDeployEndpoint()}`, 'v3', 'tag', accountId, funcName, tag);
};

const getListUrl = function getListUrl(accountId) {
  return urljoin(`https://${getDeployEndpoint()}`, 'v3', 'functions', accountId);
};

const getStatsUrl = function getStatsUrl(accountId) {
  return urljoin(`https://${getDeployEndpoint()}`, 'v3', 'metrics', accountId);
};

function getTriggersListUrl() {
  return urljoin(`https://${getDeployEndpoint()}`, 'v3', 'triggers');
}

function getSpecificTriggerUrl(triggerName) {
  return urljoin(`https://${getDeployEndpoint()}`, 'v3', 'triggers', triggerName);
}

module.exports = {
  getCodeUploadUrl,
  getConfUploadUrl,
  getConfTagUrl,
  getInvokeUrl,
  getLogsUrl,
  getListUrl,
  getStatsUrl,
  getTriggersListUrl,
  getSpecificTriggerUrl,
};
