const deploy = require('./deploy');
const create = require('./create');
const invoke = require('./invoke');
const perf = require('./perf');
const logs = require('./logs');
const logger = require('./logger');
const remove = require('./remove');
const YMLUtil = require('./binarisYML');
const { updateAPIKey } = require('./userConf');
const { auth } = require('../sdk');
const { validateName } = require('./nameUtil');

// core modules
const fs = require('mz/fs');
const fse = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const PassThroughStream = require('stream').PassThrough;
const columnify = require('columnify');

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
  return async function wrapped(options) {
    try {
      // git style sub commands are strictly not supported
      // ie: bn create notacommand
      // TODO(Ry): disabled until figure out how to do this in a cleaner way
      // if (argData.args.length > 1) {
      //   throw new Error(`Argument "${argData.args[0]}"`,
      //   `is not a valid input to ${argData.rawArgs[2]}`);
      // }
      await funcToWrap(options);
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
  validateName(metaObj.name);
  metaObj.conf = YMLUtil.getFuncConf(binarisConf, metaObj.name);
  await YMLUtil.checkFuncConf(metaObj.conf, metaObj.path);
  metaObj.printPath = options.path ? ` -p ${metaObj.path}` : '';
  metaObj.printName = options.function ? ` ${metaObj.name}` : '';
  return metaObj;
};

/**
 * Create a Binaris function based on the options given by
 * the user. This boils down to creating template files with the
 * correct information in the correct location.
 *
 * @param {object} options - Command line options.
 */
const createHandler = async function createHandler(options) {
  // this is where the actual create function is called and immediately
  // evaluated to determine if was successfully completed
  const funcPath = path.resolve(options.path || process.cwd());
  await fse.mkdirp(funcPath);
  const funcName = await create(options.function, funcPath, options.runtime);
  const optPath = options.path ? ` -p ${funcPath}` : '';
  const optName = options.function ? ` ${funcName}` : '';
  logger.info(
`Created function ${funcName} in ${funcPath}
  (use "bn deploy${optPath}${optName}" to deploy the function)`);
};

/**
 * Deploys a previously created function to the Binaris cloud.
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
 * Run performance test on deployed function
 *
 * @param {object} options - Command line options.
 */
const perfHandler = async function perfHandler(options) {
  logger.info(`Running performance test on function ${options.function}.
Executing ${options.maxRequests} invocations with ${options.concurrency} "thread${options.concurrency > 1 ? 's' : ''}".
Stand by for results...
`);
  const report = await perf(options.function, options.maxRequests, options.concurrency);
  logger.info('Perf summary');
  logger.info('============');

  logger.info(columnify({
    'Total time': `${report.totalTimeSeconds.toFixed(1)} s`,
    Invocations: report.totalRequests,
    Errors: report.totalErrors,
    Rate: `${report.rps.toFixed(1)} rps`,
  }, { showHeaders: false }));

  logger.info(`
Latencies
=========`);

  logger.info(columnify({
    Mean: `${report.meanLatencyMs.toFixed(1)} ms`,
    Min: `${report.minLatencyMs.toFixed(1)} ms`,
    Max: `${report.maxLatencyMs.toFixed(1)} ms`,
    '50%': `${report.percentiles['50'].toFixed(1)} ms`,
    '90%': `${report.percentiles['90'].toFixed(1)} ms`,
    '95%': `${report.percentiles['95'].toFixed(1)} ms`,
    '99%': `${report.percentiles['99'].toFixed(1)} ms`,
  }, { showHeaders: false }));
};

/**
 * Retrieve logs from a deployed Binaris function.
 *
 * @param {object} options - Command line options.
 */
const logsHandler = async function logsHandler(options) {
  const meta = await gatherMeta(options);
  const logStream = new PassThroughStream({ objectMode: true });
  let lineAcc = [];
  logStream.on('data', (currLog) => {
    if (currLog.msg.endsWith('\n')) {
      logger.info(`[${currLog.time}] ${lineAcc.join('')}${currLog.msg.slice(0, -1)}`);
      lineAcc = [];
    } else {
      lineAcc.push(currLog.msg);
    }
  });
  await logs(meta.name, options.tail, options.since, logStream);
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
  (use "bn create" to create a template function in your current directory)`);
};

module.exports = {
  deployHandler: exceptionWrapper(deployHandler),
  createHandler: exceptionWrapper(createHandler),
  invokeHandler: exceptionWrapper(invokeHandler),
  perfHandler: exceptionWrapper(perfHandler),
  logsHandler: exceptionWrapper(logsHandler),
  loginHandler: exceptionWrapper(loginHandler),
  removeHandler: exceptionWrapper(removeHandler),
  unknownHandler: exceptionWrapper(() => {}),
};
