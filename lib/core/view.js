/**
 * 模板类
 * 默认使用的是 nunjucks: https: //mozilla.github.io/nunjucks/
 */

'use strict';

const path = require('path');
const fs = require('fs');
const nunjucks = require('nunjucks');
const {
  forEach
} = require('lodash/collection');

class View {
  constructor(config = {}, app) {
    this.config = config;
    this.app = app;
    this.engine = config.engine;
    this.ctx = app.ctx;
    this.name = this.config.name;
    this._init_();
  }

  _init_() {
    const config = this.config;
    this.engine = config.engine || this.app.viewEngine || nunjucks;
    delete config.engine;
    this._path = path.isAbsolute(config.path) ? config.path : path.resolve(this.app.root, config.path || 'app/view');
    this.configure(this._path, config);
  }

  configure(path, opts) {
    if (this.engine.configure)
      this.engine.configure(path || this._path, opts);
    else {
      forEach(opts, (val, prop) => {
        this.engine[prop] = val;
      });
    }
  }

  render(view, data, opts = {}) {
    const file = path.resolve(this._path, view) + (this.config.ext || '.html');
    const body = this.renderFile(file, data, opts);
    return body;
  }

  renderFile(file, data, opts = {}) {
    if (this.name === 'nunjucks') {
      return this.engine.render(file, data);
    }

    if (this.engine == require('ejs')) {
      this.engine.async = true;
      return this.engine.renderFile(file, data, opts);
    }

    const exists = fs.existsSync(file);
    if (!exists) {
      return undefined;
    }

    let content = fs.readFileSync(file, 'utf8') || '';
    content = this.renderString(content, data, opts);
    return content;
  }

  renderString(str, data, opts) {
    const renderString = this.engine['render'] || this.engine['renderString'];
    const body = renderString(str, data, opts);
    return body;
  }

}

module.exports = View;
