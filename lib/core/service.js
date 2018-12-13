'use strict';

class BaseService {

  constructor(app = {}) {
    this.app = app;
    this.model = null;
    this.V = this.views = app.views;
    this.M = this.models = app.models;
    this.S = this.services = app.services;
    this.P = this.providers = app.provider;
    this._init_();
  }

  _init_() {}


}

module.exports = BaseService;
