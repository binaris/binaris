#!/usr/bin/env node

const minNodeVersion = '8.0.0';
const semver = require('semver');

if (!semver.gte(process.version, minNodeVersion)) {
  console.log(`Unfortunately, at least node version ${minNodeVersion} is required. You are running version ${process.version}`);
  process.exit(1);
}

require('./cli');
