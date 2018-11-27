'use strict';

// application cookie session
// see: https://github.com/pillarjs/cookies#readme
exports.keys = ['6hMm-gPrZk7UHc70-rC5G8-J', 'jtnhNuaZ-ffce-OCgpydk9Y'];

exports.database = {
  mysql: [{
    user: 'root',
    password: 'root',
    host: 'localhost',
    port: 3306,
    database: 'cae-dev',
  }, {
    user: 'root',
    password: 'root',
    host: 'localhost',
    port: 3306,
    database: 'cae-dev',
  }],
  mongodb: {
    host: 'localhost',
    port: 27017,
    collection: 'cae-dev',
    options: {
      autoIndex: true,
      useNewUrlParser: true
    }
  },
  /**
   * 数据库配置 orm 配置
   * ORM see: https: //www.npmjs.com/package/sequelize
   */
  orm: {
    username: 'root',
    password: 'root',
    host: 'localhost',
    port: '3306',
    dialect: 'mysql',
    database: 'cae-dev',
    pool: {
      max: 5,
      min: 0,
      idle: 30000
    },
    operatorsAliases: false,
    logging: false, // console.log
  }
};


/**
 * 第三方服务提供者列表相关配置
 * 具体配置请参照got库： https://www.npmjs.com/package/got#gotextendoptions
 */
exports.provider = {
  weixin: {
    baseUrl: 'https://weixin.com/',
    headers: {
      'x-unicorn': 'rainbow'
    }
  },
  ecs: {
    baseUrl: 'https://esales.test-cignacmb.com/esales/',
    json: true
  },
  epay: {
    baseUrl: 'https://epay.test-cignacmb.com/epayment/'
  }
};
