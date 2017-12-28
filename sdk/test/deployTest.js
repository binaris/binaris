// SDK dir structure confuses eslint
/* eslint-disable import/no-extraneous-dependencies */
const { test } = require('ava');
const nock = require('nock');
const fs = require('mz/fs');
const fse = require('fs-extra');
const { generate } = require('randomstring');

// standard length of Binaris API key
const APIKeyLength = 20;

const testApiKey = generate(APIKeyLength);
const testFuncConf = {
  file: 'function.js',
  entrypoint: 'handler',
};

const testFuncName = 'binarisTestDeployFunction';

test.beforeEach(async (t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.fakeTarFileName = 'binarisTestTar';
  await fs.writeFile(t.context.fakeTarFileName, '', 'utf8');
});

test.afterEach.always(async (t) => {
  await fse.remove(t.context.fakeTarFileName);
  nock.cleanAll();
});

test('Just test deploy (good-path)', async (t) => {
  delete process.env.BINARIS_DEPLOY_ENDPOINT;
  // eslint-disable-next-line global-require
  const deploy = require('../deploy');

  // eslint-disable-next-line no-unused-vars
  const deployMock = nock('https://api.binaris.com')
    .post(`/v1/function/${testApiKey}-${testFuncName}`)
    .query(testFuncConf)
    .reply(200, { status: 'OK' });
  const response = await deploy(testFuncName, testApiKey,
    testFuncConf, t.context.fakeTarFileName);
  t.is(200, response.status);
  t.is('OK', response.body.status);
});

test('Test deploy with bad key (bad-path)', async (t) => {
  delete process.env.BINARIS_DEPLOY_ENDPOINT;
  // eslint-disable-next-line global-require
  const deploy = require('../deploy');

  const someBadKey = generate(APIKeyLength);
  // eslint-disable-next-line no-unused-vars
  const deployMock = nock('https://api.binaris.com')
    .post(`/v1/function/${someBadKey}-${testFuncName}`)
    .query(testFuncConf)
    .reply(403, { errorCode: 'ERR_BAD_KEY' });
  const response = await deploy(testFuncName, someBadKey,
    testFuncConf, t.context.fakeTarFileName);
  t.is(403, response.status);
  t.is('ERR_BAD_KEY', response.body.errorCode);
});

test('Test deploy with no backend (bad-path)', async (t) => {
  process.env.BINARIS_DEPLOY_ENDPOINT = 'invalidbinaris.endpoint';
  // eslint-disable-next-line global-require
  const deploy = require('../deploy');

  const response = await deploy(testFuncName, testApiKey,
    testFuncConf, t.context.fakeTarFileName);
  t.true(response.error !== undefined);
});

