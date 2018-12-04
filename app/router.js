'use strict';
const uploader = require('./middleware/uploader');
const {
  createToken,
  authenticationToken
} = require('./middleware/jwt');

module.exports = app => {

  const {
    router,
    config,
  } = app;

  router.get('error/404', 'error.action404');

  router.get('/', 'home.index');
  router.get('/home/', 'home.index');
  router.post('/home/upload', uploader(config.get('uploadDir'), app), 'home.upload');

  router.post('/login', createToken(app), 'login.login');

  // user module
  router.module('/user', _ => {
    router.get('/', 'user.index');
    router.get('/add', {
      controller: 'user',
      action: 'save',
      middleware: [],
    });
    router.get('/info/:username', async (ctx, next) => {
      ctx.state.user = {
        username: ctx.params.username,
        title: 'Cae.js'
      };
      await next(ctx);
    }, 'user.info');
  });

  // post module
  router.module('/post', _ => {
    router.get('/', 'post.index');
    router.get('/:id', 'post.info');
    router.post('/add', authenticationToken(app), 'post.add');
  });

};
