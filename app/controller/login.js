'use strict';

const {
  BaseController
} = require('../../index');
const moment = require('moment');

class LoginController extends BaseController {

  async index() {
    console.log(this.ctx.route)
    this.render('login/index', {
      message: this.route.title
    });
  }

  async signIn() {
    const {
      email,
      password
    } = this.ctx.request.body;

    const {
      token
    } = this.ctx.state;

    this.ctx.cookies.set('token', token, {
      expires: moment().add(30, 'minutes').toDate()
    });

    this.redirect('/');

    // this.body = {
    //   email,
    //   token
    // };
  }
}


module.exports = LoginController;
