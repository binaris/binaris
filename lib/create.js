'use strict';


const { writeFile } = require('fs');
const { promisify } = require('util');
const { copy } = require('fs-extra');
const path = require('path');


const templater = require('./functionTemplates/template');
const { validateName } = require('./nameUtil');
const YMLUtil = require('./binarisYML');

const templateDir = path.join(__dirname, 'functionTemplates');

const writeAsync = promisify(writeFile);

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
    const codeTemplate = templater(runtime, entrypoint);
    await writeAsync(path.join(functionPath, file), codeTemplate);
  }

  await YMLUtil.saveBinarisConf(functionPath, binarisConf);
  return finalName;
};

module.exports = {
  create,
  experimentalRuntimes,
};
