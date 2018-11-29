'use strict';
const {
  BaseController
} = require('../../index');

class PostController extends BaseController {

  async index() {
    this.body = `Post -> Index`;
  }

  async add() {
    const {
      title,
      content,
      uuid = 0
    } = this.ctx.request.body;
    const post = {
      title,
      content,
      uuid
    };
    const rs = await this.model.create(post);
    this.body = rs;
  }

  async info({
    id
  }) {
    this.body = `Post -> Info: ${id}`;
  }

}

module.exports = PostController;
