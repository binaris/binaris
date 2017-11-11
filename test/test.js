// Test runner
const { test } = require('ava');

// External dependencies
const yaml = require('js-yaml');
const fs = require('mz/fs');
const globToRegExp = require('glob-to-regexp');

// Create/run and remove a Docker container.
const Container = require('./helpers/container');

// The name of the Docker image.
const dockerImage = 'binaris';

// The docker user/group information.
const dockerUser = 'dockeruser';
const dockerGroup = 'dockeruser';
const dockerPassword = 'binaris';

// Directory to mount the test volume on inside Docker.
const testMountDir = '/home/dockeruser/test';

// This is needed to mess with the Docker network from inside
const flags = '--cap-add=NET_ADMIN';

/**
 * Imitates stdc sleep behavior using es6 async/await
 *
 * @param {int} ms - the duration in milliseconds to sleep
 */
const msleep = function msleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generates a Docker friendly string representing all of the
 * environment variables(and corresponding values) defined in
 * the provided test entry.
 *
 * Note: If an environment variable is defined without a value the
 *       value is pulled from the invokers shell.
 *
 * @param {string} testEntry - parsed YML test to parse envs from
 * @returns {string} - Docker friendly string with all environment vars
 */
const genEnvString = function genEnvString(testEntry) {
  if (Object.prototype.hasOwnProperty.call(testEntry, 'env')) {
    return testEntry.env.reduce((envString, envEntry) => {
      if (Object.prototype.hasOwnProperty.call(envEntry, 'value')) {
        return `${envString || ''} -e "${envEntry.name}=${envEntry.value}"`;
      }
      return `${envString || ''} -e ${envEntry.name}`;
    }, '');
  }
  return '';
};

/**
 * Create a Docker container for each test before it runs.
 * This way all test runs are isolated thereby opening up
 * many testing avenues.
 */
test.beforeEach(async (t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.container = new Container(dockerImage,
    dockerPassword, testMountDir);
  await t.context.container.create();
  await t.context.container.giveUserVolumeAccess(dockerUser, dockerGroup);
});

/**
 * Always call `remove` on the container before exit
 */
test.afterEach.always(async (t) => {
  if (t.context.container.isCreated()) {
    await t.context.container.remove();
  }
});

/**
 * Iterates over the YAML CLI specification separating and testing each
 * `test` entry separately.
 */
const planYAML = yaml.safeLoad(fs.readFileSync(process.env.BINARIS_TEST_SPEC_PATH || './test/CLISpec.yml', 'utf8'));
planYAML.forEach((rawSubTest) => {
  test(rawSubTest.test, async (t) => {
    const envString = genEnvString(rawSubTest);

    if (rawSubTest.setup) {
      for (const setupStep of rawSubTest.setup) {
        // eslint-disable-next-line no-await-in-loop
        await t.context.container.run(`${envString} ${flags}`, setupStep);
      }
    }

    for (const step of rawSubTest.steps) {
      if (step.delay) {
        // eslint-disable-next-line no-await-in-loop
        await msleep(step.delay);
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        const output = await t.context.container.run(`${envString} ${flags}`, step.in, true);
        t.true(globToRegExp(step.out).test(output.slice(0, -1)));
      } catch (err) {
        t.true(globToRegExp(step.out).test(err.stderr.slice(0, -1)));
        t.is(err.code, (step.exit || 0));
      }
    }
  });
});

