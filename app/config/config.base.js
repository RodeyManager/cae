'use strict';


/**
 * 应用模板渲染引擎设置
 * 支持多模板引擎，多模板引擎是，controller中使用: this.views.ejs.render
 * 系统采用nunjucks作为默认模板渲染引擎
 * see: https: //mozilla.github.io/nunjucks/
 * @views 配置必须是Array
 */

exports.views = [{
  name: 'ejs',
  engine: require('ejs'),
  path: 'app/view',
  ext: '.ejs'
}];

// 开启session
exports.session = {
  key: 'cae:sess'
};

// 关闭CSRF
exports.csrf = true;

// JWT
exports.jwt = {
  secret: 'cae-application',
  // 排除
  unless: {
    path: [/^\/(assets|home|user|post)/]
  }
};

// body-parse 配置 https://www.npmjs.com/package/koa-body
// 系统默认 multipart: true
exports.bodyParser = {};

// 上传文件目录
// 相对路径以项目目录为起始
exports.uploadDir = 'app/assets/uploader';
