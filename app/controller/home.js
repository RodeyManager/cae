'use strict';

const {
  BaseController
} = require('../../index');

class HomeController extends BaseController {

  async index(query) {
    let citys;
    try {
      citys = await this.fetch.sojson.get('_city.json');
    } catch (e) {
      console.error('Fetch get [_city.json]: ', e.message);
      citys = [];
    }
    // this.ctx.body = `Home -> Index: \n${JSON.stringify(query, null, 2)}`;
    // console.log(this.M.post);
    let posts = await this.M.post.findAll();
    posts = posts.map(post => post.toJSON());
    this.render('home/index', {
      message: 'Welcome use Cae.js',
      posts: JSON.stringify(posts, null, 4),
      citys: citys && citys.body && citys.body.slice(0, 100).filter(item => item.city_code) || [],
    });
  }

  async water({
    city
  }) {
    let result;
    try {
      result = await this.fetch.sojson.get(`http://t.weather.sojson.com/api/weather/city/${city}`);
    } catch (e) {
      console.error('Fetch get [home/water]: ', e.message);
      result = {};
    }
    this.body = result && result.body || {};
  }

  async upload() {
    // console.log(this.ctx.request.files);
    this.body = 'body---';
  }

}

module.exports = HomeController;
