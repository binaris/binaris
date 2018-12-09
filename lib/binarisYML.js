'use strict';

// this is just a convenience/wrapper for the individual commands
const fs = require('mz/fs');

const path = require('path');

const yaml = require('js-yaml');

const binarisConfFile = 'binaris.yml';
const funcStr = 'functions';
const entryStr = 'entrypoint';
const runtimeStr = 'runtime';
const fileStr = 'file';

// this loads the binaris.yml file from the users current
// function directory. If it does not exist in the expected
// location the object returned will have a false 'success'
// field and a associated error field
const loadBinarisConf = async function loadBinarisConf(funcDirPath) {
  const fullYAMLPath = path.join(funcDirPath, binarisConfFile);
  return yaml.safeLoad(await fs.readFile(fullYAMLPath, 'utf8'));
};

const saveBinarisConf = async function saveBinarisConf(funcDirPath, binarisConf) {
  const fullYAMLPath = path.join(funcDirPath, binarisConfFile);
  const confString = yaml.dump(binarisConf);
  await fs.writeFile(fullYAMLPath, confString, 'utf8');
};

const getFunctionsSection = function getFunctionsSection(binarisConf) {
  // ensure configuration has the expected field
  if (typeof binarisConf !== 'object' ||
      binarisConf === null ||
      !Object.prototype.hasOwnProperty.call(binarisConf, funcStr)) {
    throw new Error(`Your ${binarisConfFile} did not contain a require field: <${funcStr}>`);
  }
  const funcSection = binarisConf[funcStr];
  if (typeof funcSection !== 'object' ||
      funcSection === null) {
    throw new Error(`Your ${binarisConfFile} must contain a <${funcStr}> dictionary.`);
  }
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
  for (const section of [fileStr, entryStr, runtimeStr]) {
    if (!funcConf[section]) {
      throw new Error(`${binarisConfFile}: missing a required field <${section}>`);
    }
    if (typeof funcConf[section] !== 'string') {
      throw new Error(`${binarisConfFile}: field: <${section}> should be a string`);
    }
  }
  const fullPath = path.join(funcDirPath, funcConf[fileStr]);
  await fs.readFile(fullPath, 'utf8');
};

// Assumes a single function.
const getFuncConf = function getFuncConf(binarisConf, funcName) {
  const funcSection = getFunctionsSection(binarisConf);
  // ensure configuration has the correct function
  if (!Object.prototype.hasOwnProperty.call(funcSection, funcName)) {
    throw new Error(`Cannot find function '${funcName}' in ${binarisConfFile}`);
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
