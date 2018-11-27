'use strict';

class Database {
  constructor(config, app) {
    this.config = config;
    this.app = app;
    this._init_();
  }
  _init_() {}

  async connect() {}
  async destroye() {}
}

module.exports = Database;