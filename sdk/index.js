// this is just a convenience/wrapper for the individual commands
const deploy = require('./deploy');
const invoke = require('./invoke');
const remove = require('./remove');

module.exports = {
  deploy,
  invoke,
  remove,
};
