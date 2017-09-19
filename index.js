#!/usr/bin/env node

// here we just grab all our SDK functions that we plan to use
// invoke, destroy, help, info, login, logout, signup
const { init, invoke, deploy } = require('./sdk/sdk');

// create our basic logger
const log = require('./sdk/shared/logger');
const util = require('./sdk/shared/util');

// our core modules
const fs = require('fs');
const path = require('path');

// our 3rd party modules
const commander = require('commander');
const colors = require('colors');
const moniker = require('moniker');

// Things to do
// create binaris dependent directories
// create temp files
// helper to quickly notify the user that a function is unsupported
const noSupport = function notSupported(cmdName) {
  log.info(`${cmdName} is not currently supported!`.red);
  process.exit(1);
};

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

const validateBinarisLogin = function validateBinarisLogin() {
  log.info('Validating Binaris credentials'.yellow);
  return true;
};

// initializes a binaris function based on the options given by
// the user
// this essentially boils down to creating template files with
// the correct information in the correct location
const initHandler = async function initHandler(options) {
  log.info('Initializing Binaris function'.yellow);
  let functionName;
  let functionPath;
  if (options.functionName) {
    const answer = validateFunctionName(options.functionName);
    if (answer) {
      functionName = options.functionName;
    } else {
      log.error(`${options.functionName} is not a valid function name`.red);
      process.exit(1);
    }
  } else {
    while (!functionName) {
      // until the system supports dashes in names
      const potentialName = moniker.choose().replace(/-/g, '');
      const answer = validateFunctionName(potentialName);
      if (answer) {
        functionName = potentialName;
      }
    }
  }

  // now we actually call our initialize function and then immediately
  // determine if was successfully completed
  try {
    if (options.path) {
      functionPath = path.resolve(options.path);
    } else {
      functionPath = process.cwd();
    }
    await init(functionName, functionPath);
    log.info(`Successfully initialized function ${functionName}`.green);
    log.info('You can deploy your function with'.green);
    log.info(`cd ${functionName}`.magenta);
    log.info('bn deploy'.magenta);
  } catch (err) {
    log.error(err.message.red);
    process.exit(1);
  }
};

// simply handles the process of deploying a function and its
// associated metadata to the Binaris cloud
const deployHandler = async function deployHandler(options) {
  log.info('Starting function deployment process'.yellow);
  if (validateBinarisLogin()) {
    let deployPath;
    try {
      if (options.path) {
        deployPath = path.resolve(options.path);
      } else {
        // is this necessary?
        deployPath = path.resolve(process.cwd());
      }
      await deploy(deployPath);
      log.info('Sucessfully deployed function'.green);
    } catch (err) {
      log.error(err.message.red);
      process.exit(1);
    }
  }
};

// invokes a binaris function that you have previously
// deployed either through the CLI or other means
const invokeHandler = async function invokeHandler(options) {
  log.info('Attempting to invoke your function'.yellow);
  const invokePayload = {};
  if (options.file && options.json) {
    log.error('You may not provide both a json(-j) and file(-f)'.red);
    process.exit(1);
  }
  try {
    if (options.path) {
      invokePayload.functionPath = options.path;
    } else {
      invokePayload.functionPath = process.cwd();
    }
    let payloadJSON;
    if (options.json) {
      payloadJSON = options.json;
    } else if (options.file) {
      if (fs.existsSync(options.file)) {
        payloadJSON = fs.readFileSync(options.file, 'utf8');
      } else {
        throw new Error(`${options.file} was not a valid path to a JSON file`);
      }
    }

    if (payloadJSON) {
      invokePayload.functionData = util.attemptJSONParse(payloadJSON);
      log.debug({ functionData: invokePayload.functionData });
    }
    const response = await invoke(invokePayload);
    log.info('Successfully invoked function'.green);
    let message;
    try {
      message = JSON.parse(response).message;
    } catch (err) {
      log.debug(err);
      message = response;
    }

    log.info('Response was \''.yellow, message, "'".yellow);
  } catch (err) {
    log.error(err.message.red);
    process.exit(1);
  }
};

commander
  .version('0.0.1')
  .description('Binaris command line interface');

commander
  .command('init')
  .description('creates the skeleton of a Binaris function')
  .option('-f, --functionName [functionName]', 'The name of the function you are creating')
  .option('-p, --path [path]', 'The path to create your function(default is pwd)')
  .action(initHandler);

commander
  .command('deploy')
  .description('deploys your function to the Binaris cloud')
  .option('-p, --path [path]', 'The path to the binaris function you wish to deploy')
  .action(deployHandler);

commander
  .command('invoke')
  .description('invokes a previously deployed binaris function')
  .option('-p, --path [path]', 'The path to the binaris function you wish to invoke')
  .option('-j, --json [json]', 'The json data you would like to include in the invocation')
  .option('-f, --file [file]', 'The path to your JSON file containing the message to send in your invocation')
  .action(invokeHandler);

commander
  .command('destroy')
  .description('')
  .action(() => { noSupport('destroy'); });

commander
  .command('help')
  .description('')
  .action(() => { noSupport('help'); });

commander
  .command('info')
  .description('')
  .action(() => { noSupport('info'); });

commander
  .command('login')
  .description('')
  .action(() => { noSupport('login'); });

commander
  .command('logout')
  .description('')
  .action(() => { noSupport('logout'); });

commander
  .command('signup')
  .description('')
  .action(() => { noSupport('signup'); });

commander
  .command('feedback')
  .description('')
  .action(() => { noSupport('feedback'); });

commander
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp(colors.red);
}

