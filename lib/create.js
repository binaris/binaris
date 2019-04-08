'use strict';

const { copy } = require('fs-extra');
const replace = require('replace-in-file');
const path = require('path');

const { validateName } = require('./nameUtil');
const YMLUtil = require('./binarisYML');

const templateDir = path.join(__dirname, 'functionTemplates');

const runtimeToTemplateDir = {
  node8: 'js',
  python2: 'py2',
  pypy2: 'py2',
  java8: 'java8',
  python3: 'py2',
};

const experimentalRuntimes = ['java8'];

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
const create = async function create(functionName, functionPath,
  runtime, config) {
  const finalName = functionName;
  validateName(finalName);
  const template = runtimeToTemplateDir[runtime];
  if (!template) {
    throw new Error(`No template for runtime: ${runtime}`);
  }
  // parse the templated yml and make the necessary modifications
  const templatePath = path.join(templateDir, template);
  const binarisConf = await YMLUtil.loadBinarisConf(templatePath);
  const templateName = YMLUtil.getFuncName(binarisConf);
  const funcConf = {
    ...YMLUtil.getFuncConf(binarisConf, templateName),
    runtime,
    ...config,
  };

  // replace the generic function name with the actual name
  YMLUtil.delFuncConf(binarisConf, templateName);
  YMLUtil.addFuncConf(binarisConf, finalName, funcConf);
  // now write out all the files that have been modified
  await copy(templatePath, functionPath, { overwrite: false, errorOnExist: true });

  // currently custom entry points are not supported in Java8
  if (runtime !== 'java8') {
    const { entrypoint, file } = funcConf;
    await replace({
      files: path.join(functionPath, file),
      from: /HANDLER_NAME/g,
      to: entrypoint,
    });
  }

  await YMLUtil.saveBinarisConf(functionPath, binarisConf);
  return finalName;
};

module.exports = {
  create,
  experimentalRuntimes,
};
