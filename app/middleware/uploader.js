'use strict';

/**
 * 上传文件
 */

const fs = require('fs');
const path = require('path');
const {
  forEach
} = require('lodash/collection');

module.exports = (options = {}, app) => {

  const uploadDir = options.uploadDir || path.resolve(__dirname, `../../app/assets/uploads`);
  !fs.existsSync(uploadDir) && fs.mkdirSync(uploadDir);

  return async (ctx, next) => {
    if (['GET', 'HEAD', 'DELETE'].indexOf(ctx.method.toUpperCase()) !== -1) {
      await next();
    }
    const files = ctx.request.files;

    files && forEach(files, (fileList, fieldName) => {
      if (!Array.isArray(fileList)) {
        fileList = [fileList];
      }
      fileList.length > 0 && fileList.forEach(file => {
        file.path && fs.createReadStream(file.path).pipe(fs.createWriteStream(path.resolve(app.root, `${uploadDir}/${file.name}`)));
      });
    });

    await next();
  }

}
