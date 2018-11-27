'use strict';

const {
  BaseService
} = require('../../index');

class UserService extends BaseService {

  async findUser() {
    const user = await this.model.findOne({
      where: {
        name: 'Rodey'
      }
    });
    return user && user.toJSON() || null;
  }

  async all() {
    const users = await this.model.findAll();
    return users.map(user => user.toJSON());
  }

  async addUser(user) {
    user = await this.model.create(user);
    return user.toJSON();
  }

}

module.exports = UserService;
