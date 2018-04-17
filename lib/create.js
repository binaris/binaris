const fse = require('fs-extra');
const path = require('path');

const { validateName } = require('./nameUtil');
const YMLUtil = require('./binarisYML');

const templateDir = 'functionTemplates';
const runtimeToTemplateDir = {
  node8: 'js',
  python2: 'py2',
  pypy2: 'py2',
};

/**
 * Creates a Binaris function with the given name at the
 * provided path. If a name is not provided one will be randomly
 * generated.
 *
 * @param {string} functionName - the name of the function to create
 * @param {string} functionPath - the path to create the function at
 * @param {string} runtime - name of runtime to run the function
 * @returns {string} - the final name selected for the function
 */
const create = async function create(functionName, functionPath, runtime) {
  // removing the '-' from monikers string is required because they
  // don't allow the glue string to be empty.
  const finalName = functionName;
  validateName(finalName);
  const template = runtimeToTemplateDir[runtime];
  if (!template) {
    throw new Error(`No template for runtime: ${runtime}`);
  }
  // parse the templated yml and make the necessary modifications
  const templatePath = path.join(__dirname, templateDir, template);
  const binarisConf = await YMLUtil.loadBinarisConf(templatePath);
  const templateName = YMLUtil.getFuncName(binarisConf);
  const funcConf = { ...YMLUtil.getFuncConf(binarisConf, templateName), runtime };
  // replace the generic function name with the actual name
  YMLUtil.delFuncConf(binarisConf, templateName);
  YMLUtil.addFuncConf(binarisConf, finalName, funcConf);
  // now write out all the files that have been modified
  const file = funcConf.file;
  await fse.copy(path.join(templatePath, file), path.join(functionPath, file));
  await YMLUtil.saveBinarisConf(functionPath, binarisConf);
  return finalName;
};

module.exports = create;
