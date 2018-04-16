// Test runner
const { test } = require('ava');

// External dependencies
const yaml = require('js-yaml');
const fs = require('mz/fs');
const strip = require('strip-color');
const regEsc = require('escape-string-regexp');

// Create/run and remove a Docker container.
const Container = require('./helpers/container');

const propagatedEnvVars = [
  'BINARIS_API_KEY',
  'BINARIS_DEPLOY_ENDPOINT',
  'BINARIS_INVOKE_ENDPOINT',
  'BINARIS_LOG_ENDPOINT'];

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
  if (t.context.cleanup) {
    for (const cleanupStep of t.context.cleanup) {
      // eslint-disable-next-line no-await-in-loop
      await t.context.ct.streamIn(cleanupStep);
    }
  }
  await t.context.ct.stopAndKillContainer();
});

/**
 * Iterates over the YAML CLI specification separating and testing each
 * `test` entry separately.
 */
const testFileNames = ['./test/spec.yml', './test/cases.yml'];
const testFiles = testFileNames.map(file => yaml.safeLoad(fs.readFileSync(file, 'utf8')));
const testPlan = [].concat(...testFiles);
testPlan.forEach((rawSubTest) => {
  test(rawSubTest.test, async (t) => {
    const activeEnvs = propagatedEnvVars.filter(envKey =>
      process.env[envKey] !== undefined).map(envKey =>
      `${envKey}=${process.env[envKey]}`);
    await t.context.ct.startContainer(activeEnvs);
    if (rawSubTest.setup) {
      for (const setupStep of rawSubTest.setup) {
        // eslint-disable-next-line no-await-in-loop
        const setupOut = await t.context.ct.streamIn(setupStep);
        t.is(setupOut.exitCode, 0);
      }
    }
    // eslint-disable-next-line no-param-reassign
    t.context.cleanup = rawSubTest.cleanup;

    const createRegTest = function createRegTest(expected) {
      const escaped = expected.split('*').map(item => regEsc(item));
      const finalString = `^${escaped.join('[\\s\\S]*')}$`;
      return new RegExp(finalString);
    };

    for (const step of rawSubTest.steps) {
      // eslint-disable-next-line no-await-in-loop
      const cmdOut = await t.context.ct.streamIn(step.in);
      if (step.out) {
        t.true(createRegTest(step.out).test(strip(cmdOut.stdout.slice(0, -1))));
      } else if (step.err) {
        t.true(createRegTest(step.err).test(strip(cmdOut.stderr.slice(0, -1))));
      }
      t.is(cmdOut.exitCode, (step.exit || 0));
    }
  });
});

