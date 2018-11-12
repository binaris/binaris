const maxNameLength = 200;
// allows only letters and numbers
const validNameRegex = /[^A-Za-z0-9]/g;

/**
 * Verifies whether the provided function name meets
 * the validity criteria. If it does not, an informative
 * error will be thrown.
 *
 * @param {string} functionName - name of function to validate
 */
const validateName = function validateName(functionName) {
  if (validNameRegex.test(functionName)) {
    throw new Error(`Invalid characters in function name ${functionName}. Use only letters and digits`);
  }
  if (functionName.length > maxNameLength) {
    throw new Error(`Function names cannot be longer than ${maxNameLength} characters.`);
  }
};

/**
 * Removes any illegal characters from the provided name
 * thereby making it valid to use for a Binaris function.
 *
 * @param {string} functionName - name to remove potential bad chars from
 * @returns {string} - input name minus any illegal characters
 */
const makeNameValid = function makeNameValid(functionName) {
  return functionName.replace(validNameRegex, '');
};

module.exports = {
  makeNameValid,
  validateName,
};
