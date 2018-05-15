const get = require('lodash.get');
const { inspect } = require('util');

const logger = require('./logger');

const { translateErrorCode } = require('binaris-pickle');

module.exports = {
  checkAndHandleError: (response) => {
    logger.debug('raw response', inspect(response, { depth: null }));
    if (response.status >= 200 && response.status < 300) {
      return;
    }
    if (get(response, 'body.errorCode')) {
      throw new Error(translateErrorCode(response.body.errorCode));
    } else {
      throw new Error(translateErrorCode('ERR_NO_BACKEND'));
    }
  },
};
