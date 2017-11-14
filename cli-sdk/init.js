const fse = require('fs-extra');
const path = require('path');
const validator = require('validator');
const moniker = require('moniker');

const YMLUtil = require('./binarisYML');

const templateDir = './functionTemplates/nodejs/';

// 63 total minus 5 used for 'bolt-' which is prepended
const maxNameLength = 58;

/**
 * Sanitize the name, removing any invalid or non-unicode
 * characters.
 *
 * @param {string} name - the name to sanitize
 * @returns {string} - the sanitized version of the input name
 */
const sanitizeName = function sanitizeName(name) {
  return validator.whitelist(name, '\\[^A-Za-z-.0-9\\]');
};

/**
 * Initializes a Binaris function with the given name at the
 * provided path. If a name is not provided one will be randomly
 * generated.
 *
 * @param {string} functionName - the name of the function to initialize
 * @param {string} functionPath - the path to initialize the function at
 * @returns {string} - the final name selected for the function
 */
const init = async function init(functionName, functionPath) {
  const finalName = sanitizeName(functionName || moniker.choose());
  if (functionName) {
    if (functionName.length !== finalName.length) {
      throw new Error(`Invalid characters in function name ${functionName}. Use only letters, digits, and "-."`);
    }
  }

  if (finalName.length > maxNameLength) {
    throw new Error(`Function name ${finalName} length(${finalName.length}) exceeds max length(${maxNameLength})`);
  }

  // parse the templated yml and make the necessary modifications
  const templatePath = path.join(__dirname, templateDir);
  const binarisConf = await YMLUtil.loadBinarisConf(templatePath);
  const templateName = YMLUtil.getFuncName(binarisConf);
  const funcConf = YMLUtil.getFuncConf(binarisConf, templateName);
  // replace the generic function name with the actual name
  YMLUtil.addFuncConf(binarisConf, finalName, funcConf);
  YMLUtil.delFuncConf(binarisConf, templateName);
  // now write out all the files that have been modified
  const file = funcConf.file;
  await fse.copy(path.join(__dirname, templateDir, file), path.join(functionPath, file));
  await YMLUtil.saveBinarisConf(functionPath, binarisConf);
  return finalName;
};

module.exports = init;
