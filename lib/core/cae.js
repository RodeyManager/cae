'use strict';

const debug = require('debug')('application');
const assert = require('assert');
const fs = require('fs');
const Koa = require('koa');
const path = require('path');
const Router = require('./router');
const View = require('./view');
const Config = require('./config');
const is = require('is-type-of');
const extend = require('extend');
const {
  injectPropsAsDir,
  definedPorp,
  isPlainObject,
} = require('../util');
const {
  forEach
} = require('lodash/collection');
const createORM = require('./orm');
const koaBody = require('koa-body');
const CSRF = require('koa-csrf');
const {
  APPLICATION_EVENT
} = require('../event_types');

class Cae extends Koa {

  constructor(options = {}) {
    super();
    // project root dir
    this._opts = options;
    this.root = options.root || process.cwd();
    this.db = {};
    this._init_();
    this.emit(APPLICATION_EVENT.INITIALIZE, this);
  }

  _init_() {
    // config
    this.initConfig();
    // session
    this.initSession();
    // request service
    this.initFetchs();
    // view
    this.initView();
    // logger
    this.initLogger();
  }

  async _run_() {

    // model
    this.M = this.models = {};
    await this.initModels();

    // service logic
    this.S = this.services = {};
    await this.initServices();

    // controller
    this.C = this.controllers = {};
    await this.initControllers();

    // C | S | M prop getter
    this.initInject();

    // router
    this.initRouter();

  }

  /**
   * 初始化配置
   */
  initConfig() {
    this.emit(APPLICATION_EVENT.CONFIG_LOAD_START, this);
    this.config = {};

    const env = process.env.NODE_ENV || this.env;
    const file = path.resolve(this.root, `app/config`);
    if (this._opts.config) {
      this.config = this._opts.config;
    } else {
      try {
        let config = require(file);
        if (is.function(config)) {
          config = config(env, this);
        }
        if (!is.object(config)) {
          throw TypeError(`application configuration is must Object or Function(returns Object)`);
        }
        this.config = {
          ...config
        };

      } catch (err) {
        this.config = {};
      }
    }
    this.config = new Config(this.config);

    // app keys
    // session cookie
    let keys = this.config.get('keys') || this.keys;
    if (!keys) {
      const uid = require('uid-safe');
      keys = [uid.sync(18), uid.sync(18)];
      this.keys = keys;
      this.config.set('keys', keys);
    } else {
      this.keys = keys;
    }

    this.emit(APPLICATION_EVENT.CONFIG_LOAD_END, this);
  }

  initFetchs() {
    const fetchs = require('./fetch')(this.config.get('provider'));
    this.fetch = fetchs;
    this.provider = fetchs;
  }

  /**
   * 初始化View对象
   * 默认采用 app.viewEngine对象
   * 默认在Controller中使用 this.render('home/index', data)
   *
   * 系统支持多模板渲染引擎
   * 有多个渲染引擎时在Controller中可以使用this.V.ejs.render('home/index', data)进行模板渲染，
   *
   * application config views
   * exports.views = [{
   *  name: 'ejs',               // 引擎名称，作为app.V的key值，如 this.V.ejs
   *  engine: require('ejs'),    // 引擎
   *  ext: '.ejs',               // 模板文件后缀
   *  path: 'app/view'           // 模板文件路径
   * }, ...];
   */
  initView() {
    this.emit(APPLICATION_EVENT.VIEW_LOAD_START, this);
    this.viewEngine = null;
    this.V = this.views = {};
    const defView = {
      name: 'nunjucks',
      engine: require('nunjucks'),
      path: 'app/view',
      ext: '.html',
      noCache: ['prd', 'production'].indexOf(process.env.NODE_ENV) > -1
    };

    let views = this.config.get('views');
    if (isPlainObject(views)) {
      views = [views];
    }
    if (views && !is.array(views)) {
      throw TypeError(`application view config must Array type`);
    }
    views.unshift(defView);

    views.forEach((view, i) => {
      if (is.function(view)) {
        view = view(this);
      }
      this.views[view.name] = new View(view, this);
      i === 0 && (this.viewEngine = this.views[view.name]);
    });

    this.emit(APPLICATION_EVENT.VIEW_LOAD_END, this);
  }

  /**
   * 初始化 session
   */
  initSession() {
    const session = this.config.get('session');
    if (!session || !isPlainObject(session)) return;

    const Session = require('koa-session');
    this.use(Session(session, this));
  }

  initLogger() {
    // const {
    //   appLogger,
    //   ctxLogger,
    //   dbLogger
    // } = require('./logger');
    // this.appLogger = appLogger(this);
    // this.ctxLogger = ctxLogger(this, this.ctx);
    // this.dbLogger = dbLogger;
  }

  /**
   * 初始化控制器
   * cae.C.user
   */
  async initControllers() {
    this.emit(APPLICATION_EVENT.CONTROLLER_LOAD_SATRT, this);
    const dir = path.resolve(this.root, 'app/controller');

    assert(fs.existsSync(dir), `Not found controller directory, ${dir} not exists`);
    assert(fs.statSync(dir).isDirectory(), `${dir} is not a directory`);

    await injectPropsAsDir(this, 'controllers', dir);
    this.emit(APPLICATION_EVENT.CONTROLLER_LOAD_END, this);
  }

  /**
   * 初始化模型
   * car.M.user
   */
  async initModels() {
    const dir = path.resolve(this.root, 'app/model');

    assert(fs.existsSync(dir), `Not found model directory, ${dir} not exists`);
    assert(fs.statSync(dir).isDirectory(), `${dir} is not a directory`);

    await injectPropsAsDir(this, 'models', dir);
  }

  /**
   * 业务逻辑层
   * car.S.user
   */
  async initServices() {
    this.emit(APPLICATION_EVENT.SERVICE_LOAD_START, this);
    const dir = path.resolve(this.root, 'app/service');

    assert(fs.existsSync(dir), `Not found service directory, ${dir} not exists`);
    assert(fs.statSync(dir).isDirectory(), `${dir} is not a directory`);

    await injectPropsAsDir(this, 'services', dir);
    this.emit(APPLICATION_EVENT.SERVICE_LOAD_END, this);
  }

  initInject() {
    this._injectModel();
    this._injectService();
    this._injectController();
  }

  _injectModel() {
    const dbConfig = this.config.get('database') || {};
    const ormConfig = dbConfig['orm'] || {};
    this.db = {};
    const {
      sequelize,
      Sequelize
    } = createORM(ormConfig);

    forEach(this.M, (val, key) => {

      this.M[key] = (() => {

        const Model = {
          define(tableName, schame, opts = {}) {
            return sequelize.define(tableName, schame, Object.assign({}, {
              freezeTableName: true,
              tableName,
            }, opts));
          }
        };

        return val({
          app: this,
          Model,
          DataTypes: Sequelize
        });

      })();

    });

  }

  _injectService() {
    definedPorp(this.S, this, (ins, prop) => {
      const _model = this.M[prop];
      _model && (ins.model = _model);
    });
  }

  _injectController() {
    definedPorp(this.C, this, (ins, prop) => {
      const _model = this.M[prop];
      const _service = this.S[prop];
      _model && (ins.model = _model);
      if (_service) {
        _service.controller = ins;
        ins.service = _service;
      }
    });
    // console.log(this.C.user.index());
  }


  /**
   * 初始化路由
   */
  initRouter() {
    this.emit(APPLICATION_EVENT.ROUTER_LOAD_START, this);
    this.router = new Router({
      sensitive: true
    }, this);

    const routerFile = path.resolve(this.root, this.config.get('router') || 'app/router.js');
    const exists = fs.existsSync(routerFile);
    if (exists) {
      debug(`Application routers load start...>`);
      const routerFn = require(routerFile);
      routerFn(this);
      debug(`Application routers load flish...<`);
    } else {
      debug(`Application not router configuration...<`);
    }

    this.emit(APPLICATION_EVENT.ROUTER_LOAD_END, this);
  }

  // default middleware
  _onMiddleware() {
    this.emit(APPLICATION_EVENT.MIDDLEWARE_LOAD_START, this);
    // koa-body parser
    this.use(koaBody(extend(true, {
      multipart: true,
      formLimit: 2 * Math.pow(1024, 2),
    }, this.config.get('bodyParser'))));

    // 默认开启csrf， 关闭请配置： config.csrf = false
    if (this.config.get('csrf') !== false) {
      this.use(new CSRF({
        invalidSessionSecretMessage: 'Invalid session secret',
        invalidSessionSecretStatusCode: 403,
        invalidTokenMessage: 'Invalid CSRF token',
        invalidTokenStatusCode: 403,
        excludedMethods: ['GET', 'HEAD', 'OPTIONS'],
        disableQuery: false
      }));
    }

    // JWT
    const jwtConfig = this.config.get('jwt');
    if (jwtConfig) {
      const JWT = require('koa-jwt');
      this.jwt = JWT;
      const unless = extend(true, {}, jwtConfig['unless']);
      if (!unless.path) {
        unless.path = [];
      }
      unless.path = unless.path.concat([/\.(jpg|jpeg|png|gif|bmp|webp|ico|svg|html|htm|css|js|txt|pdf|word|xlsx|xls).?$/]);

      this.use((ctx, next) => {
        return next().catch((err) => {
          if (401 == err.status) {
            ctx.status = 401;
            ctx.body = {
              code: 401,
              message: 'Protected resource, use Authorization header to get token\n'
            };
          } else {
            throw err;
          }
        });
      });

      this.use(JWT(jwtConfig).unless(unless));
    }

    this.emit(APPLICATION_EVENT.MIDDLEWARE_LOAD_END, this);
  }

  // use default root path
  _defaultRoot() {
    this.use(async (ctx, next) => {
      ctx.body = `<h1 style="text-align:center;margin:50px auto;color: #E91E63;">Welcome to use Cae.js</h1>`;
      await next();
    });
  }

  async run(port, hostname = '127.0.0.1') {
    port = process.env.PORT || 7808;
    await this._run_();
    this._onMiddleware();
    this.use(this.router.routes());
    this._defaultRoot();
    this.emit(APPLICATION_EVENT.BEFORE, this);
    this.listen(port, hostname, () => {
      this.emit(APPLICATION_EVENT.AFRER, this);
      console.log(`Server is run starting as http://${hostname}:${port} `);
    });
  }
}

module.exports = Cae;