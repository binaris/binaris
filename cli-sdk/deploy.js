const fse = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const { compress } = require('targz');

const tgzCompress = promisify(compress);

const { getApiKey } = require('./userConf');
const { deploy } = require('../sdk');
const log = require('./logger');

const binarisDir = '.binaris/';
const ignoredTarFiles = ['.git', '.binaris', 'binaris.yml'];

// creates hidden .binaris directory in the users function
// directory if it doesn't already exist
const genBinarisDir = async function genBinarisDir(genPath) {
  try {
    const fullPath = path.join(genPath, binarisDir);
    await fse.mkdirp(fullPath);
    return fullPath;
  } catch (err) {
    log.debug(err);
    throw new Error(`Error creating working directory: ${binarisDir}`);
  }
};

// simply handles the process of deploying a function and its
// associated metadata to the Binaris cloud
const deployCLI = async function deployCLI(funcName, funcPath, funcConf) {
  // this should throw an error when it fails
  const fullIgnorePaths = ignoredTarFiles.map(file => path.join(funcPath, file));
  const funcTarPath = path.join(await genBinarisDir(funcPath), `${funcName}.tgz`);
  // create the tar repr of the Binaris function
  await tgzCompress({
    src: funcPath,
    dest: funcTarPath,
    tar: {
      ignore: name => fullIgnorePaths.includes(name),
    },
  });
  const apiKey = await getApiKey();
  await deploy(apiKey, funcName, funcConf, funcTarPath);
};

module.exports = deployCLI;
