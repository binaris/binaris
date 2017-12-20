// SDK dir structure confuses eslint
/* eslint-disable import/no-extraneous-dependencies */
const { test } = require('ava');
const nock = require('nock');
const fs = require('mz/fs');
const fse = require('fs-extra');
const { generate } = require('randomstring');

// standard length of Binaris API key
const APIKeyLength = 20;
// length to use when generating fake function names
const fakeNameLength = 10;

const testApiKey = generate(APIKeyLength);
const testFuncConf = {
  file: 'function.js',
  entrypoint: 'handler',
};

test.beforeEach(async (t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.fakeTarFileName = generate(fakeNameLength);
  await fs.writeFile(t.context.fakeTarFileName, '', 'utf8');
});

test.afterEach.always(async (t) => {
  await fse.remove(t.context.fakeTarFileName);
  nock.cleanAll();
});

const justDeploy = async function justDeploy(t) {
  delete process.env.BINARIS_DEPLOY_ENDPOINT;
  // eslint-disable-next-line global-require
  const deploy = require('../deploy');

  const deployFuncName = generate(fakeNameLength);
  // eslint-disable-next-line no-unused-vars
  const deployMock = nock('https://api.binaris.com')
    .post(`/v1/function/${testApiKey}-${deployFuncName}`)
    .query(testFuncConf)
    .reply(200, { status: 'OK' });
  const response = await deploy(deployFuncName, testApiKey,
    testFuncConf, t.context.fakeTarFileName);
  t.is(200, response.status);
  t.is('OK', response.body.status);
};

const deployWithNoBackend = async function deployWithNoBackend(t) {
  process.env.BINARIS_DEPLOY_ENDPOINT = 'invalidbinaris.endpoint';
  // eslint-disable-next-line global-require
  const deploy = require('../deploy');

  const deployFuncName = generate(fakeNameLength);
  const response = await deploy(deployFuncName, testApiKey,
    testFuncConf, t.context.fakeTarFileName);
  t.true(response.error !== undefined);
};

const deployWithBadKey = async function deployWithBadKey(t) {
  delete process.env.BINARIS_DEPLOY_ENDPOINT;
  // eslint-disable-next-line global-require
  const deploy = require('../deploy');

  const someBadKey = generate(APIKeyLength);
  const deployFuncName = generate(fakeNameLength);
  // eslint-disable-next-line no-unused-vars
  const deployMock = nock('https://api.binaris.com')
    .post(`/v1/function/${someBadKey}-${deployFuncName}`)
    .query(testFuncConf)
    .reply(403, { errorCode: 'ERR_BAD_KEY' });
  const response = await deploy(deployFuncName, someBadKey,
    testFuncConf, t.context.fakeTarFileName);
  t.is(403, response.status);
  t.is('ERR_BAD_KEY', response.body.errorCode);
};

test('Just test deploy (good-path)', justDeploy);
test('Test deploy with bad key (bad-path)', deployWithBadKey);
test('Test deploy with no backend (bad-path)', deployWithNoBackend);
