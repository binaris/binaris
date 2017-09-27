const fs = require('fs');
const path = require('path');

const moniker = require('moniker');

const log = require('./logger');
const YMLUtil = require('./binarisYML');

const templateDir = './functionTemplates/nodejs/';

// TODO: either export this or move it to shared file
// here we both ensure the name is valid syntatically and eventually
// we will also determine if it has been previously created
const validateFunctionName = function validateFunctionName(name) {
  // eslint issue but too annoying to fix given time
  if (/[~`!#$%^&*+=\\[\]\\';,/{}|\\":<>?]/g.test(name)) {
    return false;
  }

  // need to add an SDK? call to ensure that the name is not only
  // syntatically valid but also unique
  return true;
};

const init = async function init(functionName, functionPath) {
  let finalName;
  if (functionName) {
    const answer = validateFunctionName(functionName);
    if (answer) {
      finalName = functionName;
    } else {
      throw new Error(`${functionName} is not a valid function name`);
    }
  } else {
    while (!finalName) {
      // until the system supports dashes in names
      const potentialName = moniker.choose().replace(/-/g, '');
      const answer = validateFunctionName(potentialName);
      if (answer) {
        finalName = potentialName;
      }
    }
  }

  if (!functionPath) {
    throw new Error('Invalid function path provided!');
  }

  log.debug('attempting to load template files for function dir creation');
  // parse our templated yml and make the necessary modifications
  const templatePath = path.join(__dirname, templateDir);
  const binarisConf = YMLUtil.loadBinarisConf(templatePath);
  const templateName = YMLUtil.getFuncName(binarisConf);
  const funcConf = YMLUtil.getFuncConf(binarisConf, templateName);
  // replace the generic function name with the actual name
  YMLUtil.addFuncConf(binarisConf, finalName, funcConf);
  YMLUtil.delFuncConf(binarisConf, templateName);
  const newDir = path.join(functionPath, finalName);
  // ensure that the function directory doesn't already exist
  try {
    fs.mkdirSync(newDir);
  } catch (err) {
    log.debug(err);
    throw new Error(`Function ${finalName} could not be initialized because a directory already exists with that name!`);
  }
  log.debug('loading and replicating all template files');

  // now we have to write out all our files that we've modified
  const file = funcConf.file;
  fs.writeFileSync(path.join(newDir, file),
    fs.readFileSync(path.join(__dirname, templateDir, file)));
  YMLUtil.saveBinarisConf(newDir, binarisConf);
  return finalName;
};

module.exports = init;
