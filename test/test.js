// test runner
const { test } = require('ava');

// external dependencies
const proxyquire = require('proxyquire');
const yaml = require('js-yaml');
const fs = require('mz/fs');
const globToRegExp = require('glob-to-regexp');
const stringArgv = require('string-argv');
const shell = require('shelljs');
const clone = require('clone');
// this is the base SDK used during the tests
const binarisSDK = require('../sdk');

// just the temporary way to control whether tests run locally
const useMockSDK = process.env.BINARIS_MOCK_SDK > 0;

// the default logger is replaced in the tests so that
// the tests can intercept and analyze the dialog. All output
// directed towards this fake logger can be accessed through the
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
  logger.releaseOutputString = function releaseOutputString() {
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

const fakeSDK = function fakeSDK(changes) {
  const empty = {
    invoke: async () => {},
    deploy: async (apiKey, funcName) => funcName,
    remove: async () => {},
  };
  return Object.assign({}, empty, changes);
};

const localSDK = {
  'Test all commands(good-path)': fakeSDK({
    // eslint-disable-next-line arrow-body-style
    invoke: async () => {
      return {
        body: 'Hello World!',
        statusCode: 200,
      };
    },
  }),
  'Test deploy(good-path)': fakeSDK(),
};

const getSDK = function getSDK(testSDKMap, name) {
  if (useMockSDK && Object.prototype.hasOwnProperty.call(testSDKMap, name)) {
    return testSDKMap[name];
  }
  return clone(binarisSDK);
};

const msleep = function msleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const planYAML = yaml.safeLoad(fs.readFileSync(process.env.BINARIS_TEST_SPEC_PATH || './test/CLISpec.yml', 'utf8'));
planYAML.forEach((rawSubTest) => {
  test(rawSubTest.test, async (t) => {
    // change to the specified work directory
    if (rawSubTest.work_dir) {
      shell.cd(rawSubTest.work_dir);
    }

    if (rawSubTest.setup) {
      for (const setupStep of rawSubTest.setup) {
        t.true(shell.exec(setupStep).code === 0);
      }
    }

    const subTestSDK = getSDK(localSDK, rawSubTest.test);
    const stepLogger = createLogger();
    for (const step of rawSubTest.steps) {
      delete require.cache[require.resolve('commander')];
      // this is done to ensure that the CLI doesn't reuse
      // an instance of commander
      if (step.delay) {
        // eslint-disable-next-line no-await-in-loop
        await msleep(step.delay);
      }
      // this creates node style process.argv inputs and calls the CLI
      const CLI = createCLIStub(subTestSDK, stepLogger);
      // eslint-disable-next-line no-await-in-loop
      const exitCode = await CLI(['', ...stringArgv(step.in)]);
      const logs = stepLogger.releaseOutputString();
      t.is(exitCode, (step.exit || 0));
      t.true(globToRegExp(step.out).test(logs));
    }
  });
});

