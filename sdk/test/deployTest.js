// SDK dir structure confuses eslint
/* eslint-disable import/no-extraneous-dependencies */
const { test } = require('ava');
const fs = require('mz/fs');
const fse = require('fs-extra');
const { generate } = require('randomstring');
const nock = require('nock');

// standard length of Binaris API key
const APIKeyLength = 20;

const testApiKey = generate(APIKeyLength);
const testFuncConf = {
  file: 'function.js',
  entrypoint: 'handler',
  runtime: 'node8',
  codeDigest: 'fakedigest',
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

test.serial('Just test deploy (good-path)', async (t) => {
  const deployEndpoint = generate(10);

  // eslint-disable-next-line global-require
  const deploy = require('../deploy');
  const digestObj = { digest: 'fakedigest' };
  // eslint-disable-next-line no-unused-vars
  const deployMock = nock(`https://${deployEndpoint}`);
  deployMock
    .post('/v2/code')
    .matchHeader('X-Binaris-Api-Key', testApiKey)
    .matchHeader('Content-Type', 'application/gzip')
    .reply(200, digestObj);

  deployMock
    .post(`/v2/conf/${testApiKey}/${testFuncName}`, testFuncConf)
    .reply(200, digestObj);

  deployMock
    .post(`/v2/tag/${testApiKey}/${testFuncName}/latest`, digestObj)
    .reply(200, { status: 'ok' });

  const response = await deploy(testFuncName, testApiKey,
    testFuncConf, t.context.fakeTarFileName, deployEndpoint);
  t.is(200, response.status);
  t.deepEqual({ status: 'ok' }, response.body);
});

test.serial('Test deploy with bad key (bad-path)', async (t) => {
  // eslint-disable-next-line global-require
  const deploy = require('../deploy');

  const deployEndpoint = generate(10);

  const someBadKey = generate(APIKeyLength);
  // eslint-disable-next-line no-unused-vars
  const deployMock = nock(`https://${deployEndpoint}`)
    .post('/v2/code')
    .matchHeader('X-Binaris-Api-Key', someBadKey)
    .matchHeader('Content-Type', 'application/gzip')
    .reply(403, { errorCode: 'ERR_BAD_KEY' });

  const response = await deploy(testFuncName, someBadKey,
    testFuncConf, t.context.fakeTarFileName, deployEndpoint);

  t.is(403, response.status);
  t.is('ERR_BAD_KEY', response.body.errorCode);
});

test.serial('Test deploy with no backend (bad-path)', async (t) => {
  // eslint-disable-next-line global-require
  const deploy = require('../deploy');

  const response = await deploy(testFuncName, testApiKey,
    testFuncConf, t.context.fakeTarFileName, 'invalidbinaris.endpoint');
  t.true(response.error !== undefined);
});

