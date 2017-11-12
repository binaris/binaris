const deploy = require('./deploy');
const init = require('./init');
const invoke = require('./invoke');
const log = require('./log');
const logger = require('./logger');
const remove = require('./remove');
const YMLUtil = require('./binarisYML');
const { updateAPIKey } = require('./userConf');
const { auth } = require('../sdk');

// core modules
const fs = require('mz/fs');
const fse = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const PassThroughStream = require('stream').PassThrough;

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
  // eslint-disable-next-line consistent-return
  return async function wrapped(argData) {
    try {
      if (argData.name === '*') {
        throw new Error(`Unknown command: '${argData.args[0]}'. See 'bn --help'`);
      }
      // git style sub commands are strictly not supported
      // ie: bn init notacommand
      if (argData.args.length > 1) {
        throw new Error(`Argument ${argData.args[0]} is not a valid input to ${argData.rawArgs[2]}`);
      }
      await funcToWrap(argData.options);
      process.exit(0);
    } catch (err) {
      logger.error(err.message);
      process.exit(1);
    }
  };
};

/** Gather all of the relevant meta data about a function. */
const gatherMeta = async function gatherMeta(options) {
  const metaObj = {
    path: path.resolve(options.path || process.cwd()),
  };

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
  logger.info(
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
  logger.info(
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
  logger.info(
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
    funcData = await fs.readFile(options.json, 'utf8');
  }

  const response = await invoke(meta.name, meta.path, funcData);
  logger.info(response.body);
};

/**
 * Retrieve logs from a deployed Binaris function.
 *
 * @param {object} options - Command line options.
 */
const logHandler = async function logHandler(options) {
  const meta = await gatherMeta(options);
  const logStream = new PassThroughStream({ objectMode: true });
  logStream.on('data', (currLog) => {
    logger.info(`[${currLog.timestamp}]: ${currLog.message}`);
  });
  await log(meta.name, options.tail, logStream);
};


/**
 * Authenticate the user by saving the provided Binaris
 * api key in a well known .binaris directory.
 */
const loginHandler = async function loginHandler() {
  logger.info(
`Please enter your Binaris API key to deploy and invoke functions.
If you don't have a key, head over to https://binaris.com to request one`);
  const answer = await inquirer.prompt([{
    type: 'input',
    name: 'apiKey',
    message: 'API Key:',
  }]);
  if (!await auth.verifyAPIKey(answer.apiKey)) {
    throw new Error('Invalid API key');
  }
  await updateAPIKey(answer.apiKey);
  logger.info(
`Authentication Succeeded
  (use "bn init" to initialize a template function in your current directory)`);
};

module.exports = {
  deployHandler: exceptionWrapper(deployHandler),
  initHandler: exceptionWrapper(initHandler),
  invokeHandler: exceptionWrapper(invokeHandler),
  logHandler: exceptionWrapper(logHandler),
  loginHandler: exceptionWrapper(loginHandler),
  removeHandler: exceptionWrapper(removeHandler),
  unknownHandler: exceptionWrapper(() => {}),
};
