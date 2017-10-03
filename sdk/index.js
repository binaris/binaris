// this is just a convenience/wrapper for the individual commands
const deploy = require('./deploy');
const remove = require('./remove');
const invoke = require('./invoke');

module.exports = {
  deploy,
  remove,
  invoke,
};
