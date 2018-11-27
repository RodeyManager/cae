'use strict';

const is = require('is-type-of');
const isPlainObject = require('is-plain-object');
const KoaRouter = require('koa-router');
const BaseController = require('./controller');
const {
  middleware
} = require('../util');

const methods = ['all', 'get', 'post', 'put', 'patch', 'head', 'delete', 'options'];


class Router extends KoaRouter {
  constructor(opts, app) {
    super(opts);
    this._opts = opts;
    this._prefix = '';
    this.app = app;
    this.routeCache = [];
    this._injectMethod();
  }

  _injectMethod() {
    methods.forEach(method => {
      this[method] = (...args) => {
        args = this.tranlateRouterParams.apply(this, args);
        return super[method](...args);
      };
    });
  }

  tranlateRouterParams(...args) {
    const {
      controllers
    } = this.app;
    const pather = args.slice(0, 1);
    let middleware = args.slice(1);
    const action = middleware.pop();
    let controller, actionCall;

    pather[0] = `${this._prefix}${pather[0]}`;
    this.routeCache.push(pather[0]);

    if (is.string(action)) {
      // user.index === user/index === user > index === user@index
      [controller, actionCall] = action.split(/\/|\@|>|\./g).map(s => s.replace(/^\s*|\s*$/, ''));
    }
    if (isPlainObject(action)) {
      controller = action['controller'];
      actionCall = action['action'];
      const actionMiddleware = action['middleware'];
      middleware = middleware.concat(is.array(actionMiddleware) ? actionMiddleware : [actionMiddleware]);
    }

    // router async/await callback
    const caller = async (ctx, next) => {
      this.app.ctx = ctx;

      if (is.function(action)) {
        await action(ctx, next);
        return next();
      }

      const callArgs = [{
        ...ctx.query,
        ...ctx.params
      }].concat([ctx, next]);

      // get new controller
      if (controller instanceof BaseController) {
        const actionFn = controller[actionCall];
        controller.ctx = ctx;
        is.function(actionFn) && actionFn.apply(ctrlIns, callArgs);
        return next();
      }
      const ctrlIns = controllers[controller];
      if (ctrlIns && ctrlIns instanceof BaseController) {
        ctrlIns.ctx = ctx;
        const actionFn = ctrlIns[actionCall];
        if (is.asyncFunction(actionFn)) {
          return await actionFn.apply(ctrlIns, callArgs);
        }
        is.function(actionFn) && actionFn.apply(ctrlIns, callArgs);
      } else {
        await next();
      }
    };

    middleware.push(caller);
    args = pather.concat(middleware.filter(m => is.function(m)));
    return args;
  }

  module(prefix, fn) {
    this._prefix = prefix;
    is.function(fn) && fn.call(this, this.app);
    return this;
  }

}

module.exports = Router;
