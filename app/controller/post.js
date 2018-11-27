'use strict';
const {
  BaseController
} = require('../../index');

class PostController extends BaseController {

  async index() {
    this.ctx.body = `Post -> Index`;
  }

  async add() {
    this.ctx.body = 'Post -> Add';
  }

  async info({
    id
  }) {
    this.ctx.body = `Post -> Info: ${id}`;
  }

}

module.exports = PostController;
