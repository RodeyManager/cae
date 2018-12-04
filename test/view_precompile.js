const rrdir = require('recursive-readdir');
const LRU = require('lru-cache');
const path = require('path');
const fs = require('fs');

const viewPath = path.resolve(__dirname, '../app/view');

const templateCache = new LRU(100);

module.exports = (inp, callback) => {

  rrdir(viewPath).then(files => {
    files = files.filter(file => {
      const {
        ext
      } = path.parse(file);
      return ['.html', '.ejs'].indexOf(ext) > -1;
    });

    for (let i = 0; i < files.length; ++i) {
      if (i > 100) break;
      const file = files[i];
      let content = fs.readFileSync(file, 'utf8');
      templateCache.set(file, content);
    }

    console.log(inp, process.pid, templateCache.length);
    callback(null, `view compile completed: ${templateCache.length}`);

  });

};
