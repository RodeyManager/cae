/**
 * 模板类
 * 默认使用的是 nunjucks: https: //mozilla.github.io/nunjucks/
 */

// 转换器
//  exports.viewConverter = {
//    图片src转base64输出,
//    maxCache 最大缓存数
//    limit 最大支持图片的大小 单位 bytes
//    image: {
//      maxCache: 100,
//      limit: 5000,
//    },
//    template: {
//      maxCache: 10,
//      limit: 3000,
//    },
//    ...
//  };

'use strict';

const path = require('path');
const fs = require('fs');
const is = require('is-type-of');
const isPlainObject = require('is-plain-object');
const LRU = require('lru-cache');
const htmlMinifier = require('html-minifier');
const {
  forEach
} = require('lodash/collection');
const {
  logs
} = require('../util');
const {
  APPLICATION_EVENT
} = require('../util/event_types');


const imageConverter = {
  maxCache: 0,
  limit: 10 * 1024,
  test: '.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$'
};
const templateConverter = {
  maxCache: 60,
  limit: 500 * 1024,
  test: '.(html|tpl|ejs|njk)$'
};
const styleConverter = {
  maxCache: 0,
  limit: 500 * 1024,
  test: '.(css|less|scss|styl)$'
};
const scriptConverter = Object.assign({}, styleConverter, {
  test: '.(js|jsx|ts)$'
});
const converters = {
  'image': imageConverter,
  'style': styleConverter,
  'script': scriptConverter,
  'template': templateConverter
};


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
    this.initConverter();
    // this.app.on(APPLICATION_EVENT.AFRER, (app) => {
    //   this.precompile();
    // });
    this.precompile();
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

  _gnConverter(name, cvt) {
    const converter = this.app.config.get('viewConverter') || {};

    const cvtName = `${name}Converter`;
    const cacheName = `${name}Cache`;
    this[cvtName] = Object.assign({}, cvt, converter[name] || {});
    const currentCvt = this[cvtName];

    this[cacheName] = new LRU(currentCvt.maxCache);

    if (!currentCvt.test) {
      currentCvt.test = new RegExp('*', 'i');
    }
    if (is.string(currentCvt.test)) {
      currentCvt.test = new RegExp(currentCvt.test, 'i');
    }
  }

  initConverter() {
    forEach(converters, (value, key) => {
      this._gnConverter(key, value);
    });
  }

  /**
   * 模板渲染
   * @param {String} view 模板路径
   * @param {Object} data 模板数据
   * @param {Object|Function} ctx  Koa ctx 或者 回调函数
   * @param {Object} opts 渲染可选项
   * @return {String}
   */
  render(view, data, ctx = {}, opts = {}) {

    if (!this._isKoaCtx(ctx)) {
      opts = ctx;
      ctx = {};
    }

    let file, isExists = false,
      body;
    if (is.array(this.config.ext)) {
      let index = 0;
      while (!isExists && index < this.config.ext.length) {
        file = path.resolve(this._path, view) + this.config.ext[index++];
        isExists = fs.existsSync(file);
      }
    } else {
      file = path.resolve(this._path, view) + (this.config.ext || '.html');
      isExists = fs.existsSync(file);
    }

    if (!isExists) {
      return this.renderError(404, ctx);
    }
    body = this.renderFile(file, data, opts);

    return this._renderResponse(body, ctx);
  }

  renderError(code = 404, ctx) {
    const body = this.render(`error/${code}`) || 'Not fount the page';
    return this._renderResponse(body, ctx);
  }

  renderFile(file, data, opts = {}) {

    if (!fs.existsSync(file)) return null;

    let content = '';
    if (this.templateCache.get(file)) {
      // console.log('load cache ', file);
      content = this.templateCache.get(file);
    } else {
      content = fs.readFileSync(file, 'utf8') || '';
      const fileSize = fs.statSync(file).size;
      if (this.templateConverter.maxCache > 0 && fileSize <= this.templateConverter.limit) {
        content = this._htmlMini(content);
        this.templateCache.set(file, content);
      }
    }
    content = this.renderString(content, data, opts);
    return content;
  }

  renderString(str, data, opts = {}) {
    const renderString = this.engine['renderString'] || this.engine['render'];
    let body = renderString(str, data, opts);
    return body;
  }

  _renderResponse(body, ctx = {}) {
    if (ctx && is.function(ctx)) return ctx(body);
    if (this._isKoaCtx(ctx)) return ctx.body = body;
    return body;
  }

  /**
   * 模板预编译 default true
   * @param {*} precompileConfig
   */
  precompile(precompileConfig = {}) {
    if (this.app.config.get('viewConverter') === false) return;
    this._precompile_worker();
  }

  _getInpArgs() {
    const args = {};
    forEach(converters, (value, key) => {
      const name = `${key}Converter`;
      const cvt = this[name];
      args[name] = Object.assign(cvt, {
        test: cvt.test ? cvt.test.source : '*'
      });
    });
    return args;
  }

  /**
   * new worker compile
   */
  _precompile_worker() {
    const workerFarm = require('worker-farm');
    let viewPrecompileWorker = workerFarm({
      workerOptions: {
        env: process.env.NODE_ENV
      },
      maxConcurrentWorkers: 1
    }, require.resolve('../worker/view_precompile'));
    const viewName = this.name || '';

    const viewInp = {
      viewName,
      exts: this.config.ext,
      viewPath: this._path,
      staticPath: this.app.staticPath,
      ...this._getInpArgs()
    };

    // logs.warn(`[${viewName}] precompile templates begin ---<<<`);

    viewPrecompileWorker(viewInp, (err, result) => {
      if (err) return logs.error(err);

      // imageCache, styleCache, scriptCache, templateCache
      forEach(converters, (value, key) => {
        const name = `${key}Cache`;
        forEach(result[name].list, (v, k) => this[name].set(k, v));
      });

      workerFarm.end(viewPrecompileWorker);
      viewPrecompileWorker = null;

      // logs.info(JSON.stringify({
      //   template_file: this.templateCache.length,
      //   image_file: this.imageCache.length,
      //   style_file: this.styleCache.length,
      //   script_file: this.scriptCache.length
      // }, null, 0));

      // logs.warn(`[${viewName}] precompile templates end ---<<<`);

      this.app.emit(APPLICATION_EVENT.VIEW_COMPILE_COMPLETE);
    });
  }

  _htmlMini(content) {
    return htmlMinifier.minify(content, {
      minifyCSS: true,
      minifyJS: true
    });
  }

  _isKoaCtx(ctx) {
    return isPlainObject(ctx) && ctx.req && ctx.res && ctx.socket;
  }

}

module.exports = View;
