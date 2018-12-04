'use strict';
const {
  BaseController
} = require('../../index');
const uid = require('uid-safe');

class UserController extends BaseController {

  async index() {
    // const users = await this.model.findAll();
    const users = await this.service.all();
    this.render('user/list', {
      users
    });
  }

  async save({
    _csrf_
  }) {

    console.log(_csrf_);

    const user = {
      username: uid.sync(8),
      password: uid.sync(12)
    };
    const newUser = await this.service.addUser(user);
    this.body = `User -> Add: ${JSON.stringify(newUser, null, 2)}`;
  }

  async info({
    username
  }) {
    let user = await this.model.findOne({
      where: {
        username
      }
    });
    if (user) {
      user = user.toJSON();
      user = JSON.stringify(user || this.ctx.state.user, null, 2);
    } else {
      user = `User -> Info: not user`;
    }
    // this.render('user/info', {
    //   user
    // });

    // 支持多渲染引擎
    this.V.ejs.render('user/info', {
      user
    }, this.ctx);
    // OR
    // this.V.ejs.render('user/info', {
    //   user,
    // }, body => this.body = body);
  }

}

module.exports = UserController;
