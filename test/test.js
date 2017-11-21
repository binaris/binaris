// Test runner
const { test } = require('ava');

// External dependencies
const yaml = require('js-yaml');
const fs = require('mz/fs');
const globToRegExp = require('glob-to-regexp');
const strip = require('strip-color');

const msleep = require('./helpers/msleep');
// Create/run and remove a Docker container.
const Container = require('./helpers/container');

/**
 * Create a Docker container for each test before it runs.
 * This way all test runs are isolated thereby opening up
 * many testing avenues.
 */
test.beforeEach(async (t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.ct = new Container('binaris');
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
const planYAML = yaml.safeLoad(fs.readFileSync(process.env.BINARIS_TEST_SPEC_PATH || './test/CLISpec.yml', 'utf8'));
planYAML.forEach((rawSubTest) => {
  test(rawSubTest.test, async (t) => {
    await t.context.ct.startContainer();
    if (rawSubTest.setup) {
      for (const setupStep of rawSubTest.setup) {
        // eslint-disable-next-line no-await-in-loop
        const setupOut = await t.context.ct.streamIn(setupStep);
        t.is(setupOut.exitCode, 0);
      }
    }
    // eslint-disable-next-line no-param-reassign
    t.context.cleanup = rawSubTest.cleanup;

    for (const step of rawSubTest.steps) {
      // eslint-disable-next-line no-await-in-loop
      const cmdOut = await t.context.ct.streamIn(step.in);
      if (step.out) {
        t.true(globToRegExp(step.out).test(strip(cmdOut.output)));
      } else if (step.stdout) {
        t.true(globToRegExp(step.stdout).test(strip(cmdOut.stdout)));
      } else if (step.stderr) {
        t.true(globToRegExp(step.stderr).test(strip(cmdOut.stderr)));
      }
      t.is(cmdOut.exitCode, (step.exit || 0));
    }
  });
});

