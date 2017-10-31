// test runner
const { test } = require('ava');

// external dependencies
const path = require('path');
const proxyquire = require('proxyquire');
const urljoin = require('urljoin');
const uuidv4 = require('uuid/v4');
const fse = require('fs-extra');

// allows the test invoker to control location of test output
const binarisTestDir = process.env.BINARIS_TEST_DIR || process.cwd();
const keepTestDirs = process.env.KEEP_TEST_DIRS || false;

// constants/env
const apiKey = 'FAKEKEY';
const invokeEndpoint = 'run-faux.binaris.io';
const deployEndpoint = 'api-faux.binaris.io';
process.env.BINARIS_API_KEY = apiKey;
// eslint-disable-next-line space-infix-ops
process.env.BINARIS_INVOKE_ENDPOINT=invokeEndpoint;
// eslint-disable-next-line space-infix-ops
process.env.BINARIS_DEPLOY_ENDPOINT=deployEndpoint;

// because every good deployment has an identical response(minus vars)
// it seems valuable to represent the success response in a function
const deploySDKMockSuccess = function deploySDKMockSuccess(key, funcName) {
  return urljoin(`https://${invokeEndpoint}`, 'v1', 'run', key, funcName);
};

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
  logger.error = defaultLogFunction;
  // simple convenience method which retrieves
  // all text currently held by this logger(erases after retrieval)
  logger.getOutputString = function getOutputString() {
    let finalText = '';
    for (let i = 0; i < logger.logOutput.length; i += 1) {
      finalText += logger.logOutput[i];
      if (i !== (logger.logOutput.length - 1)) {
        finalText += '\n';
      }
    }
    logger.logOutput = [];
    return finalText;
  };

  return logger;
};

const createCLIStub = function createCLIStub(stubSDK, logger) {
  const loadStubbedCLIAction = function loadStubbedCLIAction(action) {
    return proxyquire(`../cli-sdk/${action}`, { '../sdk': stubSDK });
  };
  const CLISDK = proxyquire('../cli-sdk',
    {
      './deploy': loadStubbedCLIAction('deploy'),
      './invoke': loadStubbedCLIAction('invoke'),
      './remove': loadStubbedCLIAction('remove'),
      './logger': logger,
    });
  return proxyquire('../cli', { './cli-sdk': CLISDK });
};

// Ava logic and tests begin here
let testDir;

// here we create our pre & post test hooks
test.before(async () => {
  testDir = path.join(binarisTestDir, `.binarisTestDir${uuidv4().substring(0, 8)}`);
  await fse.mkdir(testDir);
});

test.after(async () => {
  // for some reason fs doesn't have an simple and clean method of
  // removing a directory which contains any files. The fse package did
  // appear to have an async version of the remove method that worked well
  // but for some reason even when properly awaiting the method,
  // directories would persist. Because of this I decided to use the
  // fse sync method for now considering its a key part of the cleanup
  // process and its only a single sync call
  if (!keepTestDirs) {
    fse.removeSync(testDir);
  }
});

test.beforeEach((t) => {
  // eslint-disable-next-line no-param-reassign
  t.context = Object.assign({}, t.context, {
    fName: `binarisFunction${uuidv4().substring(0, 8)}`,
    // this is a directory made strictly for a test run, expect it
    // to be removed after each test run
    fPath: testDir,
    // hook into logger to intercept dialog output
    logger: createLogger(),
  });
  // eslint-disable-next-line no-param-reassign
  t.context.fullPath = path.join(testDir, t.context.fName);
});

test.serial('Just test init(good-path)', async (t) => {
  const CLI = createCLIStub({}, t.context.logger);
  // start running tests/assertions
  t.true(await CLI(['', '', 'init', '-f', t.context.fName, '-p', t.context.fPath]));
  t.is(t.context.logger.getOutputString(),
    `Initialized function ${t.context.fName} in ${t.context.fullPath}\n  (use "bn deploy" to deploy the function)`);
});

test.serial('Init/Deploy/Invoke/Remove(good-path)', async (t) => {
  const invokeResponse = {
    statusCode: 200,
    body: `Hello ${t.context.fName}`,
  };
  const CLI = createCLIStub({
    deploy: deploySDKMockSuccess, // SDK deploy
    invoke: async () => invokeResponse, // SDK invoke
    remove: async () => undefined, // SDK remove
  }, t.context.logger);
  // start running tests/assertions
  t.true(await CLI(['', '', 'init', '-f', t.context.fName, '-p', t.context.fPath]));
  t.is(t.context.logger.getOutputString(),
    `Initialized function ${t.context.fName} in ${t.context.fullPath}\n  (use "bn deploy" to deploy the function)`);

  t.true(await CLI(['', '', 'deploy', '-p', t.context.fullPath]));
  t.is(t.context.logger.getOutputString(),
    `Deploying function...\nFunction deployed. To invoke use:\n  curl ${deploySDKMockSuccess(apiKey, t.context.fName)}\nor\n  bn invoke`);

  t.true(await CLI(['', '', 'invoke', t.context.fName, '-p', t.context.fullPath]));
  t.is(t.context.logger.getOutputString(), `Hello ${t.context.fName}`);

  t.true(await CLI(['', '', 'remove', '-p', t.context.fullPath]));
  t.is(t.context.logger.getOutputString(),
    `Removing function: ${t.context.fullPath}...\nFunction removed`);
});

test.serial('Uknown command(bad-path)', async (t) => {
  const CLI = createCLIStub({}, t.context.logger);
  const badCMD = 'garbageCommand';
  // start running tests/assertions
  t.false(await CLI(['', '', badCMD, '-p', t.context.fullPath]));
  const unknownFailure = `Unknown command: ${badCMD}`;
  if (!process.env.BINARIS_LOG_LEVEL) {
    t.is(t.context.logger.getOutputString(),
      `${unknownFailure}\nFor more information set the BINARIS_LOG_LEVEL environment variable to debug, verbose, info, warn or error`);
  } else {
    t.is(t.context.logger.getOutputString(), unknownFailure);
  }
});

test.serial('Deploy with no function present(bad-path)', async (t) => {
  const CLI = createCLIStub({}, t.context.logger);
  // start running tests/assertions
  t.false(await CLI(['', '', 'deploy', '-p', t.context.fullPath]));
  const deployFailure = `Deploying function...\n${t.context.fullPath} does not contain a valid binaris function!`;
  if (!process.env.BINARIS_LOG_LEVEL) {
    t.is(t.context.logger.getOutputString(),
      `${deployFailure}\nFor more information set the BINARIS_LOG_LEVEL environment variable to debug, verbose, info, warn or error`);
  } else {
    t.is(t.context.logger.getOutputString(), deployFailure);
  }
});
