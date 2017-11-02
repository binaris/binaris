const deploy = require('./deploy');
const init = require('./init');
const invoke = require('./invoke');
const log = require('./logger');
const remove = require('./remove');
const YMLUtil = require('./binarisYML');

const fs = require('mz/fs');
const fse = require('fs-extra');
const path = require('path');

/** Wrapper which uniformly handles many exceptions/errors. */
const exceptionWrapper = function tryCatchWrapper(funcToWrap) {
  const wrapped = async function wrapped(...args) {
    try {
      await funcToWrap(...args);
      return 0;
    } catch (err) {
      log.error(err.message);
      if (!process.env.BINARIS_LOG_LEVEL) {
        log.info('For more information set the BINARIS_LOG_LEVEL environment variable to debug, verbose, info, warn or error');
      }
      return 1;
    }
  };
  return wrapped;
};

/** Attempts to parse a JSON object. */
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

/** Gather all of the relevant meta data about a function. */
const gatherMeta = async function gatherMeta(options) {
  const metaObj = {
    path: path.resolve(options.path || process.cwd()),
  };
  // if the path the user wishes to operate in does not exist
  if (!(await fse.pathExists(metaObj.path))) {
    throw new Error(`No such directory: '${metaObj.path}'`);
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
  await deploy(meta.name, meta.path, meta.conf);
  log.info(
`Deployed function ${meta.name}
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
    log.error('Options json (-j) and data (-d) cannot be provided together');
  }
  let funcData;
  let payloadJSON;
  if (options.data) {
    payloadJSON = options.data;
  } else if (options.json) {
    try {
      payloadJSON = await fs.readFile(options.json, 'utf8');
    } catch (err) {
      throw new Error(`Invalid JSON file path: ${options.json}`);
    }
  }

  if (payloadJSON) {
    funcData = attemptJSONParse(payloadJSON);
    log.debug({ funcData });
  }

  const response = await invoke(meta.path, meta.name, funcData);
  if (response.statusCode !== 200) {
    log.warn(`Function returned non standard status: ${response.statusCode}`);
  }
  log.info(response.body);
};

/**
 * Handles the case of an unknown argument.
 *
 * @param {string} env - The unknown argument.
 */
const unknownHandler = async function unknownHandler(env) {
  throw new Error(`Unknown command: '${env}'. See 'bn --help'`);
};

module.exports = {
  initHandler: exceptionWrapper(initHandler),
  deployHandler: exceptionWrapper(deployHandler),
  removeHandler: exceptionWrapper(removeHandler),
  invokeHandler: exceptionWrapper(invokeHandler),
  unknownHandler: exceptionWrapper(unknownHandler),
};
