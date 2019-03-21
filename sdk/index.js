'use strict';

// this is just a convenience/wrapper for the individual commands
const auth = require('./auth');
const deploy = require('./deploy');
const feedback = require('./feedback');
const invoke = require('./invoke');
const list = require('./list');
const logs = require('./logs');
const remove = require('./remove');
const perf = require('./perf');
const stats = require('./stats');
const triggers = require('./triggers');
const { forceRealm } = require('./config');

module.exports = {
  auth,
  deploy,
  feedback,
  invoke,
  list,
  logs,
  perf,
  remove,
  stats,
  triggers,
  forceRealm,
};
