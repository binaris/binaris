// Mapping between well known Binaris error codes and
// their human-readable string representation. Error
// strings should be concise informative and without
// trailing punctuation (no !). The first letter should
// be capital (barring abnormal circumstances).
const errStringMap = {
  ERR_BAD_KEY: 'Invalid API key',
  ERR_INTERNAL: 'Internal Binaris server error',
  ERR_NO_REQ_ID: 'Missing request ID header',
};

/**
 * Translates a provided Binaris error code into its more
 * explicit and descriptive string representation.
 *
 * @param errCode - errCode to retrieve string of
 */
const translateErrorCode = function translateErrorCode(errCode) {
  return errStringMap[errCode] || errCode;
};

// TODO(ryland): add template support
module.exports = { translateErrorCode };