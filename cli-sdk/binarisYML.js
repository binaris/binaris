// this is just a convenience/wrapper for the individual commands
const fs = require('mz/fs');

const path = require('path');

const yaml = require('js-yaml');

const log = require('./logger');

const binarisConfFile = 'binaris.yml';
const funcStr = 'functions';
const entryStr = 'entrypoint';
const fileStr = 'file';

// this loads the binaris.yml file from the users current
// function directory. If it does not exist in the expected
// location the object returned will have a false 'success'
// field and a associated error field
const loadBinarisConf = async function loadBinarisConf(funcDirPath) {
  try {
    const fullYAMLPath = path.join(funcDirPath, binarisConfFile);
    const binarisConf = yaml.safeLoad(await fs.readFile(fullYAMLPath, 'utf8'));
    return binarisConf;
  } catch (err) {
    log.debug(err);
    throw new Error(`${funcDirPath} does not contain a valid binaris function!`);
  }
};

const saveBinarisConf = async function saveBinarisConf(funcDirPath, binarisConf) {
  const fullYAMLPath = path.join(funcDirPath, binarisConfFile);
  const confString = yaml.dump(binarisConf);
  await fs.writeFile(fullYAMLPath, confString, 'utf8');
};

// this loads the JS file from the users current
// function directory. It determines the correct name of the
// file by inspecting the functions package.json main field.
// If it does not exist in the expected location the object
// returned will have a false 'success' field and a
// associated error field
const readFunctionJS = async function readFunctionJS(funcDirPath, JSFileName) {
  const fullJSPath = path.join(funcDirPath, JSFileName);
  const JSFile = await fs.readFile(fullJSPath, 'utf8');
  return JSFile;
};

const getFunctionsSection = function getFunctionsSection(binarisConf) {
  // ensure configuration has the expected field
  if (!Object.prototype.hasOwnProperty.call(binarisConf, funcStr)) {
    throw new Error(`Your ${binarisConfFile} did not contain a require field: <${funcStr}>`);
  }
  const funcSection = binarisConf[funcStr];
  return funcSection;
};

// Assumes a single function.
const getFuncName = function getFuncName(binarisConf) {
  const funcSection = getFunctionsSection(binarisConf);
  const funcKeys = Object.keys(funcSection);
  // There's not yet support for multiple functions per yaml
  // The first (and only) entry is used
  if (funcKeys.length !== 1) {
    throw new Error(`${binarisConfFile}: ${funcStr}, only one function supported!`);
  }
  const funcName = funcKeys[0];
  return funcName;
};

const checkFuncConf = async function checkFuncConf(funcConf, funcDirPath) {
  if (!Object.prototype.hasOwnProperty.call(funcConf, fileStr)) {
    throw new Error(`${binarisConfFile}: function missing required field: <${fileStr}>`);
  }
  if (!Object.prototype.hasOwnProperty.call(funcConf, entryStr)) {
    throw new Error(`${binarisConfFile}: function missing required field: <${entryStr}>`);
  }
  await readFunctionJS(funcDirPath, funcConf.file);
};

// Assumes a single function.
const getFuncConf = function getFuncConf(binarisConf, funcName) {
  const funcSection = getFunctionsSection(binarisConf);
  // ensure configuration has the correct function
  if (!Object.prototype.hasOwnProperty.call(funcSection, funcName)) {
    throw new Error(`${binarisConfFile}: function missing: ${funcName}`);
  }
  const funcConf = funcSection[funcName];
  return funcConf;
};

const addFuncConf = function addFuncConf(binarisConf, funcName, funcConf) {
  const funcSection = getFunctionsSection(binarisConf);
  if (Object.prototype.hasOwnProperty.call(funcSection, funcName)) {
    throw new Error(`${binarisConfFile}: function already exists: ${funcName}`);
  }
  funcSection[funcName] = JSON.parse(JSON.stringify(funcConf));
};

const delFuncConf = function delFuncConf(binarisConf, funcName) {
  const funcSection = getFunctionsSection(binarisConf);
  if (!Object.prototype.hasOwnProperty.call(funcSection, funcName)) {
    throw new Error(`${binarisConfFile}: missing function: ${funcName}`);
  }
  delete funcSection[funcName];
};

module.exports = {
  loadBinarisConf,
  saveBinarisConf,
  getFuncName,
  getFuncConf,
  checkFuncConf,
  addFuncConf,
  delFuncConf,
};
