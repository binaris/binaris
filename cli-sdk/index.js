
const { genBinarisDir,
  genTarBall, loadBinarisConf, saveBinarisConf,
  getFuncName, getFuncConf, checkFuncConf,
  addFuncConf, delFuncConf } = require('./util');

const init = require('./init');
const invoke = require('./invoke');
const deploy = require('./deploy');

module.exports = {
  genBinarisDir,
  genTarBall,
  loadBinarisConf,
  saveBinarisConf,
  getFuncName,
  getFuncConf,
  checkFuncConf,
  addFuncConf,
  delFuncConf,
  init,
  invoke,
  deploy,
};
