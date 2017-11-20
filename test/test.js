// Test runner
const { test } = require('ava');

// External dependencies
const yaml = require('js-yaml');
const fs = require('mz/fs');
const globToRegExp = require('glob-to-regexp');


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
      await t.context.ct.streamIn([cleanupStep]);
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
    if (rawSubTest.work_dir) {
      const mkWorkDir = await t.context.ct.streamIn([`mkdir -p ${rawSubTest.work_dir}`]);
      t.is(mkWorkDir.exitCode, 0);
      const cdWorkDir = await t.context.ct.streamIn([`cd ${rawSubTest.work_dir}`]);
      t.is(cdWorkDir.exitCode, 0);
    }

    if (rawSubTest.setup) {
      for (const setupStep of rawSubTest.setup) {
        // eslint-disable-next-line no-await-in-loop
        const setupOut = await t.context.ct.streamIn([setupStep]);
        t.is(setupOut.exitCode, 0);
      }
    }
    // eslint-disable-next-line no-param-reassign
    t.context.cleanup = rawSubTest.cleanup;

    for (const step of rawSubTest.steps) {
      let cmdSequence = [step.in];
      if (step.input) {
        cmdSequence = cmdSequence.concat(...step.input);
      }
      // eslint-disable-next-line no-await-in-loop
      const cmdOut = await t.context.ct.streamIn(cmdSequence);
      if (step.out) {
        t.true(globToRegExp(step.out).test(cmdOut.output));
      } else if (step.stdout) {
        t.true(globToRegExp(step.stdout).test(cmdOut.stdout));
      } else if (step.stderr) {
        t.true(globToRegExp(step.stderr).test(cmdOut.stderr));
      }
      t.is(cmdOut.exitCode, (step.exit || 0));
    }
  });
});

