'use strict';

const Database = require('./database');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

class Mongodb extends Database {
  constructor(config = {}, app) {
    super(config, app);
    this.connection = null;
    this.engine = mongoose;
    this._schema = null;
    this.db = null;
    this.connect();
  }

  async connect() {
    const {
      host,
      port,
      collection
    } = this.config;
    const options = Object.assign({
      autoIndex: true,
      useNewUrlParser: true
    }, this.config['options'] || {});
    const uri = `mongodb://${host}:${port}/${collection}`;
    this.connection = await this.engine.createConnection(uri, options);
    return this;
  }

  get schema() {
    return this._schema;
  }
  set schema(schema) {
    this._schema = schema;
  }

  get table() {
    return this.db;
  }
  set table(table) {
    this.db = this.connection.model(table, this._schema);
    return this.db;
  }

  close() {
    this.connection.close();
  }
}

module.exports = Mongodb;
