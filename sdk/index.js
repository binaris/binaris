// this is just a convenience/wrapper for the individual commands
const deploy = require('./deploy/deploy');
const invoke = require('./invoke/invoke');
const destroy = require('./destroy/destroy');
const help = require('./help/help');
const info = require('./info/info');
const login = require('./login/login');
const logout = require('./logout/logout');
const signup = require('./signup/signup');

module.exports = {
  deploy,
  invoke,
  destroy,
  help,
  info,
  login,
  logout,
  signup,
};
