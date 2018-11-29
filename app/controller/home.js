'use strict';

const {
  BaseController
} = require('../../index');

class HomeController extends BaseController {

  async index(query) {

    const occ = await this.fetch.ecs.get('getOcc');
    // this.ctx.body = `Home -> Index: \n${JSON.stringify(query, null, 2)}`;
    // console.log(this.M.post);
    let posts = await this.M.post.findAll();
    posts = posts.map(post => post.toJSON());
    this.render('home/index', {
      message: 'Welcome use Cae.js',
      posts: JSON.stringify(posts, null, 4),
      occs: occ.body.data,
    });
  }

  async upload() {
    // console.log(this.ctx.request.files);
    this.body = 'body---';
  }

}

module.exports = HomeController;
