'use strict';

const urljoin = require('urljoin');
const { getDeployEndpoint, getInvokeEndpoint, getLogEndpoint } = require('./config');

const getInvokeUrl = function getInvokeUrl(accountId, funcName, apiKey) {
  // TODO: remove this when we phase out V1 URLs, this is here to not break current customers' usage
  if (!accountId) {
    return urljoin(`https://${getInvokeEndpoint()}`, 'v1', 'run', apiKey, funcName);
  }
  return urljoin(`https://${getInvokeEndpoint()}`, 'v2', 'run', accountId, funcName);
};

const getLogsUrl = function getLogsUrl(accountId, funcName, apiKey) {
  // TODO: remove this when we phase out V1 URLs, this is here to not break current customers' usage
  if (!accountId) {
    return urljoin(`https://${getLogEndpoint()}`, 'v1', 'logs', `${apiKey}-${funcName}`);
  }
  return urljoin(`https://${getLogEndpoint()}`, 'v2', 'logs', accountId, funcName);
};

const getCodeUploadUrl = function getCodeUploadUrl(accountId) {
  // TODO: remove this when we phase out V1 URLs, this is here to not break current customers' usage
  if (!accountId) {
    return urljoin(`https://${getDeployEndpoint()}`, 'v2', 'code');
  }
  return urljoin(`https://${getDeployEndpoint()}`, 'v3', 'code', accountId);
};

const getConfUploadUrl = function getConfUploadUrl(accountId, funcName, apiKey) {
  // TODO: remove this when we phase out V1 URLs, this is here to not break current customers' usage
  if (!accountId) {
    return urljoin(`https://${getDeployEndpoint()}`, 'v2', 'conf', apiKey, funcName);
  }
  return urljoin(`https://${getDeployEndpoint()}`, 'v3', 'conf', accountId, funcName);
};

const getConfTagUrl = function getConfTagUploadUrl(accountId, funcName, apiKey, tag) {
  // TODO: remove this when we phase out V1 URLs, this is here to not break current customers' usage
  if (!accountId) {
    return urljoin(`https://${getDeployEndpoint()}`, 'v2', 'tag', apiKey, funcName, tag);
  }
  return urljoin(`https://${getDeployEndpoint()}`, 'v3', 'tag', accountId, funcName, tag);
};

module.exports = {
  getCodeUploadUrl,
  getConfUploadUrl,
  getConfTagUrl,
  getInvokeUrl,
  getLogsUrl,
};
