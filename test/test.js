// test runner
const { test } = require('ava');

// external dependencies
const proxyquire = require('proxyquire');
const yaml = require('js-yaml');
const fs = require('mz/fs');
const globToRegExp = require('glob-to-regexp');
const stringArgv = require('string-argv');
const shell = require('shelljs');
// this is the base SDK used during the tests
const vanillaSDK = require('../sdk');

// just the temporary way to control whether tests run locally
const useMockSDK = process.env.BINARIS_MOCK_SDK > 0;

// the default logger is replaced in the tests so that
// the tests can intercept and analyze the dialog. All output
// directed towards this faux logger can be accessed through the
// 'logOutput' variable or to dump the logs use the getOutputString method
const createLogger = function createLogger() {
  const logger = { logOutput: [] };
  const defaultLogFunction = function defaultLog(text) {
    logger.logOutput.push(text);
  };

  logger.info = defaultLogFunction;
  logger.warn = defaultLogFunction;
  logger.error = function errorlog(text) {
    logger.logOutput.push(`bn: ${text}`);
  };
  // simple convenience method which retrieves
  // all text currently held by this logger(erases after retrieval)
  logger.getOutputString = function getOutputString() {
    const finalText =
      logger.logOutput.reduce((aggr, logItem) =>
       `${(aggr ? `${aggr}\n` : '')}${logItem}`);
    logger.logOutput = [];
    return finalText;
  };
  return logger;
};

const createCLIStub = function createCLIStub(stubSDK, logger) {
  const actionStub = function actionStub(action) {
    return proxyquire(`../cli-sdk/${action}`, { '../sdk': stubSDK });
  };
  return proxyquire('../cli', {
    './cli-sdk': proxyquire('../cli-sdk', {
      './deploy': actionStub('deploy'),
      './invoke': actionStub('invoke'),
      './remove': actionStub('remove'),
      './logger': logger,
    }),
  });
};

const emptySDK = function emptySDK(changes) {
  const empty = {
    invoke: async () => {},
    deploy: async () => {},
    remove: async () => {},
  };
  return Object.assign({}, empty, changes);
};

// TODO: understand why empty funcs are required
const localSDK = {
  'Test all commands(good-path)': emptySDK({
    // eslint-disable-next-line arrow-body-style
    invoke: async () => {
      return {
        body: 'Hello World!',
        statusCode: 200,
      };
    },
  }),
  'Test deploy(good-path)': emptySDK({}),
};

const getSDK = function getSDK(testSDKMap, name) {
  // this just ensures we don't shallow copy and modify
  let baseSDK = JSON.parse(JSON.stringify(vanillaSDK));
  if (useMockSDK) {
    if (Object.prototype.hasOwnProperty.call(testSDKMap, name)) {
      baseSDK = testSDKMap[name];
    }
  }
  return baseSDK;
};

const parseTestPlan = async function parseTestPlan(planPath) {
  const planYAML = yaml.safeLoad(fs.readFileSync(planPath, 'utf8'));
  const testFunctions = {};
  // this loop goes through all of the test definitions
  // in the YML spec file and creates a series of ava
  // compatible test functions from it
  for (const rawSubTest of planYAML) {
    testFunctions[rawSubTest.test] = async (t) => {
      // backup the original directory
      const previousWorkDir = process.cwd();
      // change to the specified work directory
      // TODO: safety checks?
      if (rawSubTest.work_dir) {
        process.chdir(rawSubTest.work_dir);
        shell.cd(rawSubTest.work_dir);
      }

      if (rawSubTest.setup) {
        for (const setupStep of rawSubTest.setup) {
          const shellResponse = shell.exec(setupStep);
          t.true(shellResponse.code === 0);
        }
      }

      const subTestSDK = getSDK(localSDK, rawSubTest.test);
      const stepLogger = createLogger();
      const CLI = createCLIStub(subTestSDK, stepLogger);
      for (const step of rawSubTest.steps) {
        // this creates node style process.argv inputs and calls the CLI
        // eslint-disable-next-line no-await-in-loop
        const exitCode = await CLI(['', ...stringArgv(step.in)]);
        const logs = stepLogger.getOutputString();
        t.is(exitCode, (step.exit || 0));
        t.true(globToRegExp(step.out).test(logs));
      }
      // set the workding dir back to its original value
      process.chdir(previousWorkDir);
      shell.cd(previousWorkDir);
    };
  }
  // once the ava test functions have been created they
  // need to be run serially
  for (const key in testFunctions) {
    if (Object.prototype.hasOwnProperty.call(testFunctions, key)) {
      test.serial(key, testFunctions[key]);
    }
  }
};

parseTestPlan(process.env.BINARIS_TEST_SPEC_PATH || './test/CLISpec.yml');
