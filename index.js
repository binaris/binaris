#!/usr/bin/env node

// here we just grab all our SDK functions that we plan to use
const { init, deploy, invoke, destroy, help,
  info, login, logout, signup } = require('./sdk/sdk');

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
// create flux dependent directories
// create temp files

// helper to quickly notify the user that a function is unsupported
const noSupport = function notSupported(cmdName) {
  logger.binaris.info(`${cmdName} is not currently supported!`.red);
  process.exit(0);
};

// here we both ensure the name is valid syntatically and eventually
// we will also determine if it has been previously created
const validateFunctionName = async function validateFunctionName(name) {
  const response = {
    valid: false,
  };

  // eslint issue but too annoying to fix given time
  if (/[~`!#$%\^&*+=\\[\]\\';,/{}|\\":<>\?]/g.test(name)) {
    response.error = `${name} is an invalid function name`;
    return response;
  }

  // need to add an SDK? call to ensure that the name is not only
  // syntatically valid but also unique
  response.valid = true;
  return response;
};


// ignore this, its just temporary to simulate a more 'real' experience
const defaultSleep = 500;
const asyncTimeout = function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

commander
  .version('0.0.1')
  .description('Binaris command line interface');

commander
  .command('init')
  .description('creates the skeleton of a binaris function')
  .option('-f, --functionName [functionName]', 'The name of the function you are creating')
  .option('-p, --path [path]', 'The path to create your function(default is pwd)')
  .action(async (options) => {
    logger.binaris.info('beginning Binaris function initialization...'.yellow);
    const initPayload = {
      functionName: undefined,
      functionPath: undefined,
    };
    logger.binaris.info('validating function name...'.yellow);
    // remove me
    await asyncTimeout(defaultSleep);
    if (options.functionName) {
      const answer = await validateFunctionName(options.functionName);
      if (answer.valid) {
        initPayload.functionName = options.functionName;
      } else {
        logger.binaris.error(answer.error.red);
        process.exit(0);
      }
    } else {
      while (!initPayload.functionName) {
        const potentialName = moniker.choose();
        const answer = await validateFunctionName(potentialName);
        if (answer.valid) {
          initPayload.functionName = potentialName;
        }
      }
    }
    logger.binaris.info('function name is valid!'.green);
    logger.binaris.info('validating function path...'.yellow);
    // remove me
    await asyncTimeout(defaultSleep);
    if (options.path) {
      if (fs.existsSync(options.path)) {
        if (fs.lstatSync(options.path).isDirectory()) {
          initPayload.functionPath = path.resolve(options.path);
        } else {
          logger.binaris.error(`path: ${options.path} is not a directory!`);
          process.exit(0);
        }
      } else {
        logger.binaris.error(`path: ${options.path} is invalid!`.red);
        process.exit(0);
      }
    } else {
      initPayload.functionPath = process.cwd();
    }
    logger.binaris.info('function path is valid!'.green);

    // now we actually call our initialize function and then immediately
    // determine if was successfully completed
    logger.binaris.info('attempting to initialize...'.yellow);
    // remove me
    await asyncTimeout(defaultSleep);
    const initCompletion = await init(initPayload);
    if (initCompletion.success) {
      logger.binaris.info(`sucessfully initialized function ${initPayload.functionName}`.green);
      logger.binaris.info('function details:'.yellow);
      logger.binaris.info(JSON.stringify(initPayload, null, 2).yellow);
    } else {
      logger.binaris.error(initCompletion.error.red);
    }
  });

commander
  .command('deploy')
    .description('')
      .action();

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

