// 63 total minus 5 used for 'bolt-' which is prepended
const maxNameLength = 58;

/**
 * Verifies whether the provided function name meets
 * the validity criteria. If it does not, an informative
 * error will be thrown.
 *
 * @param {string} functionName - name of function to validate
 */
const validateName = function validateName(functionName) {
  const finalName = functionName.replace(/[^a-za-z0-9]/g, '');
  if (finalName !== functionName) {
    throw new Error(`Invalid characters in function name ${functionName}. Use only letters and digits`);
  }
  if (finalName.length > maxNameLength) {
    throw new Error(`Function names cannot be longer than ${maxNameLength} characters.`);
  }
}

module.exports = validateName;

