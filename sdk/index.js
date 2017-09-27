// this is just a convenience/wrapper for the individual commands
const deploy = require('./deploy/deploy');
const invoke = require('./invoke/invoke');

module.exports = {
  deploy,
  invoke,
};
