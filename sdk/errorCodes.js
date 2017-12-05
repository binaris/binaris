const errStringMap = {
  ERR_BAD_KEY: 'Invalid API key',
  ERR_INTERNAL: 'Internal Binaris server error',
};

/**
 * Translates a provided Binaris error code into it's more
 * explicit and descriptive string representation.
 *
 * @param errCode - errCode to retrieve string of
 */
const translateErrorCode = function translateErrorCode(errCode) {
  if (Object.prototype.hasOwnProperty.call(errStringMap, errCode)) {
    return errStringMap[errCode];
  }
  return errCode;
};

// TODO(ryland): add template support
module.exports = {
  translateErrorCode,
};
