'use strict';

const session = {
  key: 'cae:sess',
  maxAge: 86400000,
  autoCommit: true,
  overwrite: true,
  httpOnly: true,
  signed: true,
  rolling: false,
  renew: false,
};

class Config {

  constructor(opts = {}) {
    this._opts = opts;
    this._init_();
    this.injectProp();
    this._opts.session = { ...session,
      ...this.get('session') || {}
    };
  }

  _init_() {}

  injectProp() {
    const self = this;
    const cfgs = this._opts;
    if (!cfgs) return;
    Object.keys(cfgs).forEach(field => {
      const cfg = cfgs[field];
      Object.defineProperty(self, field, {
        value: cfg,
        enumerable: true
      });
    });
  }

  get options() {
    return this._opts;
  }

  get(field) {
    return this[field];
  }

  set(field, value) {
    Object.defineProperty(this, field, {
      value,
      enumerable: true,
    });
  }

}

module.exports = Config;
