
const { attemptJSONParse, genBinarisDir,
  genTarBall, loadBinarisConf, saveBinarisConf,
  getFuncName, getFuncConf, checkFuncConf,
  addFuncConf, delFuncConf } = require('./shared/util');

const log = require('./shared/logger');
const init = require('./init/init');

module.exports = {
  attemptJSONParse,
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
  log,
};
