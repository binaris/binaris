const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const logger = require('../shared/loggerInit.js');

const templateDir = './serviceTemplates/nodejs/';


const init = async function (data) {
  const completionObj = {
    success: false,
  };

  if (data.serviceName && data.servicePath) {
    try {
      // parse our templated yml and make the necessary modifications
      const vanillaConfig = yaml.safeLoad(fs.readFileSync(path.join(__dirname,
        templateDir, 'binaris.yml'), 'utf8'));
      // replace the generic service name with the actual name
      vanillaConfig.service = data.serviceName;
      const serviceConfig = yaml.dump(vanillaConfig);
      const newDir = path.join(data.servicePath, data.serviceName);
      // ensure that the service directory doesn't already exist
      if (fs.existsSync(newDir)) {
        completionObj.error = `service w/ name ${data.serviceName} could not be initialized because a directory already exists with that name!`;
        return completionObj;
      }

      // here we are just loading our JSON and giving it the correct service name
      const packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, templateDir, 'package.json'), 'utf8'));
      packageJSON.name = data.serviceName;

      // now we have to write out all our files that we've modified
      fs.mkdirSync(newDir);
      fs.writeFileSync(path.join(newDir, 'handler.js'),
        fs.readFileSync(path.join(__dirname, templateDir, 'handler.js')));
      fs.writeFileSync(path.join(newDir, 'package.json'),
        JSON.stringify(packageJSON, null, 2), 'utf8');
      fs.writeFileSync(path.join(newDir, 'binaris.yml'), serviceConfig, 'utf8');
      completionObj.success = true;
      return completionObj;
    } catch (err) {
      completionObj.error = err;
      return completionObj;
    }
  }

  completionObj.error = 'invalid service path or service name provided!';
  return completionObj;
};

module.exports = init;
