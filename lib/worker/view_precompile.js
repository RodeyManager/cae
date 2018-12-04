'use strict';

/**
 * 模板预编译
 */

const rrdir = require('recursive-readdir');
const path = require('path');
const fs = require('fs');
const is = require('is-type-of');
const base64Img = require('base64-img');
const htmlMinifier = require('html-minifier');
const htmlAutoprefixer = require('html-autoprefixer');
const {
  logs
} = require('../util');
const Cache = require('../util/cache');


const templateCache = new Cache(0);
const imageCache = new Cache(0);
const styleCache = new Cache(0);
const scriptCache = new Cache(0);


module.exports = (view, callback) => {

  const {
    exts,
    viewName,
    imageConverter,
    styleConverter,
    scriptConverter,
    templateConverter,
    viewPath
  } = view;

  templateCache.maxLength = templateConverter.maxLength;
  imageCache.maxLength = imageConverter.maxLength;
  styleCache.maxLength = styleConverter.maxLength;
  scriptCache.maxLength = scriptConverter.maxLength;

  // logs.warn(`[${viewName}] precompile templates start --->>>`);

  rrdir(viewPath).then(files => {
    files = files.filter(file => {
      const {
        ext
      } = path.parse(file);
      return exts.indexOf(ext) > -1;
    });

    files = files.slice(0, templateConverter.maxLength);

    for (let i = 0; i < files.length; ++i) {
      const file = files[i];
      const stats = fs.statSync(file);
      if (stats && stats.size > templateConverter.limit) continue;
      let content = fs.readFileSync(file, 'utf8');
      content = _convert(content, view);
      content = _htmlMini(content);
      templateCache.set(file, content);
    }
    callback(null, {
      templateCache,
      imageCache,
      styleCache,
      scriptCache,
      files
    });

    // logs.info(JSON.stringify({
    //   template_file: templateCache.length,
    //   image_file: imageCache.length,
    //   style_file: styleCache.length,
    //   script_file: scriptCache.length
    // }, null, 2));

    // logs.warn(`[${viewName}] precompile templates end ---<<<`);

  });

};

function _convert(body = '', view) {
  body = _convertImage(body, view);
  body = _convertStyle(body, view);
  body = _convertScript(body, view);
  return body;
}


function _convertImage(body = '', view) {

  if (imageCache.length >= view.imageConverter.maxCache) return body;

  const imgRegx = /(<img[\s\S]*?\s+)src=[\"\']([^\"\']+?)[\"\']([^>]*>)?/g;
  const urlRegx = /(url)\([\"\']?([^\"\'\)]*?)[\"\']?\)([^;]*;)?/g;

  [imgRegx, urlRegx].forEach(regx => {
    body = body.replace(regx, (m, prefix, src, suffix) => _transReplaceImage.apply(null, [m, prefix, src, suffix].concat(view)));
  });

  return body;
}

function _convertStyle(body = '', view) {
  const {
    staticPath,
    styleConverter
  } = view;

  const linkRegx = /(<link[\s\S]*?\s+)href=[\"\']([^\"\']+?)[\"\']([^>]*>)?/g;

  body = body.replace(linkRegx, (m, prefix, src, suffix) => {
    src = src.split('?')[0];
    if (styleCache.get(src)) return styleCache.get(src);
    if (/^about:/.test(src)) return m;

    const filePath = path.join(staticPath, src);
    const info = path.parse(filePath);
    let file;
    try {
      file = fs.statSync(filePath);
    } catch (e) {}

    if (!file || file.size > styleConverter.limit) return m;

    if (is.string(styleConverter.test)) {
      styleConverter.test = new RegExp(styleConverter.test, 'ig');
      if (!styleConverter.test.test(info.ext)) return m;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    if (content) {
      content = `<style>${content}</style>`;
      content = htmlAutoprefixer.process(content);
      styleCache.set(src, content);
      return content;
    } else {
      return m;
    }
  });
  body = _convertImage(body, view);

  return body;

}

function _convertScript(body = '', view) {
  const {
    staticPath,
    scriptConverter
  } = view;

  const linkRegx = /(<script[\s\S]*?\s+)src=[\"\']([^\"\']+?)[\"\']([^>]*>)?/g;

  body = body.replace(linkRegx, (m, prefix, src, suffix) => {
    src = src.split('?')[0];
    if (scriptCache.get(src)) return scriptCache.get(src);
    if (/^about:/.test(src)) return m;

    const filePath = path.join(staticPath, src);
    const info = path.parse(filePath);
    let file;
    try {
      file = fs.statSync(filePath);
    } catch (e) {}

    if (!file || file.size > scriptConverter.limit) return m;
    if (is.string(scriptConverter.test)) {
      scriptConverter.test = new RegExp(scriptConverter.test, 'ig');
      if (!scriptConverter.test.test(info.ext)) return m;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    if (content) {
      content = `<script>${content}</script>`;
      scriptCache.set(src, content);
      return content;
    } else {
      return m;
    }


  });
  return body;

}

function _transReplaceImage(m, prefix, src, suffix, view) {

  const {
    staticPath,
    imageConverter
  } = view;

  src = src.split('?')[0];
  if (imageCache.get(src)) return imageCache.get(src);
  if (/^data:image/.test(src)) return m;

  const filePath = path.join(staticPath, src);
  const info = path.parse(filePath);
  let file;
  try {
    file = fs.statSync(filePath);
  } catch (e) {}

  if (!file || file.size > imageConverter.limit) return m;
  if (is.string(imageConverter.test)) {
    imageConverter.test = new RegExp(imageConverter.test, 'ig');
    if (!imageConverter.test.test(info.ext)) return m;
  }

  const base64Data = base64Img.base64Sync(filePath);
  let resetImage = '';
  if (prefix.trim() === 'url') {
    resetImage = `${prefix}(${base64Data}) ${suffix}`;
  } else {
    resetImage = `${ prefix }src="${ base64Data }" ${ suffix }`;
  }
  imageCache.set(src, resetImage);
  return resetImage
}


function _htmlMini(content = '') {
  content = content.replace(/[\r\n]/g, '');
  return htmlMinifier.minify(content, {
    minifyCSS: true,
    minifyJS: true
  });
}
