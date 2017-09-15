const fs = require('fs');
const path = require('path');
const targz = require('targz');

const util = require('../shared/util');
const logger = require('../shared/loggerInit');

const funcJSONPath = 'function.json';
const binarisDir = '.binaris/';

const ignoredTarFiles = ['node_modules', '.git', '.binaris', 'binaris.yml'];

// creates our hidden .binaris directory in the users function
// directory if it doesn't already exist
const genBinarisDir = async function genBinarisDir(genPath) {
  try {
    const fullPath = path.join(genPath, binarisDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }
  } catch (err) {
    logger.binaris.debug(err);
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
    logger.binaris.debug(err);
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
    logger.binaris.debug(err);
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

// TODO: return a clear error when in bad func dir
// also have thing that returns metadata

const deploy = async function (data) {
  const deployPath = data.functionPath;
  let funcTarPath;
  let funcJSONCleanup = false;
  const fullIgnorePaths = [];
  ignoredTarFiles.forEach((entry) => {
    fullIgnorePaths.push(path.join(deployPath, entry));
  });
  try {
    const { packageJSON, binarisYML, JSFile } =
      await util.loadAllFiles(deployPath);
    const funcName = binarisYML.functionName;
    await genBinarisDir(deployPath);
    const entryPoint = await util.getFuncEntry(binarisYML);
    await writeFuncJSON(entryPoint, deployPath);
    funcJSONCleanup = true;
    funcTarPath = path.join(deployPath, binarisDir, `${funcName}.tgz`);
    await genTarBall(deployPath, funcTarPath, fullIgnorePaths);
    await cleanupFile(path.join(deployPath, funcJSONPath));
    funcJSONCleanup = false;
  } catch (err) {
    if (funcJSONCleanup) {
      await cleanupFile(path.join(deployPath, funcJSONPath));
    }
    throw err;
  }
};

module.exports = deploy;
