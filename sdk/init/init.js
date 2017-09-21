const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const log = require('../shared/logger');

const templateDir = './functionTemplates/nodejs/';
const templateName = 'hello';
const ymlName = 'binaris.yml';

const init = async function init(functionName, functionPath) {
  if (functionName && functionPath) {
    const section = 'functions';
    log.debug('attempting to load template files for function dir creation');
    // parse our templated yml and make the necessary modifications
    const conf = yaml.safeLoad(fs.readFileSync(path.join(__dirname,
      templateDir, ymlName), 'utf8'));
    // replace the generic function name with the actual name
    conf[section][functionName] = conf[section][templateName];
    delete conf[section][templateName];
    const confString = yaml.dump(conf);
    const newDir = path.join(functionPath, functionName);
    // ensure that the function directory doesn't already exist

    try {
      fs.mkdirSync(newDir);
    } catch (err) {
      log.debug(err);
      throw new Error(`Function w/ name ${functionName} could not be initialized because a directory already exists with that name!`);
    }
    log.debug('loading and replicating all template files');
    // now we have to write out all our files that we've modified
    console.log(conf);
    const file = conf[section][functionName].file;
    fs.writeFileSync(path.join(newDir, file),
      fs.readFileSync(path.join(__dirname, templateDir, file)));
    fs.writeFileSync(path.join(newDir, ymlName), confString, 'utf8');
    return;
  }
  throw new Error('Invalid function path or function name provided!');
};

module.exports = init;
