/**
 * application router mapping:
 * const routers = [
 * { path: ['/', '/home'], action: 'home.index', middleware: [] },
 * { path: '/user', children: [
 *    { path: '/list', action: 'user.index' },
 *    { path: '/profile:userId', action: 'user.profile' },
 * ]}
 * ];
 */

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
    let controller, actionCall, opts = {};

    pather[0] = `${this._prefix}${pather[0]}`;
    this.routeCache.push(pather[0]);

    if (is.string(action)) {
      // user.index === user/index === user > index === user@index
      [controller, actionCall] = this._spliter(action);
    }

    // action is object like this:
    // router.get('/home', {
    //   action: 'home.index',
    //   middleware: []
    // });

    if (isPlainObject(action)) {
      const _actionStr = action['action'],
        _redirect = action['redirect'];
      opts = { ...action
      };
      if (_redirect) {
        this.redirect(pather[0], _redirect);
      } else {
        if (!_actionStr) {
          this.redirect('/', '/');
        } else {
          [controller, actionCall] = this._spliter(action['action']);
          const actionMiddleware = action['middleware'];
          middleware = middleware.concat(is.array(actionMiddleware) ? actionMiddleware : [actionMiddleware]);
        }
      }
    }

    // router async/await callback
    const caller = async (ctx, next) => {
      this.app.ctx = ctx;

      if (is.function(action)) {
        await action(ctx, next);
        return next();
      }
      const route = {
        path: pather[0],
        ...opts
      };
      ctx.route = route;

      const callArgs = [{
        ...ctx.query,
        ...ctx.params
      }].concat([ctx, next]);

      // get new controller
      if (controller instanceof BaseController) {
        const actionFn = controller[actionCall];
        controller.ctx = ctx;
        // controller.route = route;
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

  _spliter(str = '') {
    return str.split(/\/|\@|>|\./g).map(s => s.replace(/^\s*|\s*$/, ''));
  }


  static tranlateRouters(routers, inc, app) {

    const redirects = [];

    if (is.array(routers)) {
      routers.forEach(router => {
        _recursion(router, '', inc);
      });
    } else if (is.function(routers)) {
      const retunrVals = routers.call(inc, app);
      if (is.array(retunrVals)) {
        Router.tranlateRouters(retunrVals, inc, app);
      }
    }

    // redirects delay handle
    redirects.length > 0 && redirects.forEach(([_path, _redirect]) => {
      inc.redirect(_path, _redirect);
    });

    function _recursion(rts, root = '', inc) {
      _registerRouter(rts, root);
      const children = rts.children;
      if (children && is.array(children)) {
        children.forEach(child => {
          _recursion(child, rts.path, inc);
        });
      }
    }

    function _registerRouter(router, root = '') {
      let {
        path,
        action,
        middleware = [],
        method = 'get',
        redirect,
        ...args
      } = router;

      if (!is.array(middleware)) {
        middleware = [middleware];
      }

      if (is.array(path)) {
        path.forEach(p => {
          path = root + p;
          inc[method](root + p, middleware, action);
        });
      } else {
        path = root + path;
      }

      if (redirect) {
        redirects.push([path, redirect]);
      } else {
        const argumentVals = [...middleware];
        argumentVals.unshift(path);
        argumentVals.push({
          action,
          middleware,
          ...args
        });
        inc[method].apply(inc, argumentVals);
      }

    }

  }

}

module.exports = Router;
