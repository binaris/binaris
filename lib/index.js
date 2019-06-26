'use strict';

const { inspect } = require('util');
const deploy = require('./deploy');
const { create, experimentalRuntimes } = require('./create');
const feedback = require('./feedback');
const invoke = require('./invoke');
const list = require('./list');
const stats = require('./stats');
const logs = require('./logs');
const logger = require('./logger');
const perf = require('./perf');
const remove = require('./remove');
const YMLUtil = require('./binarisYML');
const {
  getAllConf,
  getAccountId,
  updateAccountId,
  updateAPIKey,
  updateRealm,
  validateHeaderValue,
} = require('./userConf');
const { auth, forceRealm } = require('../sdk');
const { validateName } = require('./nameUtil');
const sortBy = require('lodash.sortby');
const map = require('lodash.map');

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
  const config = { ...options.config };
  if (options.executionModel) {
    config.executionModel = options.executionModel;
  }
  const funcPath = path.resolve(options.path || process.cwd());
  await fse.mkdirp(funcPath);
  const funcName = await create(options.function, funcPath,
    options.runtime, config);
  const optPath = options.path ? ` -p ${funcPath}` : '';
  const optName = options.function ? ` ${funcName}` : '';
  logger.info(`Created function ${funcName} in ${funcPath}`);
  if (config) {
    logger.verbose(`with ${inspect(config)}`);
  }
  logger.info(`  (use "bn deploy${optPath}${optName}" to deploy the function)`);
  if (experimentalRuntimes.includes(options.runtime)) {
    logger.warn(`${options.runtime} support is experimental`);
  }
};

/**
 * Deploys a previously created function to the Binaris cloud.
 *
 * @param {object} options - Command line options.
 */
const deployHandler = async function deployHandler(options) {
  const meta = await gatherMeta(options);
  const accountId = await getAccountId();
  const endpoint = await deploy(meta.name, meta.path, meta.conf);

  const apiHeader = '-H X-Binaris-Api-Key:$(bn show apiKey) ';
  const printHeader = accountId !== undefined && !meta.name.startsWith('public_');

  logger.info(
`Deployed function ${meta.name}
Invoke with one of:
  "bn invoke${meta.printPath}${meta.printName}"
  "curl ${printHeader ? apiHeader : ''}${endpoint}"`);
};

/**
 * Removes a previously deployed function from the Binaris cloud.
 *
 * @param {object} options - Command line options.
 */
const removeHandler = async function removeHandler(options) {
  await remove(options.function);
  logger.info(`Removed function ${options.function}`);
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
const perfHandler = async function perfHandler({
  maxSeconds,
  maxRequests,
  concurrency,
  data,
  function: functionName,
  }) {
  const maybeS = n => (n > 1 ? 's' : '');
  const upToString = maxSeconds ? ` up to ${maxSeconds} second${maybeS(maxSeconds)}` : '';
  logger.info(`Running performance test on function ${functionName}.
Executing ${maxRequests} invocations with ${concurrency} "thread${maybeS(concurrency)}"${upToString}.
Stand by for results...
`);
  const report = await perf(functionName, maxRequests, concurrency, data, maxSeconds);
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
  const rawData = map(listedFuncs, ({ tags }, key) => ({
    name: key,
    lastDeployed: tags.latest.modifiedAt,
    expiration: tags.latest.expiration,
  }));
  if (options.json) {
    logger.info(JSON.stringify(rawData));
  } else if (rawData.length > 0) {
    logger.info(columnify(rawData, {
      columns: ['name', 'lastDeployed', 'expiration'],
      config: {
        name: {
          headingTransform: () => 'FUNCTION',
          minWidth: 25,
        },
        lastDeployed: {
          headingTransform: () => 'LAST DEPLOYED',
        },
      },
    }));
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
 * Show information about configured account.
 */
const showHandler = async function showHandler({ config, all }) {
  const conf = await getAllConf();
  if (all) {
    Object.keys(conf).forEach((confKey) => {
      logger.info(`${confKey}: ${conf[confKey]}`);
    });
  } else {
    logger.info(conf[config]);
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
  const { rawApiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'rawApiKey',
      message: 'API Key:',
    },
  ]);

  validateHeaderValue(rawApiKey, 'API key');

  const apiKeyIdx = rawApiKey.lastIndexOf('-');
  const apiKey = rawApiKey.substr(apiKeyIdx + 1);
  const realm = rawApiKey.substr(0, apiKeyIdx);

  if (realm) {
    forceRealm(realm);
  }
  const { accountId, error } = await auth.verifyAPIKey(apiKey);
  // (Don't validate accountId, it comes from Binaris so not a
  // keyboard entry issue.)
  if (error) {
    throw error;
  }

  await updateAccountId(accountId);
  await updateAPIKey(apiKey);
  await updateRealm(realm);

  logger.info(
`Authentication Succeeded
  (use "bn create node8 hello" to create a Node.js template function in your CWD)`);
};

/**
 * Allow feedback by user of a given account.
 *
 * @param {object} options - Command line options.
 */
const feedbackHandler = async function feedbackHandler(options) {
  if (!options.email || options.email.length === 0) {
    throw new Error('Not a valid email.');
  }
  if (!options.message || options.message.length === 0) {
    throw new Error('Not a valid message.');
  }
  const funcData = { email: options.email, message: options.message };
  await feedback(funcData);
  logger.info('Thank you!');
};

module.exports = {
  deployHandler: exceptionWrapper(deployHandler),
  createHandler: exceptionWrapper(createHandler),
  feedbackHandler: exceptionWrapper(feedbackHandler),
  invokeHandler: exceptionWrapper(invokeHandler),
  listHandler: exceptionWrapper(listHandler),
  logsHandler: exceptionWrapper(logsHandler),
  loginHandler: exceptionWrapper(loginHandler),
  perfHandler: exceptionWrapper(perfHandler),
  removeHandler: exceptionWrapper(removeHandler),
  statsHandler: exceptionWrapper(statsHandler),
  showHandler: exceptionWrapper(showHandler),
};
