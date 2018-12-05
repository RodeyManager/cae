'use strict';


/**
 * 应用模板渲染引擎设置
 * 支持多模板引擎，多模板引擎是，controller中使用: this.views.ejs.render
 * 系统采用nunjucks作为默认模板渲染引擎
 * see: https: //mozilla.github.io/nunjucks/
 * @views 配置 ${Array|Object}
 */

exports.view = [{
  name: 'ejs',
  engine: require('ejs'),
  path: 'app/view',
  ext: '.ejs',
  default: false // 系统默认启用
}];

// 停用模板文件预编译缓存
// exports.viewPrecompile = false;

/**
 * 模板相关转换器
 * 包括：image、style、script、template
 * @param {String} test 匹配规则
 * @param {Number} maxCache 最大缓存数
 * @param {Number} limit 最大支持的文件大小 单位 bytes
 */
exports.viewConverter = {
  // image: {
  //   test: '.(png|jpg|svg)$',
  //   maxCache: 100,
  //   limit: 10 * 1024,
  // },
};

// 开启session
exports.session = {
  key: 'cae:sess'
};

// 关闭CSRF
exports.csrf = false;

// JWT
exports.jwt = {
  secret: 'cae-application-asd434ad34234',
};

// body-parse 配置 https://www.npmjs.com/package/koa-body
// 系统默认 multipart: true; formLimit: 2 * 1024 * 1024 (2m)
exports.bodyParser = {};

// 上传文件目录
// 相对路径以项目目录为起始
exports.uploadDir = 'app/assets/uploader';
