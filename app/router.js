'use strict';
const uploader = require('./middleware/uploader');
const {
  createToken,
  authenticationToken
} = require('./middleware/jwt');

module.exports = (app) => {
  return [{
      path: '/error/404',
      action: 'error.action404'
    },
    {
      path: '/',
      redirect: '/home',
      // action: 'home.index',
    },
    {
      path: '/login',
      action: 'login.index',
      title: 'User Login'
    },
    {
      path: '/login',
      action: 'login.signIn',
      middleware: [createToken(app)],
      method: 'post'
    },
    {
      path: '/home',
      action: 'home.index',
      name: 'asdddddd',
      children: [{
          path: '/water',
          action: 'home.water'
        },
        {
          path: '/upload',
          action: 'home.upload',
          middleware: [uploader(app.config.get('uploadDir'), app)],
          method: 'post'
        }
      ]
    },
    {
      path: '/user',
      action: 'user.index',
      children: [{
          path: '/add',
          action: 'user.add',
          method: 'post'
        },
        {
          path: '/info/:username',
          action: 'user.info'
        }
      ]
    },
    {
      path: '/post',
      action: 'post.index',
      children: [{
          path: '/:id',
          action: 'post.info'
        },
        {
          path: '/add',
          action: 'post.add',
          middleware: [authenticationToken(app)],
          method: 'post'
        }
      ]
    }
  ];
}


// module.exports = [{
//     path: '/error/404',
//     action: 'error.action404'
//   },
//   {
//     path: ['/', '/home/'],
//     action: 'home.index'
//   },
//   {
//     path: '/home',
//     action: 'home.index',
//     children: [{
//         path: '/water',
//         action: 'home.water'
//       },
//       {
//         path: '/upload',
//         action: 'home.upload',
//         // middleware: [uploader(config.get('uploadDir'), app)],
//         method: 'post'
//       }
//     ]
//   }
// ];





// module.exports = app => {

//   const {
//     router,
//     config,
//   } = app;

//   router.get('/error/404', 'error.action404');

//   router.get('/', 'home.index');
//   router.get('/home/', 'home.index');
//   router.get('/home/water', 'home.water');
//   router.post('/home/upload', uploader(config.get('uploadDir'), app), 'home.upload');

//   router.post('/login', createToken(app), 'login.login');

//   // user module
//   router.module('/user', _ => {
//     router.get('/', 'user.index');
//     router.get('/add', {
//       action: 'user.save',
//       middleware: [],
//     });
//     router.get('/info/:username', async (ctx, next) => {
//       ctx.state.user = {
//         username: ctx.params.username,
//         title: 'Cae.js'
//       };
//       await next(ctx);
//     }, 'user.info');
//   });

//   // post module
//   router.module('/post', _ => {
//     router.get('/', 'post.index');
//     router.get('/:id', 'post.info');
//     router.post('/add', authenticationToken(app), 'post.add');
//   });

// };
