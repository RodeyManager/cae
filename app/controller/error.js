'use strict';

const {
  BaseController
} = require('../../index');

class ErrorController extends BaseController {

  async index(query) {
    this.render('error/404');
  }

}

module.exports = ErrorController;
