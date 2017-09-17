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
const genBinarisDir = async function genBinarisDir(genPath) {
  try {
    const fullPath = path.join(genPath, binarisDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }
  } catch (err) {
    log.debug(err);
    throw new Error('unable to generate .binaris hidden directory!');
  }
};

const cleanupFile = async function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (err) {
    log.debug(err);
    return false;
  }
};

const writeFuncJSON = async function writeFuncJSON(entryPoint, funcPath) {
  const funcJSON = {
    entryPoint,
  };
  try {
    fs.writeFileSync(path.join(funcPath, funcJSONPath),
      JSON.stringify(funcJSON, null, 2), 'utf8');
  } catch (err) {
    log.debug(err);
    throw new Error('failed to write function.json file in function dir!');
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

const uploadFuncTar = async function uploadFuncTar(tarPath, publishURL) {
  const options = {
    url: publishURL,
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
    throw new Error('failed to upload function tar file to Binaris backend');
  }
};

// TODO: thing that returns metadata
const deploy = async function deploy(data) {
  const deployPath = data.functionPath;
  let funcTarPath;
  let funcJSONCleanup = false;
  const fullIgnorePaths = [];
  ignoredTarFiles.forEach((entry) => {
    fullIgnorePaths.push(path.join(deployPath, entry));
  });
  try {
    // although we only take the binaris.yml and package.json file
    // in our destructuring we still need to run loadAllFiles
    // because it verifies that we have a correct function dir setup
    // I should probably separate this
    const { binarisYML, packageJSON } =
      await util.loadAllFiles(deployPath).catch(() => {
        throw new Error('your current directory does not contain a valid binaris function!');
      });
    const metadata = await util.getFuncMetadata(binarisYML, packageJSON);
    await genBinarisDir(deployPath);
    await writeFuncJSON(metadata.entryPoint, deployPath);
    funcJSONCleanup = true;
    funcTarPath = path.join(deployPath, binarisDir, `${metadata.name}.tgz`);
    await genTarBall(deployPath, funcTarPath, fullIgnorePaths);
    const endpoint = urljoin(`http://${publishEndpoint}/function`, metadata.name);
    const response = await uploadFuncTar(funcTarPath, endpoint);
    await cleanupFile(path.join(deployPath, funcJSONPath));
    funcJSONCleanup = false;
    if (response.statusCode !== 200) {
      log.debug(response);
      throw new Error('function was not deployed successfully, check logs for more details');
    }
    return response;
  } catch (err) {
    if (funcJSONCleanup) {
      await cleanupFile(path.join(deployPath, funcJSONPath));
    }
    throw err;
  }
};

module.exports = deploy;
