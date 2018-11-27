'use strict';
const uploader = require('./middleware/uploader');

module.exports = app => {

  const {
    router,
    config,
    jwt,
  } = app;

  router.get('/', 'home.index');
  router.get('/home/', 'home.index');
  router.post('/home/upload', uploader(config.get('uploadDir'), app), 'home.upload');

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
    router.post('/add', 'post.add');
  });

};
