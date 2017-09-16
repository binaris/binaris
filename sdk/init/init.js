const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const logger = require('../shared/loggerInit.js');

const templateDir = './functionTemplates/nodejs/';


const init = async function init(data) {
  if (data.functionName && data.functionPath) {
    try {
      // parse our templated yml and make the necessary modifications
      const vanillaConfig = yaml.safeLoad(fs.readFileSync(path.join(__dirname,
        templateDir, 'binaris.yml'), 'utf8'));
      // replace the generic function name with the actual name
      vanillaConfig.functionName = data.functionName;
      const functionConfig = yaml.dump(vanillaConfig);
      const newDir = path.join(data.functionPath, data.functionName);
      // ensure that the function directory doesn't already exist
      if (fs.existsSync(newDir)) {
        throw new Error(`function w/ name ${data.functionName} could not be initialized because a directory already exists with that name!`);
      }
      // here we are just loading our JSON and giving it the correct function name
      const packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, templateDir, 'package.json'), 'utf8'));
      packageJSON.name = data.functionName;

      // now we have to write out all our files that we've modified
      fs.mkdirSync(newDir);
      fs.writeFileSync(path.join(newDir, 'handler.js'),
        fs.readFileSync(path.join(__dirname, templateDir, 'handler.js')));
      fs.writeFileSync(path.join(newDir, 'package.json'),
        JSON.stringify(packageJSON, null, 2), 'utf8');
      fs.writeFileSync(path.join(newDir, 'binaris.yml'), functionConfig, 'utf8');
      return;
    } catch (err) {
      throw err;
    }
  }
  throw new Error('invalid function path or function name provided!');
};

module.exports = init;
