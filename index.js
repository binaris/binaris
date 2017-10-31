#!/usr/bin/env node

const minNodeVersion = '8.0.0';
const semver = require('semver');

if (!semver.gte(process.version, minNodeVersion)) {
  // eslint-disable-next-line no-console
  console.log(`Unfortunately, at least node version ${minNodeVersion} is required. You are running version ${process.version}`);
  process.exit(1);
}

// no await/async since this file needs to support lower versions
// eslint-disable-next-line global-require
Promise.resolve(require('./cli')(process.argv)).then((resolve) => {
  process.exit(resolve);
});
