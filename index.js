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

// helper that allows us to a avoid a lot of redudant code
// probably want to switch this over to throw an error instead
// of doing 0x80 itself
const resolvePath = async function resolvePath(somePath) {
  if (fs.existsSync(somePath)) {
    if (fs.lstatSync(somePath).isDirectory()) {
      try {
        const returnPath = path.resolve(somePath);
        return returnPath;
      } catch (error) {
        log.error(`Error when attempting to resolve path: ${somePath}`);
        process.exit(1);
      }
    } else {
      log.error(`The path: ${somePath} is not a directory!`);
      process.exit(1);
    }
  } else {
    log.error(`The path: ${somePath} is invalid!`.red);
    process.exit(1);
  }
  log.error(`The path: ${somePath} is invalid!`.red);
  process.exit(1);
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
  log.info('Validating Binaris credentials'.yellow);
  return true;
};


// initializes a binaris function based on the options given by
// the user
// this essentially boils down to creating template files with
// the correct information in the correct location
const initHandler = async function initHandler(options) {
  log.info('Initializing Binaris function...'.yellow);
  const initPayload = {
    functionName: undefined,
    functionPath: undefined,
  };
  if (options.functionName) {
    const answer = await validateFunctionName(options.functionName);
    if (answer) {
      initPayload.functionName = options.functionName;
    } else {
      log.error(`${options.functionName} is not a valid function name`.red);
      process.exit(1);
    }
  } else {
    while (!initPayload.functionName) {
      // until the system supports dashes in names
      const potentialName = moniker.choose().replace(/-/g, '');
      const answer = await validateFunctionName(potentialName);
      if (answer) {
        initPayload.functionName = potentialName;
      }
    }
  }
  if (options.path) {
    initPayload.functionPath = await resolvePath(options.path);
  } else {
    initPayload.functionPath = process.cwd();
  }

  // now we actually call our initialize function and then immediately
  // determine if was successfully completed
  try {
    await init(initPayload);
    log.info(`Successfully initialized function ${initPayload.functionName}`.green);
    log.info('=================================================='.yellow);
    log.info('Function details:'.yellow);
    log.info(JSON.stringify(initPayload, null, 2).yellow);
    log.info('=================================================='.yellow);
    log.info('If you wish to deploy your function...'.magenta);
    log.info('cd <insert function name here>'.magenta);
    log.info('bn deploy'.magenta);
  } catch (err) {
    log.error(err.message.red);
  }
};

// simply handles the process of deploying a function and its
// associated metadata to the Binaris cloud
const deployHandler = async function deployHandler(options) {
  log.info('Starting function deployment process'.yellow);
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
      log.info('Sucessfully deployed function'.green);
      log.info('Response was'.yellow, response);
    } catch (err) {
      log.error(err.message.red);
    }
  }
};

// invokes a binaris function that you have previously
// deployed either through the CLI or other means
const invokeHandler = async function invokeHandler(options) {
  log.info('Attempting to invoke your function'.yellow);
  const invokePayload = {};
  if (options.path) {
    await resolvePath(options.path);
    invokePayload.functionPath = options.path;
  } else {
    invokePayload.functionPath = process.cwd();
  }

  if (options.file && options.json) {
    log.error('You may not provide both a json(-j) and file(-f)'.red);
    process.exit(1);
  }

  try {
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
      invokePayload.functionData = await util.attemptJSONParse(payloadJSON);
      log.debug({ functionData: invokePayload.functionData });
    }
    const response = await invoke(invokePayload);
    log.info('Successfully invoked function'.green);
    log.info('Response was'.yellow, response);
  } catch (err) {
    log.error(err.message.red);
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

