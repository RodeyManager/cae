'use strict';
const {
  forEach
} = require('lodash/collection');

let instance = null;

class BaseModel {
  constructor(app) {
    this.app = app;
    this._mysql = null;
    this._mongodb = null;
    this._orm = {};

    if (instance && instance instanceof BaseModel) {
      return instance;
    } else {
      instance = this;
    }
  }

  get mysql() {
    return this._mysql;
  }
  set mysql(v) {
    this._mysql = v;
  }

  get mongodb() {
    return this._mongodb;
  }
  set mongodb(v) {
    this._mongodb = v;
  }

  get orm() {
    return this._orm;
  }
  set orm(v) {
    this._orm = v;
  }

}

module.exports = BaseModel;