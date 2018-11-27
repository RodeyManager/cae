'use strict';

const Database = require('./database');
const mysql = require('mysql2/promise');

class MySQL extends Database {
  constructor(config, app) {
    super(config, app);
    this.connection = null;
    this._table = '';
    this.db = null;
    this.engine = mysql;
    this.connect();
  }

  async connect() {
    this.connection = await this.engine.createConnection(this.config);
    return this;
  }

  async findAll(table, where) {
    const sql = 'SELECT * FROM `' + (table || this.table) + '` ' + where;
    const result = await this.query(sql);
    return result;
  }

  async query(sql) {
    const result = await this.connection.query(sql);
    return result;
  }

  get table() {
    return this.connection;
  }
  set table(table) {
    this._table = table;
  }

  close() {
    this.connection.end();
  }
}

module.exports = MySQL;