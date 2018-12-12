'use strict';
const baseConfig = require('./config.base');

const routers = require('../router');

module.exports = (env, app) => {

  let config = {};
  try {
    config = require(`./config.${env}`);
  } catch (e) {}
  return {
    ...baseConfig,
    ...config,
    routers,
  };

};
