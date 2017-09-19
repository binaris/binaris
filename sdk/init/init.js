const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const log = require('../shared/logger');

const templateDir = './functionTemplates/nodejs/';
const templateName = 'hello';

const init = async function init(functionName, functionPath) {
  if (functionName && functionPath) {
    log.debug('attempting to load template files for function dir creation');
    // parse our templated yml and make the necessary modifications
    const vanillaConfig = yaml.safeLoad(fs.readFileSync(path.join(__dirname,
      templateDir, 'binaris.yml'), 'utf8'));
    // replace the generic function name with the actual name
    vanillaConfig['function'][functionName] = vanillaConfig['function'][templateName];
    delete vanillaConfig['function'][templateName];
    const functionConfig = yaml.dump(vanillaConfig);
    const newDir = path.join(functionPath, functionName);
    // ensure that the function directory doesn't already exist

    try {
      fs.mkdirSync(newDir);
    } catch (err) {
      log.debug(err);
      throw new Error(`Function w/ name ${functionName} could not be initialized because a directory already exists with that name!`);
    }
    // here we are just loading our JSON and giving it the correct function name
    const packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname,
      templateDir, 'package.json'), 'utf8'));

    packageJSON.name = functionName;
    log.debug('loading and replicating all template files');
    // now we have to write out all our files that we've modified
    fs.writeFileSync(path.join(newDir, packageJSON.main),
      fs.readFileSync(path.join(__dirname, templateDir, packageJSON.main)));
    fs.writeFileSync(path.join(newDir, 'package.json'),
      JSON.stringify(packageJSON, null, 2), 'utf8');
    fs.writeFileSync(path.join(newDir, 'binaris.yml'), functionConfig, 'utf8');
    return;
  }
  throw new Error('Invalid function path or function name provided!');
};

module.exports = init;
