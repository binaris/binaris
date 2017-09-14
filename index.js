#!/usr/bin/env node

// here we just grab all our SDK functions that we plan to use
const { init, deploy, invoke, destroy, help,
  info, login, logout, signup } = require('./sdk/sdk');

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
  console.log(`${cmdName} is not currently supported!`.red);
  process.exit(0);
};

// here we both ensure the name is valid syntatically and eventually
// we will also determine if it has been previously created
const validateServiceName = async function validateServiceName(name) {
  const response = {
    valid: false,
  };

  // eslint issue but too annoying to fix given time
  if (/[~`!#$%\^&*+=\\[\]\\';,/{}|\\":<>\?]/g.test(name)) {
    response.error = `${name} is an invalid service name`;
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
  .description('creates the skeleton of a binaris service')
  .option('-s, --service [serviceName]', 'The name of the service you are creating')
  .option('-p, --path [path]', 'The path to create your service(default is pwd)')
  .action(async (options) => {
    console.log('beginning Binaris service initialization...'.yellow);
    const initPayload = {
      serviceName: undefined,
      servicePath: undefined,
    };
    console.log('validating service name...'.yellow);
    // remove me
    await asyncTimeout(defaultSleep);
    if (options.service) {
      const answer = await validateServiceName(options.service);
      if (answer.valid) {
        initPayload.serviceName = options.service;
      } else {
        console.error(answer.error.red);
        process.exit(0);
      }
    } else {
      while (!initPayload.serviceName) {
        const potentialName = moniker.choose();
        const answer = await validateServiceName(potentialName);
        if (answer.valid) {
          initPayload.serviceName = potentialName;
        }
      }
    }
    console.log('service name is valid!'.green);
    console.log('validating service path...'.yellow);
    // remove me
    await asyncTimeout(defaultSleep);
    if (options.path) {
      if (fs.existsSync(options.path)) {
        if (fs.lstatSync(options.path).isDirectory()) {
          initPayload.servicePath = path.resolve(options.path);
        } else {
          console.error(`path: ${options.path} is not a directory!`);
          process.exit(0);
        }
      } else {
        console.error(`path: ${options.path} is invalid!`.red);
        process.exit(0);
      }
    } else {
      initPayload.servicePath = process.cwd();
    }
    console.log('service path is valid!'.green);

    // now we actually call our initialize function and then immediately
    // determine if was successfully completed
    console.log('attempting to initialize...'.yellow);
    // remove me
    await asyncTimeout(defaultSleep);
    const initCompletion = await init(initPayload);
    if (initCompletion.success) {
      console.log(`sucessfully initialized service ${initPayload.serviceName}`.green);
      console.log('service details:'.yellow);
      console.log(JSON.stringify(initPayload, null, 2).yellow);
    } else {
      console.error(initCompletion.error.red);
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

