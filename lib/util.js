'use strict';

const path = require('path');
const convert = require('koa-convert');
const is = require('is-type-of');
const isPlainObject = require('is-plain-object');
const rrdir = require('recursive-readdir');
const Sequelize = require('sequelize');
const {
  capitalize
} = require('lodash/string');
const {
  forEach
} = require('lodash/collection');

const createSequelize = (...args) => {
  return new Sequelize(...args);
};

const middleware = (fn) => {
  return is.generatorFunction(fn) ? convert(fn) : fn;
};

/**
 * 遍历获取文件列表
 * @param {String} dir
 * @return {Promise}
 */
const readFilesAsDir = async function (dir) {
  const ignore = (file, stats) => {
    return stats.isDirectory() && path.extname(file) !== 'js';
  }
  return await rrdir(dir, [ignore]);
};

/**
 * @param {Object} target
 * @param {String} prop
 * @param {String} dir
 */
const injectPropsAsDir = async function (target, prop, dir) {
  const files = await readFilesAsDir(dir);
  injectPropsAsFiles(target, prop, files);
};

/**
 * 根据文件，给对象注入对应的属性（类集合）
 * @param {Object} target
 * @param {String} prop
 * @param {Array} files
 */
const injectPropsAsFiles = (target, prop, files) => {
  if (is.array(files)) {
    files.forEach(file => {
      const {
        name
      } = path.parse(file);
      const caller = require(file);
      if (is.class(caller) || is.function(caller)) {
        target[prop][name] = caller;
      }
    });
  } else {
    target[prop] = files;
  }
};

const definedPorp = (obj, target, cb) => {
  forEach(obj, (_class, _prop) => {
    Object.defineProperty(obj, _prop, {
      get() {
        const ins = new _class(target);
        is.function(cb) && cb.apply(target, [ins, _prop]);
        return ins;
      },
      enumerable: true
    });
  });
};

module.exports = {
  createSequelize,
  middleware,
  readFilesAsDir,
  injectPropsAsDir,
  injectPropsAsFiles,
  definedPorp,
  isPlainObject,
};
