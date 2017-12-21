const get = require('lodash.get');

const { translateErrorCode } = require('pickle');

module.exports = {
  checkAndHandleError: (response) => {
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
