const fs = require('fs');
const path = require('path');
const targz = require('targz');
const urljoin = require('urljoin');
const request = require('request');

const util = require('../shared/util');
const log = require('../shared/logger');

const funcJSONPath = 'function.json';
const binarisDir = '.binaris/';

const ignoredTarFiles = ['node_modules', '.git', '.binaris', 'binaris.yml'];

// TODO: ensure that this is configured in a better way, having a single
// variable in the deploy file is inadequate
const publishEndpoint =
  process.env.BINARIS_PUBLISH_ENDPOINT || 'api-staging.binaris.io:11011';

// creates our hidden .binaris directory in the users function
// directory if it doesn't already exist
const genBinarisDir = function genBinarisDir(genPath) {
  try {
    const fullPath = path.join(genPath, binarisDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }
  } catch (err) {
    log.debug(err);
    throw new Error('Unable to generate .binaris hidden directory!');
  }
};

const cleanupFile = function cleanupFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (err) {
    log.debug(err);
    return false;
  }
};

const writeFuncMetadata = function writeFuncMetadata(object, funcPath) {
  try {
    fs.writeFileSync(path.join(funcPath, funcJSONPath),
      JSON.stringify(object, null, 2), 'utf8');
  } catch (err) {
    log.debug(`failed to write ${funcJSONPath} file in function dir`, err);
    throw new Error(`Failed to write ${funcJSONPath} file in function dir!`);
  }
};

const genTarBall = async function genTarBall(dirToTar, dest, ignoredFiles) {
  // our CLI pipeline is forced and intentionally synchronous,
  // this wrapper is to ensure that vanilla cbs don't interfere
  // with the order of things
  const tarPromise = new Promise((resolve, reject) => {
    targz.compress({
      src: dirToTar,
      dest,
      tar: {
        ignore: (name) => {
          if (ignoredFiles.indexOf(name) > -1) {
            return true;
          }
          return false;
        },
      },
    }, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });

  const success = await tarPromise;
  return success;
};

const uploadFunction = async function uploadFunction(tarPath, conf, publishURL) {
  const options = {
    url: publishURL,
    qs: conf,
  };
  try {
    const uploadPromise = new Promise((resolve, reject) => {
      fs.createReadStream(tarPath)
        .pipe(request.post(options, (uploadErr, uploadResponse) => {
          if (uploadErr) {
            reject(uploadErr);
          } else {
            resolve(uploadResponse);
          }
        }));
    });
    return await uploadPromise;
  } catch (err) {
    log.debug(err);
    throw new Error('Failed to upload function tar file to Binaris backend');
  }
};

// TODO: thing that returns metadata
const deploy = async function deploy(deployPath) {
  const fullIgnorePaths = [];
  ignoredTarFiles.forEach((entry) => {
    fullIgnorePaths.push(path.join(deployPath, entry));
  });
  const binarisConf = util.loadBinarisConf(deployPath);
  const funcName = util.getFuncName(binarisConf);
  const funcConf = util.getFuncConf(binarisConf, funcName);
  log.debug('funcConf is', funcConf);
  util.checkFuncConf(funcConf, deployPath);
  genBinarisDir(deployPath);
  writeFuncMetadata(funcConf, deployPath);
  try {
    const funcTarPath = path.join(deployPath, binarisDir, `${funcName}.tgz`);
    await genTarBall(deployPath, funcTarPath, fullIgnorePaths);
    const endpoint = urljoin(`http://${publishEndpoint}/function`, funcName);
    const response = await uploadFunction(funcTarPath, funcConf, endpoint);
    cleanupFile(path.join(deployPath, funcJSONPath));
    if (response.statusCode !== 200) {
      log.debug(response);
      throw new Error('Function was not deployed successfully, check logs for more details');
    }
    return response.body;
  } catch (err) {
    cleanupFile(path.join(deployPath, funcJSONPath));
    throw err;
  }
};

module.exports = deploy;
