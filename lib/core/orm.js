'use strict';

const Sequelize = require('sequelize');
let sequelize = null;

const createORM = (config = {}) => {
  if (!sequelize) {
    const {
      database,
      username,
      password
    } = config;
    sequelize = new Sequelize(database, username, password, config);
  }
  return {
    sequelize,
    Sequelize
  };
}

module.exports = createORM;
