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
    ctx.state.files = await writeStreamFile(files, uploadDir);

    await next();
  }

}



function writeFileSync(file, toPath) {
  try {
    const content = fs.readFileSync(file.path);
    fs.writeFileSync(toPath, content);
  } catch (e) {
    console.error(`Upload file ${file.name} Error: `, e);
  }
}

function writeStreamFile(files, dir) {

  return new Promise((resolve, reject) => {

    let index = 0,
      _ps = [];
    files && forEach(files, (fileList, fieldName) => {
      if (!Array.isArray(fileList)) {
        fileList = [fileList];
      }
      fileList.length > 0 && fileList.forEach(file => {
        if (file.path) {
          const filePath = path.resolve(dir, `${Date.now()}-${file.name}`);

          // writeFileSync(file, filePath)
          // _ps.push(filePath);
          // index++;
          // if (index === fileList.length) resolve(_ps);

          const writeStream = fs.createWriteStream(filePath);
          fs.createReadStream(file.path).pipe(writeStream);
          writeStream.on('error', err => reject(err));

          _ps.push(filePath);
          index++;
          if (index === fileList.length) resolve(_ps);
        }
      });
    });

  });
}
