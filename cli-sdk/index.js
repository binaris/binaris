const init = require('./init');
const invoke = require('./invoke');
const deploy = require('./deploy');
const remove = require('./remove');
const log = require('./logger');

module.exports = {
  log,
  init,
  invoke,
  deploy,
  remove,
};
