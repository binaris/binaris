const fs = require('fs');
const path = require('path');

const log = require('../shared/logger');
const util = require('../shared/util');

const templateDir = './functionTemplates/nodejs/';

const init = async function init(functionName, functionPath) {
  if (!functionName) {
    throw new Error('Invalid function name provided!');
  }
  if (!functionPath) {
    throw new Error('Invalid function path provided!');
  }

  log.debug('attempting to load template files for function dir creation');
  // parse our templated yml and make the necessary modifications
  const templatePath = path.join(__dirname, templateDir);
  const binarisConf = util.loadBinarisConf(templatePath);
  const templateName = util.getFuncName(binarisConf);
  const funcConf = util.getFuncConf(binarisConf, templateName);
  // replace the generic function name with the actual name
  util.addFuncConf(binarisConf, functionName, funcConf);
  util.delFuncConf(binarisConf, templateName);

  const newDir = path.join(functionPath, functionName);
  // ensure that the function directory doesn't already exist
  try {
    fs.mkdirSync(newDir);
  } catch (err) {
    log.debug(err);
    throw new Error(`Function ${functionName} could not be initialized because a directory already exists with that name!`);
  }
  log.debug('loading and replicating all template files');

  // now we have to write out all our files that we've modified
  const file = funcConf.file;
  fs.writeFileSync(path.join(newDir, file),
    fs.readFileSync(path.join(__dirname, templateDir, file)));
  util.saveBinarisConf(newDir, binarisConf);
};

module.exports = init;
