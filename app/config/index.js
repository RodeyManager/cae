'use strict';
const baseConfig = require('./config.base');

module.exports = (env, app) => {

  let config = {};
  try {
    config = require(`./config.${env}`);
  } catch (e) {}
  return {
    ...baseConfig,
    ...config
  };

};