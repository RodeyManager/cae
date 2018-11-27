'use strict';

class BaseService {

  constructor(app = {}) {
    this.app = app;
    this.model = null;
    this._init_();
  }

  _init_() {}


}

module.exports = BaseService;