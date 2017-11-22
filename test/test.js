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

const propagatedEnvVars = [
  'BINARIS_DEPLOY_ENDPOINT',
  'BINARIS_INVOKE_ENDPOINT',
  'BINARIS_LOG_ENDPOINT' ]

/**
 * Compares a string against it's expected value while
 * taking into account the star '*' character as catch
 * all character (including newlines). Starting an expected
 * string with a '*' and and ending with a '*' are both valid.
 *
 * @param {string} expected - expected output from test
 * @param {string} actual - actual output from test
 */
const compareOutput = function compareOutput(t, expected, actual) {
  // no matter what print out the whole comparison on failure
  const message = JSON.stringify({ expected, actual }, null, 2);
  // first split our sections by the star character
  const expectedSections = expected.split('*');
  let actualRemaining = actual;
  for (let i = 0; i < expectedSections.length; i += 1) {
    const section = expectedSections[i];
    if (i === 0) {
      // if the leading character in the string is a star the only
      // requirement is that the substring exist somewhere in the
      // actual (regardless of position)
      if (expected.charAt(0) === '*') {
        t.true(actualRemaining.indexOf(section) !== -1, message);
        actualRemaining = actualRemaining.slice(actualRemaining.indexOf(section)
          + section.length);
      } else {
        // ensure the section is the right string in the right place
        t.is(section, actualRemaining.slice(0, section.length), message);
        actualRemaining = actualRemaining.slice(section.length);
      }
    } else if (i === expectedSections.length - 1) {
      if (expected.charAt(expected.lastIndexOf() === '*')) {
        t.true(actualRemaining.indexOf(section) !== -1, message);
      } else {
        // just compare the last two parts directly
        t.is(section, actualRemaining, message);
      }
    } else {
      t.true(actualRemaining.indexOf(section) !== -1, message);
      actualRemaining = actualRemaining.slice(actualRemaining.indexOf(section));
    }
  }
};

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
    const activeEnvs = propagatedEnvVars.filter((envKey) => {
      return process.env[envKey] !== undefined;
    }).map((envKey) => {
      return `${envKey}=${process.env[envKey]}`;
    });
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

    for (const step of rawSubTest.steps) {
      // eslint-disable-next-line no-await-in-loop
      const cmdOut = await t.context.ct.streamIn(step.in);
      if (step.out) {
        compareOutput(t, step.out, strip(cmdOut.stdout.slice(0, -1)));
      } else if (step.err) {
        compareOutput(t, step.err, strip(cmdOut.stderr.slice(0, -1)));
      }
      t.is(cmdOut.exitCode, (step.exit || 0));
    }
  });
});

