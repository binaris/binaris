const deploy = require('./deploy');
const init = require('./init');
const invoke = require('./invoke');
const log = require('./logger');
const remove = require('./remove');

// core modules
const fs = require('mz/fs');
const path = require('path');

const exceptionWrapper = function tryCatchWrapper(funcToWrap) {
  const wrapped = async function wrapped(...args) {
    try {
      await funcToWrap(...args);
      return true;
    } catch (err) {
      log.error(err.message);
      if (!process.env.BINARIS_LOG_LEVEL) {
        log.info('For more information set the BINARIS_LOG_LEVEL environment variable to debug, verbose, info, warn or error');
      }
      return false;
    }
  };
  return wrapped;
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
  return path.resolve(options.path || process.cwd());
}

const unknownHandler = async function unknownHandler(env) {
  throw new Error(`Unknown command: ${env}`);
};

// initializes a binaris function based on the options given by the user
// this essentially boils down to creating template files with
// the correct information in the correct location
const initHandler = async function initHandler(options) {
  // this is where the actual initialize function is called and immediately
  // evaluated to determine if was successfully completed
  const functionPath = getFuncPath(options);
  const finalName = await init(options.functionName, functionPath);
  const initDialog =
`Initialized function ${finalName} in ${path.join(functionPath, finalName)}
  (use "bn deploy" to deploy the function)`;
  log.info(initDialog);
};

// simply handles the process of deploying a function and its
// associated metadata to the Binaris cloud
const deployHandler = async function deployHandler(options) {
  log.info('Deploying function...');
  const funcPath = getFuncPath(options);
  const funcEndpoint = await deploy(funcPath);
  log.info(`Function deployed. To invoke use:\n  curl ${funcEndpoint}\nor\n  bn invoke`);
};

// Removes a binaris function that you previously deployed.
const removeHandler = async function removeHandler(options) {
  const { functionName } = options;
  const funcPath = getFuncPath(options);

  if (!functionName && !funcPath) {
    throw new Error('Missing function name. Use --path or --functionName');
  }
  log.info(`Removing function: ${functionName || funcPath }...`);
  await remove(functionName, funcPath);
  log.info('Function removed');
};

// invokes a binaris function that has been previously
// deployed either through the CLI or other means
const invokeHandler = async function invokeHandler(functionName, options) {
  if (options.file && options.json) {
    log.error('Options json (-j) and file (-f) cannot be provided together');
  }
  const funcPath = getFuncPath(options);
  let funcData;
  let payloadJSON;
  if (options.json) {
    payloadJSON = options.json;
  } else if (options.file) {
    try {
      payloadJSON = await fs.readFile(options.file, 'utf8');
    } catch (err) {
      throw new Error(`Invalid JSON file path: ${options.file}`);
    }
  }

  if (payloadJSON) {
    funcData = attemptJSONParse(payloadJSON);
    log.debug({ funcData });
  }

  const response = await invoke(funcPath, functionName, funcData);
  if (response.statusCode !== 200) {
    log.warn(`Function returned non standard status: ${response.statusCode}`);
  }
  log.info(response.body);
};

module.exports = {
  initHandler: exceptionWrapper(initHandler),
  deployHandler: exceptionWrapper(deployHandler),
  removeHandler: exceptionWrapper(removeHandler),
  invokeHandler: exceptionWrapper(invokeHandler),
  unknownHandler: exceptionWrapper(unknownHandler),
};
