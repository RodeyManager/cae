'use strict';
const is = require('is-type-of');

class BaseController {

  constructor(app = {}) {
    this.app = app;
    this._model = null;
    this._service = null;
    this._ctx = app.content || null;
    this.V = app.views;
    this.M = app.models;
    this.S = app.services;
    this._view = app.viewEngine;
    this.fetch = app.provider;
    this._init_();
  }
  _init_() {}

  render(view, data, opts = {}) {
    const viewData = this._getRenderData(data);
    let content = this._view.render(view, viewData, opts);
    if (is.null(content)) return this.renderError();
    this.body = content;
  }

  renderError(code = 404) {
    this._view.renderError(code, this.ctx);
  }

  renderString(str, data) {
    const viewData = this._getRenderData(data);
    const content = this._view.renderString(str, viewData);
    this.ctx.body = content;
  }

  renderFile(file, data) {
    const viewData = this._getRenderData(data);
    const content = this._view.renderFile(file, viewData);
    this.body = content;
  }

  redirect(url, alt) {
    if (!url) return;
    this.ctx.redirect(url, alt);
  }

  _getRenderData(data) {
    const csrf = this.ctx.csrf || '';
    return {
      ...data,
      _CSRF_: csrf,
      $csrf: csrf,
      $cookies: this.ctx.headers.cookie,
      ...this._injectApplicationData()
    }
  }

  _injectApplicationData() {
    const $data = {};
    [
      'header',
      'headers',
      'method',
      'url',
      'originalUrl',
      'origin',
      'href',
      'path',
      'query',
      'querystring',
      'host',
      'hostname',
      'protocol',
      'ip', 'ips',
      'subdomains',
      'secure',
      'status',
      'message',
      'length',
      'type',
      'headerSent'
    ].forEach(prop => {
      const value = this._ctx[prop];
      Object.defineProperty($data, `$${prop}`, {
        value,
        enumerable: true
      });
    });
    return $data;
  }

  getParam(name) {
    return this.ctx.query[name] || this.ctx.request.body[name] || '';
  }

  get ctx() {
    return this._ctx;
  }
  set ctx(ctx) {
    this._ctx = ctx;
  }

  get body() {
    return this.ctx.body;
  }
  set body(body) {
    this.ctx.body = body;
  }

  get model() {
    return this._model;
  }
  set model(model) {
    this._model = model;
  }

  get service() {
    return this._service;
  }
  set service(service) {
    this._service = service;
  }

}

module.exports = BaseController;
