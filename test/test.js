// Test runner
const test = require('ava');

// External dependencies
const yaml = require('js-yaml');
const fs = require('mz/fs');
const strip = require('strip-color');
const regEsc = require('escape-string-regexp');
const throat = require('throat');

// Create/run and remove a Docker container.
const Container = require('./helpers/container');

const propagatedEnvVars = [
  'BINARIS_API_KEY',
  'BINARIS_DEPLOY_ENDPOINT',
  'BINARIS_INVOKE_ENDPOINT',
  'BINARIS_LOG_ENDPOINT'];

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
const testFileNames = ['./test/spec.yml', './test/cases.yml'];
const testFiles = testFileNames.map(file => yaml.safeLoad(fs.readFileSync(file, 'utf8')));
const testPlan = [].concat(...testFiles);

const limiter = throat(10);

function limitedTest(name, testFn) {
  return test(name, async t => limiter(async () => testFn(t)));
}

function stripText(origText) {
  return strip(origText.split('\r').join('').slice(0, -1));
}

function createTest(rawSubTest) {
  const maybeSerialTest = rawSubTest.serial ? test.serial : limitedTest;
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

    const createRegTest = function createRegTest(expected) {
      const DIGIT_ESCAPE = 'ESCAPESEQUENCEDIGIT';
      const STAR_ESCAPE = 'ESCAPESEQUENCESPACE';
      let regex = expected.replace(/#/g, DIGIT_ESCAPE);
      regex = regex.replace(/\*/g, STAR_ESCAPE);
      regex = regEsc(regex);
      regex = regex.split(DIGIT_ESCAPE).join('\\d+');
      regex = regex.split(STAR_ESCAPE).join('[\\s\\S]*');
      regex = `^${regex}\\s*$`;
      return new RegExp(regex);
    };

    for (const step of rawSubTest.steps) {
      // eslint-disable-next-line no-await-in-loop
      const cmdOut = await t.context.ct.streamIn(step.in);
      if (step.out) {
        t.true(createRegTest(step.out).test(stripText(cmdOut.stdout)));
      } else if (step.err) {
        t.true(createRegTest(step.err).test(stripText(cmdOut.stderr)));
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

