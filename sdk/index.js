'use strict';

// this is just a convenience/wrapper for the individual commands
const auth = require('./auth');
const deploy = require('./deploy');
const invoke = require('./invoke');
const list = require('./list');
const logs = require('./logs');
const remove = require('./remove');
const perf = require('./perf');
const stats = require('./stats');

module.exports = {
  auth,
  deploy,
  invoke,
  list,
  logs,
  perf,
  remove,
  stats,
};
