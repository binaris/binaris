#!/usr/bin/env node

// here we just grab all our SDK functions that we plan to use
// invoke, destroy, help, info, login, logout, signup
const { init, deploy } = require('./sdk/sdk');

// create our basic logger
const logger = require('./sdk/shared/loggerInit.js');

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
  logger.binaris.info(`${cmdName} is not currently supported!`.red);
  process.exit(0);
};

// helper that allows us to a avoid a lot of redudant code
const resolvePath = async function resolvePath(somePath) {
  if (fs.existsSync(somePath)) {
    if (fs.lstatSync(somePath).isDirectory()) {
      try {
        const returnPath = path.resolve(somePath);
        return returnPath;
      } catch (error) {
        logger.binaris.error(`error when attempting to resolve path: ${somePath}`);
        process.exit(0);
      }
    } else {
      logger.binaris.error(`path: ${somePath} is not a directory!`);
      process.exit(0);
    }
  } else {
    logger.binaris.error(`path: ${somePath} is invalid!`.red);
    process.exit(0);
  }
  logger.binaris.error(`path: ${somePath} is invalid!`.red);
  process.exit(0);
};

// here we both ensure the name is valid syntatically and eventually
// we will also determine if it has been previously created
const validateFunctionName = async function validateFunctionName(name) {
  // eslint issue but too annoying to fix given time
  if (/[~`!#$%^&*+=\\[\]\\';,/{}|\\":<>?]/g.test(name)) {
    return false;
  }

  // need to add an SDK? call to ensure that the name is not only
  // syntatically valid but also unique
  return true;
};

const validateBinarisLogin = async function validateBinarisLogin() {
  logger.binaris.info('validating Binaris credentials'.yellow);
  return true;
};


// initializes a binaris function based on the options given by
// the user
// this essentially boils down to creating template files with
// the correct information in the correct location
const initHandler = async function initHandler(options) {
  logger.binaris.info('Initializing Binaris function...'.yellow);
  const initPayload = {
    functionName: undefined,
    functionPath: undefined,
  };
  if (options.functionName) {
    const answer = await validateFunctionName(options.functionName);
    if (answer) {
      initPayload.functionName = options.functionName;
    } else {
      logger.binaris.error(`${options.functionName} is not a valid function name`.red);
      process.exit(0);
    }
  } else {
    while (!initPayload.functionName) {
      const potentialName = moniker.choose();
      const answer = await validateFunctionName(potentialName);
      if (answer) {
        initPayload.functionName = potentialName;
      }
    }
  }
  if (options.path) {
    initPayload.functionPath = resolvePath(options.path);
  } else {
    initPayload.functionPath = process.cwd();
  }

  // now we actually call our initialize function and then immediately
  // determine if was successfully completed
  try {
    await init(initPayload);
    logger.binaris.info(`sucessfully initialized function ${initPayload.functionName}`.green);
    logger.binaris.info('function details:'.yellow);
    logger.binaris.info(JSON.stringify(initPayload, null, 2).yellow);
  } catch (err) {
    logger.binaris.error(err.message.red);
  }
};

// simply handles the process of deploying a function and its
// associated metadata to the Binaris cloud
const deployHandler = async function deployHandler(options) {
  logger.binaris.info('starting function deployment process'.yellow);
  if (validateBinarisLogin()) {
    const deployPayload = {
      functionPath: undefined,
    };
    if (options.path) {
      deployPayload.functionPath = await resolvePath(options.path);
    } else {
      deployPayload.functionPath = path.resolve(process.cwd());
    }
    try {
      const response = await deploy(deployPayload);
      logger.binaris.info('sucessfully deployed function'.green);
      logger.binaris.info(`response was, ${response}`.yellow);
    } catch (err) {
      logger.binaris.error(err.message.red);
    }
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
  .description('')
  .action();

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

