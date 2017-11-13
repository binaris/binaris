// this is just a convenience/wrapper for the individual commands
const auth = require('./auth');
const deploy = require('./deploy');
const invoke = require('./invoke');
const logs = require('./logs');
const remove = require('./remove');

module.exports = {
  auth,
  deploy,
  invoke,
  logs,
  remove,
};
