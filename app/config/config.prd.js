'use strict';

// application cookie session
// see: https://github.com/pillarjs/cookies#readme
exports.keys = ['6hMm-gPrZk7UHc70-rC5G8-J', 'jtnhNuaZ-ffce-OCgpydk9Y'];

/**
 * 数据库配置 orm 配置
 * ORM see: https: //www.npmjs.com/package/sequelize
 */
exports.db = {
  username: 'root',
  password: 'xxxx',
  host: 'localhost',
  port: 'xxxx',
  dialect: 'mysql',
  database: 'cae-prd',
  pool: {
    max: 5,
    min: 0,
    idle: 30000
  },
  operatorsAliases: false
};