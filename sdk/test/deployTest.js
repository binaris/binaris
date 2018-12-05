'use strict';

// SDK dir structure confuses eslint
/* eslint-disable import/no-extraneous-dependencies */
const test = require('ava');
const fs = require('mz/fs');
const fse = require('fs-extra');
const { generate } = require('randomstring');
const nock = require('nock');

// standard length of Binaris API key
const APIKeyLength = 20;

const testAccountId = generate({ length: 10, charset: 'numeric' });
const testApiKey = generate(APIKeyLength);
const testFuncConf = {
  file: 'function.js',
  entrypoint: 'handler',
  runtime: 'node8',
  codeDigest: 'fakedigest',
};

const testFuncName = 'binarisTestDeployFunction';

async function withEndpoint(endpoint, fn) {
  const oldEndpoint = process.env.BINARIS_DEPLOY_ENDPOINT;
  process.env.BINARIS_DEPLOY_ENDPOINT = endpoint;
  try {
    await fn();
  } finally {
    process.env.BINARIS_DEPLOY_ENDPOINT = oldEndpoint;
  }
}

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
    .post(`/v3/code/${testAccountId}`)
    .matchHeader('X-Binaris-Api-Key', testApiKey)
    .matchHeader('Content-Type', 'application/gzip')
    .reply(200, digestObj);

  deployMock
    .post(`/v3/conf/${testAccountId}/${testFuncName}`, testFuncConf)
    .matchHeader('X-Binaris-Api-Key', testApiKey)
    .reply(200, digestObj);

  deployMock
    .post(`/v3/tag/${testAccountId}/${testFuncName}/latest`, digestObj)
    .matchHeader('X-Binaris-Api-Key', testApiKey)
    .reply(200, { status: 'ok' });

  await withEndpoint(deployEndpoint, async () => {
    const response = await deploy(testAccountId, testFuncName, testApiKey,
      testFuncConf, t.context.fakeTarFileName);
    t.deepEqual({ status: 'ok' }, response);
  });
});

test.serial('Test deploy with bad key (bad-path)', async (t) => { // eslint-disable-next-line global-require
  const deploy = require('../deploy');

  const deployEndpoint = generate(10);

  const someBadKey = generate(APIKeyLength);
  // eslint-disable-next-line no-unused-vars
  const deployMock = nock(`https://${deployEndpoint}`)
    .post(`/v3/code/${testAccountId}`)
    .matchHeader('X-Binaris-Api-Key', someBadKey)
    .matchHeader('Content-Type', 'application/gzip')
    .reply(403, { errorCode: 'ERR_BAD_KEY' });

  await withEndpoint(deployEndpoint, async () => {
    await t.throwsAsync(deploy(testAccountId, testFuncName, someBadKey,
      testFuncConf, t.context.fakeTarFileName),
      'Error: Invalid API key');
  });
});

test.serial('Test deploy with no backend (bad-path)', async (t) => {
  // eslint-disable-next-line global-require
  const deploy = require('../deploy');
  await withEndpoint('invalidbinaris.endpoint', async () => {
    await t.throwsAsync(deploy(testAccountId, testFuncName, testApiKey,
      testFuncConf, t.context.fakeTarFileName),
      'Error: getaddrinfo ENOTFOUND invalidbinaris.endpoint invalidbinaris.endpoint:443');
  });
});

