/**
 * 模板类
 * 默认使用的是 nunjucks: https: //mozilla.github.io/nunjucks/
 */

// 转换器
//  exports.converter = {
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
const {
  forEach
} = require('lodash/collection');
const {
  logs
} = require('../util');
const base64Img = require('base64-img');
const LRU = require('lru-cache');
const htmlMinifier = require('html-minifier');
const htmlAutoprefixer = require('html-autoprefixer');

const imageConverter = {
  maxCache: 50,
  limit: 5 * 1024
};
const templateConverter = {
  maxCache: 50,
  limit: 500 * 1024
};
const styleConverter = {
  maxCache: 10,
  limit: 500 * 1024
};
const scriptConverter = styleConverter;


class View {
  constructor(config = {}, app) {
    this.config = config;
    this.app = app;
    this.engine = config.engine;
    this.ctx = app.ctx;
    this.resBody = null;
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

  initConverter() {
    const converter = this.app.config.get('converter') || {};

    this.imgConverter = Object.assign(imageConverter, converter['image'] || {});
    this.templateConverter = Object.assign(templateConverter, converter['template'] || {});
    this.styleConverter = Object.assign(styleConverter, converter['style'] || {});
    this.scriptConverter = Object.assign(scriptConverter, converter['script'] || {});


    this.imageCache = new LRU(this.imgConverter.maxCache);
    this.templateCache = new LRU(this.templateConverter.maxTemplateCache);
    this.styleCache = new LRU(this.styleConverter.maxCache);
    this.scriptCache = new LRU(this.scriptConverter.maxCache);
  }

  /**
   * 模板渲染
   * @param {String} view 模板路径
   * @param {Object} data 模板数据
   * @param {Object|Function} opts 渲染可选项
   * @param {Function} cb   回调
   * @return {String}
   */
  render(view, data, opts = {}, cb) {
    if (is.function(opts)) {
      cb = opts;
      opts = {};
    }
    let file;
    if (is.array(this.config.ext)) {
      let isExists = false;
      let index = 0;
      while (!isExists && index < this.config.ext.length) {
        file = path.resolve(this._path, view) + this.config.ext[index++];
        isExists = fs.existsSync(file);
      }
      if (!isExists) return undefined;
    } else {
      file = path.resolve(this._path, view) + (this.config.ext || '.html');
    }
    const body = this.renderFile(file, data, opts);

    if (cb && is.function(cb)) return cb(body);
    return body;
  }

  renderFile(file, data, opts = {}) {

    if (!fs.existsSync(file)) {
      return undefined;
    }

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

  renderString(str, data, opts) {
    const renderString = this.engine['renderString'] || this.engine['render'];
    let body = renderString(str, data, opts);
    if (!this.app.config.viewPrecompile) {
      body = this._convert(body);
      body = this._htmlMini(body);
    }
    return body;
  }

  // 预编译缓存
  precompile(precompileConfig = {}) {
    if (!this.app.config.get('viewPrecompile')) return;
    const rrdir = require('recursive-readdir');

    const viewPath = path.resolve(this.app.root, 'app/view');

    rrdir(viewPath).then(files => {
      files = files.filter(file => {
        const {
          ext
        } = path.parse(file);
        return is.array(this.config.ext) && this.config.ext.indexOf(ext) > -1 || this.config.ext === ext;
      });

      logs.warn(`[${this.name}] precompile templates start ->`);

      for (let i = 0; i < files.length; ++i) {
        if (i > this.templateConverter.maxCache) break;
        const file = files[i];
        const stats = fs.statSync(file);
        if (stats && stats.size > this.templateConverter.limit) continue;
        let content = fs.readFileSync(file, 'utf8');
        content = this._htmlMini(content);
        content = this._convert(content);
        this.templateCache.set(file, content);
      }
      logs.info(JSON.stringify({
        template_file: this.templateCache.length,
        image_file: this.imageCache.length,
        style_file: this.styleCache.length,
        script_file: this.scriptCache.length
      }, null, 2));
      logs.warn(`[${this.name}] precompile templates end -<`);

    });
  }

  _convert(body = '') {
    body = this._convertImage(body);
    body = this._convertStyle(body);
    body = this._convertScript(body);
    return body;
  }

  _convertImage(body = '') {
    if (this.imageCache.length >= this.imgConverter.maxCache) return body;

    const imgRegx = /(<img[\s\S]*?\s+)src=[\"\']([^\"\']+?)[\"\']([^>]*>)?/g;

    body = body.replace(imgRegx, this._transReplaceImage.bind(this))
    return body;
  }

  _convertStyle(body = '') {

    const linkRegx = /(<link[\s\S]*?\s+)href=[\"\']([^\"\']+?)[\"\']([^>]*>)?/g;
    const urlRegx = /(url)\([\"\']?([^\"\'\)]*?)[\"\']?\)([^;]*;)?/g;

    body = body.replace(linkRegx, (m, prefix, src, suffix) => {
      src = src.split('?')[0];
      if (this.styleCache.get(src)) return this.styleCache.get(src);
      if (/^about:/.test(src)) return m;

      const filePath = path.join(this.app.staticPath, src);
      const info = path.parse(filePath);
      let file;
      try {
        file = fs.statSync(filePath);
      } catch (e) {}

      if (!file || file.size > this.styleConverter.limit || (this.styleConverter.test && !this.styleConverter.test.test(info.ext))) {
        return m;
      }

      let content = fs.readFileSync(filePath, 'utf8');
      if (content) {
        content = `<style>${content}</style>`;
        content = htmlAutoprefixer.process(content);
        this.styleCache.set(src, content);
        return content;
      } else {
        return m;
      }
    }).replace(urlRegx, this._transReplaceImage.bind(this));
    return body;

  }

  _convertScript(body = '') {

    const linkRegx = /(<script[\s\S]*?\s+)src=[\"\']([^\"\']+?)[\"\']([^>]*>)?/g;

    body = body.replace(linkRegx, (m, prefix, src, suffix) => {
      src = src.split('?')[0];
      if (this.scriptCache.get(src)) return this.scriptCache.get(src);
      if (/^about:/.test(src)) return m;

      const filePath = path.join(this.app.staticPath, src);
      const info = path.parse(filePath);
      let file;
      try {
        file = fs.statSync(filePath);
      } catch (e) {}

      if (!file || file.size > this.scriptConverter.limit || (this.scriptConverter.test && !this.scriptConverter.test.test(info.ext))) {
        return m;
      }

      let content = fs.readFileSync(filePath, 'utf8');
      if (content) {
        content = `<script>${content}</script>`;
        this.scriptCache.set(src, content);
        return content;
      } else {
        return m;
      }


    });
    return body;

  }

  _transReplaceImage(m, prefix, src, suffix) {
    src = src.split('?')[0];
    if (this.imageCache.get(src)) return this.imageCache.get(src);
    if (/^data:image/.test(src)) return m;

    const filePath = path.join(this.app.staticPath, src);
    const info = path.parse(filePath);
    let file;
    try {
      file = fs.statSync(filePath);
    } catch (e) {}

    if (!file || file.size > this.imgConverter.limit || (this.imgConverter.test && !this.imgConverter.test.test(info.ext))) {
      return m;
    }

    const base64Data = base64Img.base64Sync(filePath);
    let resetImage = '';
    if (prefix.trim() === 'url') {
      resetImage = `${prefix}(${base64Data}) ${suffix}`;
    } else {
      resetImage = `${ prefix }src="${ base64Data }" ${ suffix }`;
    }
    this.imageCache.set(src, resetImage);
    return resetImage
  }

  _htmlMini(content) {
    return htmlMinifier.minify(content, {
      minifyCSS: true,
      minifyJS: true
    });
  }

}

module.exports = View;
