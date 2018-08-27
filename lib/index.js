const deploy = require('./deploy');
const create = require('./create');
const invoke = require('./invoke');
const list = require('./list');
const stats = require('./stats');
const logs = require('./logs');
const logger = require('./logger');
const perf = require('./perf');
const remove = require('./remove');
const YMLUtil = require('./binarisYML');
const { updateAPIKey } = require('./userConf');
const { auth } = require('../sdk');
const { validateName } = require('./nameUtil');
const sortBy = require('lodash.sortby');

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
      const advice = await funcToWrap(options);
      if (advice) {
        logger.warn(advice);
      }
      process.exit(0);
    } catch (err) {
      logger.error(err.message);
      process.exit(1);
    }
  };
};

/** Gather all of the relevant meta data about a function. */
const gatherMeta = async function gatherMeta(options, forcePath = true) {
  const metaObj = {
    path: path.resolve(options.path || process.cwd()),
  };

  metaObj.name = options.function;
  metaObj.printPath = '';
  if (forcePath) {
    const binarisConf = await YMLUtil.loadBinarisConf(metaObj.path);
    metaObj.name = metaObj.name || YMLUtil.getFuncName(await YMLUtil.loadBinarisConf(metaObj.path));
    validateName(metaObj.name);
    metaObj.conf = YMLUtil.getFuncConf(binarisConf, metaObj.name);
    await YMLUtil.checkFuncConf(metaObj.conf, metaObj.path);
    metaObj.printPath = options.path ? ` -p ${metaObj.path}` : '';
  }
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
  const { advice, body } = await deploy(meta.name, meta.path, meta.conf);
  logger.info(
`Deployed function to ${body}
  (use "bn invoke${meta.printPath}${meta.printName}" to invoke the function)`);
  return advice;
};

/**
 * Removes a previously deployed function from the Binaris cloud.
 *
 * @param {object} options - Command line options.
 */
const removeHandler = async function removeHandler(options) {
  const { advice } = await remove(options.function);
  logger.info(`Removed function ${options.function}`);
  return advice;
};

/**
 * Invokes a previously deployed Binaris function.
 *
 * @param {object} options - Command line options.
 */
const invokeHandler = async function invokeHandler(options) {
  if (options.data && options.json) {
    throw new Error('Invoke flags --json(-j) and --data(-d) are mutually exclusive');
  }

  let funcData;
  if (options.data) {
    funcData = options.data;
  } else if (options.json) {
    funcData = await fs.readFile(options.json, 'utf8');
  }

  const response = await invoke(options.function, funcData);
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
  const report = await perf(options.function, options.maxRequests,
    options.concurrency, options.data);
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
 * List Binaris functions of given account
 *
 * @param {object} options - Command line options.
 */
const listHandler = async function listHandler(options) {
  const listedFuncs = await list();
  if (options.json) {
    const rawData = Object.keys(listedFuncs).map(key => ({
      name: key,
      lastDeployed: `[${listedFuncs[key].tags.latest.modifiedAt}]`,
    }));
    logger.info(JSON.stringify(rawData));
  } else {
    const aggr = {};
    Object.keys(listedFuncs).forEach((key) => {
      aggr[key] = listedFuncs[key].tags.latest.modifiedAt;
    });
    if (Object.keys(aggr).length > 0) {
      logger.info(columnify(aggr, {
        columns: ['Function', 'Last Deployed'],
        config: { Function: { minWidth: 25 } },
      }));
    }
  }
};

/**
 * Retrieve logs from a deployed Binaris function.
 *
 * @param {object} options - Command line options.
 */
const logsHandler = async function logsHandler(options) {
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
  await logs(options.function, options.tail, options.since, logStream);
};

/**
 * Retrieve account usage stats
 *
 * @param {object} options - Command line options.
 */
const statsHandler = async function statsHandler(options) {
  const metrics = await stats(options.since, options.until);
  // eslint-disable-next-line no-param-reassign
  metrics.metrics.forEach((m) => { delete m.account; });
  const columns = ['function', 'metric', 'value', 'since', 'until'];
  metrics.metrics = sortBy(metrics.metrics, columns);
  if (options.json) {
    logger.info(JSON.stringify(metrics));
  } else if (metrics.metrics.length === 0) {
    logger.info('No matching usage stats found');
  } else {
    logger.info(columnify(metrics.metrics, {
      showHeaders: true,
      columns,
    }));
  }
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
    type: 'password',
    name: 'apiKey',
    message: 'API Key:',
  }]);
  if (!await auth.verifyAPIKey(answer.apiKey)) {
    throw new Error('Invalid API key');
  }
  await updateAPIKey(answer.apiKey);
  logger.info(
`Authentication Succeeded
  (use "bn create node8 hello" to create a Node.js template function in your CWD)`);
};

module.exports = {
  deployHandler: exceptionWrapper(deployHandler),
  createHandler: exceptionWrapper(createHandler),
  invokeHandler: exceptionWrapper(invokeHandler),
  listHandler: exceptionWrapper(listHandler),
  logsHandler: exceptionWrapper(logsHandler),
  loginHandler: exceptionWrapper(loginHandler),
  perfHandler: exceptionWrapper(perfHandler),
  removeHandler: exceptionWrapper(removeHandler),
  statsHandler: exceptionWrapper(statsHandler),
  unknownHandler: exceptionWrapper(() => {}),
};
