'use strict';

// Test runner
const test = require('ava');

// External dependencies
const yaml = require('js-yaml');
const fs = require('mz/fs');
const strip = require('strip-color');
const regEsc = require('escape-string-regexp');

// Create/run and remove a Docker container.
const Container = require('./helpers/container');

const propagatedEnvVars = [
  'BINARIS_TEMPORARY_API_KEY_FOR_TESTING_OLD_ENDPOINTS',
  'BINARIS_API_KEY',
  'BINARIS_ACCOUNT_ID',
  'BINARIS_DEPLOY_ENDPOINT',
  'BINARIS_INVOKE_ENDPOINT',
  'BINARIS_LOG_ENDPOINT',
];

const commonBashOpts = 'set -o pipefail;';

let imageName = 'binaris/binaris';
if (process.env.tag !== undefined) {
  imageName = `${imageName}:${process.env.tag}`;
}

/**
 * Create a Docker container for each test before it runs.
 * This way all test runs are isolated thereby opening up
 * many testing avenues.
 */
test.beforeEach(async (t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.ct = new Container(imageName);
});

/**
 * Always call `remove` on the container before exit
 */
test.afterEach.always(async (t) => {
  if (t.context.ct.started) {
    if (t.context.cleanup) {
      for (const cleanupStep of t.context.cleanup) {
        // eslint-disable-next-line no-await-in-loop
        const result = await t.context.ct.streamIn(`${commonBashOpts} ${cleanupStep}`);
        if (result.exitCode !== 0) {
          t.log(`Cleanup stdout: ${result.stdout}`);
          t.log(`Cleanup stderr: ${result.stderr}`);
          // eslint-disable-next-line no-await-in-loop
          await t.context.ct.stopAndKillContainer();
          throw new Error(result.stderr);
        }
      }
    }
    await t.context.ct.stopAndKillContainer();
  }
});

/**
 * Iterates over the YAML CLI specification separating and testing each
 * `test` entry separately.
 */
const testFileNames = ['./test/spec.yml', './test/cases.yml',
  './test/jsApi.yml', './test/py2Api.yml'];
const testFiles = testFileNames.map(file => yaml.safeLoad(fs.readFileSync(file, 'utf8')));
const testPlan = [].concat(...testFiles);

function stripText(origText) {
  return strip(origText)
    .replace(/\r+/g, '')
    .replace(/\s+$/g, '');
}

const createRegTest = function createRegTest(expected) {
  const DIGIT_ESCAPE = 'ESCAPESEQUENCEDIGIT';
  const STAR_ESCAPE = 'ESCAPESEQUENCESPACE';
  const PERCENT_ESCAPE = 'ESCAPESEQUENCEPERCENT';
  const protectedEscapes = expected
        .replace(/#/g, DIGIT_ESCAPE)
        .replace(/\*/g, STAR_ESCAPE)
        .replace(/%/g, PERCENT_ESCAPE);
  const protectedRegexps = regEsc(protectedEscapes);
  const regex = protectedRegexps
        .replace(new RegExp(DIGIT_ESCAPE, 'g'), '\\d+')
        .replace(new RegExp(STAR_ESCAPE, 'g'), '[\\s\\S]*?')
        .replace(new RegExp(PERCENT_ESCAPE, 'g'), '.*?');
  return new RegExp(regex);
};

function createTest(rawSubTest) {
  const maybeSerialTest = rawSubTest.serial ? test.serial : test;
  maybeSerialTest(rawSubTest.test, async (t) => {
    const activeEnvs = propagatedEnvVars.filter(envKey =>
      process.env[envKey] !== undefined).map(envKey =>
      `${envKey}=${process.env[envKey]}`);
    await t.context.ct.startContainer(activeEnvs);
    if (rawSubTest.setup) {
      for (const setupStep of rawSubTest.setup) {
        // eslint-disable-next-line no-await-in-loop
        const setupOut = await t.context.ct.streamIn(`${commonBashOpts} ${setupStep}`);
        if (setupOut.exitCode !== 0) {
          t.log(`Setup stdout: ${setupOut.stdout}`);
          t.log(`Setup stderr: ${setupOut.stderr}`);
          throw new Error(setupOut.stderr);
        }
      }
    }
    // eslint-disable-next-line no-param-reassign
    t.context.cleanup = rawSubTest.cleanup;

    const matchText = function matchText(expected, text) {
      return createRegTest(expected).test(stripText(text));
    };

    for (const step of rawSubTest.steps) {
      // eslint-disable-next-line no-await-in-loop
      const cmdOut = await t.context.ct.streamIn(step.in);
      if (step.out) {
        t.true(matchText(step.out, cmdOut.stdout));
      }
      if (step.err) {
        t.true(matchText(step.err, cmdOut.stderr));
      }
      t.true(cmdOut.exitCode === (step.exit || 0), step.err);
    }
  });
}

testPlan.forEach((rawSubTest) => {
  if (rawSubTest.foreach) {
    for (const variant of Object.keys(rawSubTest.foreach)) {
      const vars = rawSubTest.foreach[variant];
      let testStr = JSON.stringify(rawSubTest);
      for (const key of Object.keys(vars)) {
        const val = vars[key];
        testStr = testStr.replace(new RegExp(`{${key}}`, 'g'), val);
      }
      const copy = JSON.parse(testStr);
      createTest(copy);
    }
  } else {
    createTest(rawSubTest);
  }
});

