const JWT = require('jsonwebtoken');

/**
 * 签发认证码
 * @param {*} app
 */
exports.createToken = (app) => {
  const {
    config
  } = app;
  const jwtConfig = config.get('jwt') || {};
  const secret = jwtConfig.secret;

  return async (ctx, next) => {
    const {
      email,
      password
    } = ctx.request.body;

    if (!email || !password) {
      ctx.status = 401;
      ctx.body = 'Not found fields';
      return false;
    }

    const token = JWT.sign({
      email
    }, secret, {
      expiresIn: '5m'
    });
    ctx.state.token = token;
    return next();

  };
};

/**
 * 权限认证
 * @param {*} app
 */
exports.authenticationToken = (app) => {
  const {
    config
  } = app;
  const jwtConfig = config.get('jwt') || {};
  const secret = jwtConfig.secret;

  return async (ctx, next) => {

    const token = ctx.get('token') || ctx.request.body.token || ctx.query.token;
    if (!token) {
      return _noneAuthen();
    }

    try {
      const decoded = JWT.verify(token, secret);
      console.log(decoded);
    } catch (e) {
      return _noneAuthen(e.message);
    }

    function _noneAuthen(message) {
      ctx.status = 401;
      ctx.body = e.message || '没有权限';
      return false;
    }

    return next();
  };
}
