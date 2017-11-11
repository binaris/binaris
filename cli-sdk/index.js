const deploy = require('./deploy');
const init = require('./init');
const invoke = require('./invoke');
const log = require('./logger');
const remove = require('./remove');
const YMLUtil = require('./binarisYML');
const { updateAPIKey } = require('./userConf');

// core modules
const fs = require('mz/fs');
const fse = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

/**
 * Wrapper which centralizes the error handling/processing
 * needed for the CLI. The two main purposes of this wrapper are...
 *
 * - formats and standardizes all errors which are thrown
 *   from the CLI/SDK
 * - validates the incoming input(CLI input) and
 *   enforce rules(such as no sub-commands)
 *
 * @returns - error code of the command
 */
const exceptionWrapper = function tryCatchWrapper(funcToWrap) {
  const wrapped = async function wrapped(options) {
    try {
      // We error in the case of extra unwanted sub-args being appended
      // to a valid command. `options.args` contains commands provided
      // to commander, by checking if there is more than 1 we will know
      // if there were extra commands added.
      //
      // example of bad command: `bn init another command`
      if (options.args.length > 1) {
        log.error(`Argument ${options.args[0]} is not a valid input to ${options.rawArgs[2]}`);
        return 1;
      }
      await funcToWrap(options);
      return 0;
    } catch (err) {
      if (err.code === 'EACCES') {
        log.error(`Permission denied writing to path: ${err.path}`);
      } else {
        log.error(err.message);
      }
      return 1;
    }
  };
  return wrapped;
};

/** Gather all of the relevant meta data about a function. */
const gatherMeta = async function gatherMeta(options) {
  const metaObj = {
    path: path.resolve(options.path || process.cwd()),
  };

  let innerError;
  try {
    if (!((await fs.lstat(metaObj.path)).isDirectory())) {
      innerError = new Error(`No such directory: '${metaObj.path}'`);
    }
  } catch (err) {
    innerError = new Error(`No such path: '${metaObj.path}'`);
  }
  if (innerError) {
    throw innerError;
  }

  const binarisConf = await YMLUtil.loadBinarisConf(metaObj.path);
  metaObj.name = options.function
    || YMLUtil.getFuncName(await YMLUtil.loadBinarisConf(metaObj.path));
  metaObj.conf = YMLUtil.getFuncConf(binarisConf, metaObj.name);
  await YMLUtil.checkFuncConf(metaObj.conf, metaObj.path);
  metaObj.printPath = options.path ? ` -p ${metaObj.path}` : '';
  metaObj.printName = options.function ? ` -f ${metaObj.name}` : '';
  return metaObj;
};

/**
 * Initializes a Binaris function based on the options given by
 * the user. This boils down to creating template files with the
 * correct information in the correct location.
 *
 * @param {object} options - Command line options.
 */
const initHandler = async function initHandler(options) {
  // this is where the actual initialize function is called and immediately
  // evaluated to determine if was successfully completed
  const funcPath = path.resolve(options.path || process.cwd());
  await fse.mkdirp(funcPath);
  const funcName = await init(options.function, funcPath);
  const optPath = options.path ? ` -p ${funcPath}` : '';
  const optName = options.function ? ` -f ${funcName}` : '';
  log.info(
`Initialized function ${funcName} in ${funcPath}
  (use "bn deploy${optPath}${optName}" to deploy the function)`);
};

/**
 * Deploys a previously initialized function to the Binaris cloud.
 *
 * @param {object} options - Command line options.
 */
const deployHandler = async function deployHandler(options) {
  const meta = await gatherMeta(options);
  const endpoint = await deploy(meta.name, meta.path, meta.conf);
  log.info(
`Deployed function to ${endpoint}
  (use "bn invoke${meta.printPath}${meta.printName}" to invoke the function)`);
};

/**
 * Removes a previously deployed function from the Binaris cloud.
 *
 * @param {object} options - Command line options.
 */
const removeHandler = async function removeHandler(options) {
  const meta = await gatherMeta(options);
  await remove(meta.name, meta.path);
  log.info(
`Removed function ${meta.name}
  (use "bn deploy${meta.printPath}${meta.printName}" to re-deploy the function)`);
};

/**
 * Invokes a previously deployed Binaris function.
 *
 * @param {object} options - Command line options.
 */
const invokeHandler = async function invokeHandler(options) {
  const meta = await gatherMeta(options);
  if (options.data && options.json) {
    throw new Error('Invoke flags --json(-j) and --data(-d) are mutually exclusive');
  }

  let funcData;
  if (options.data) {
    funcData = options.data;
  } else if (options.json) {
    try {
      funcData = await fs.readFile(options.json, 'utf8');
    } catch (err) {
      throw new Error(`${options.json} is not a valid path to a JSON file`);
    }
  }

  const response = await invoke(meta.name, meta.path, funcData);
  log.info(response.body);
};


/**
 * Authenticate the user by saving the provided Binaris
 * api key in a well known .binaris directory.
 */
const loginHandler = async function loginHandler() {
  log.info(
`Please enter your Binaris API key to deploy and invoke functions.
If you don't have a key, head over to https://binaris.com to request one`);

  // this temporarily handles the errors/dialog until
  // debugging help message from general commands is removed
  try {
    const answer = await inquirer.prompt([{
      type: 'input',
      name: 'apiKey',
      message: 'API Key:',
    }]);
    await updateAPIKey(answer.apiKey);
    log.info(
`Authentication Succeeded
  (use "bn init" to initialize a template function in your current directory)`);
  } catch (err) {
    log.error(err.message);
    return 1;
  }
  return 0;
};

/**
 * Handles the case of an unknown argument.
 *
 * @param {string} env - The unknown argument.
 */
const unknownHandler = async function unknownHandler(env) {
  log.error(`Unknown command: '${env}'. See 'bn --help'`);
  return 1;
};

module.exports = {
  deployHandler: exceptionWrapper(deployHandler),
  initHandler: exceptionWrapper(initHandler),
  invokeHandler: exceptionWrapper(invokeHandler),
  loginHandler,
  removeHandler: exceptionWrapper(removeHandler),
  unknownHandler,
};
