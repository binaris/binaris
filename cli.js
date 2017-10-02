// here we just grab all our SDK functions that we plan to use
// invoke, destroy, help, info, login, logout, signup
const { init, invoke, deploy } = require('./cli-sdk');

// create our basic logger
const log = require('./logger');

// our core modules
const fs = require('fs');
const path = require('path');

// our 3rd party modules
const commander = require('commander');
const colors = require('colors');

// Things to do
// create binaris dependent directories
// create temp files
// helper to quickly notify the user that a function is unsupported
const noSupport = function notSupported(cmdName) {
  log.info(`${cmdName} is not currently supported!`.red);
  process.exit(1);
};

// attempts to parse a json and throws if an issue is encountered
const attemptJSONParse = function attemptJSONParse(rawJSON) {
  try {
    const parsedJSON = JSON.parse(rawJSON);
    if (parsedJSON && typeof parsedJSON === 'object') {
      return parsedJSON;
    }
  } catch (err) {
    log.debug(err);
  }
  throw new Error('Invalid JSON received, unable to parse');
};

function getFuncPath(options) {
  if (options.path) {
    return path.resolve(options.path);
  }
  return path.resolve(process.cwd());
}

// initializes a binaris function based on the options given by
// the user
// this essentially boils down to creating template files with
// the correct information in the correct location
const initHandler = async function initHandler(options) {
  // now we actually call our initialize function and then immediately
  // determine if was successfully completed
  const functionPath = getFuncPath(options);
  try {
    const finalName = await init(options.functionName, functionPath);
    log.info(`Successfully initialized function ${finalName}`.green);
    log.info('You can deploy your function with'.green);
    log.info(`cd ${finalName}`.magenta);
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
  try {
    const funcPath = getFuncPath(options);
    await deploy(funcPath);
    log.info('Sucessfully deployed function'.green);
  } catch (err) {
    log.error(err.message.red);
    process.exit(1);
  }
};

// invokes a binaris function that you have previously
// deployed either through the CLI or other means
const invokeHandler = async function invokeHandler(options) {
  log.info('Attempting to invoke your function'.yellow);
  if (options.file && options.json) {
    log.error('You may not provide both a json(-j) and file(-f)'.red);
    process.exit(1);
  }
  const funcPath = getFuncPath(options);
  let funcData;
  try {
    let payloadJSON;
    if (options.json) {
      payloadJSON = options.json;
    } else if (options.file) {
      try {
        payloadJSON = fs.readFileSync(options.file, 'utf8');
      } catch (err) {
        throw new Error(`${options.file} was not a valid path to a JSON file`);
      }
    }

    if (payloadJSON) {
      funcData = attemptJSONParse(payloadJSON);
      log.debug({ funcData });
    }

    const response = await invoke(funcPath, funcData);
    log.info('Successfully invoked function'.green);
    log.info('Response was:'.yellow, JSON.stringify(response, null, 2));
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

