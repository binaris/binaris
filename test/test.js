// Test runner
const { test } = require('ava');

// External dependencies
const yaml = require('js-yaml');
const fs = require('mz/fs');
const globToRegExp = require('glob-to-regexp');

// Create/run and remove a Docker container.
const Container = require('./helpers/container');

// The name of our Docker image.
const dockerImage = 'binaris';

// Our docker user/group information.
const dockerUser = 'dockeruser';
const dockerGroup = 'dockeruser';
const dockerPassword = 'binaris';

// Directory to mount the test volume on inside Docker.
const testMountDir = '/home/dockeruser/test';

// This is needed to mess with the Docker network from inside
const flags = '--cap-add=NET_ADMIN';

// The environment variables we want propagated to Docker
const envVars = [
  'BINARIS_INVOKE_ENDPOINT',
  'BINARIS_DEPLOY_ENDPOINT',
  'BINARIS_API_KEY'];

/**
 * Imitates stdc sleep behavior using es6 async/await
 *
 * @param {int} ms - the duration in milliseconds to sleep
 */
const msleep = function msleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
 * Always call `remove` on your container before exit
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
    // Create our environment variable string from the env list
    const envs = `-e ${envVars.join(' -e ')}`;
    if (rawSubTest.setup) {
      for (const setupStep of rawSubTest.setup) {
        // eslint-disable-next-line no-await-in-loop
        await t.context.container.run(`${envs}${flags}`, setupStep);
      }
    }

    for (const step of rawSubTest.steps) {
      if (step.delay) {
        // eslint-disable-next-line no-await-in-loop
        await msleep(step.delay);
      }
      try {
        // eslint-disable-next-line no-await-in-loop
        const output = await t.context.container.run(`${envs} ${flags}`, step.in, true);
        t.true(globToRegExp(step.out).test(output.slice(0, -1)));
      } catch (err) {
        // Annoying byproduct of the child_process in node. Because we
        // have no guarantees regarding ordering, we must test both possible
        // orderings to ensure we have a match.
        const orderOne = `${err.stdout}${err.stderr}`.slice(0, -1);
        const orderTwo = `${err.stderr}${err.stdout}`.slice(0, -1);
        if (globToRegExp(step.out).test(orderOne)) {
          t.true(globToRegExp(step.out).test(orderOne));
        } else {
          t.true(globToRegExp(step.out).test(orderTwo));
        }
        t.is(err.code, (step.exit || 0));
      }
    }
  });
});

