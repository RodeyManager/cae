const {
  forEach
} = require('lodash/collection');
const got = require('got');

// const config = {
//   server1: {
//     baseUrl: 'https://weixin.com',
//     headers: {
//       'x-unicorn': 'rainbow'
//     }
//   },
//   server2: {
//     baseUrl: 'https://esales.test-cignacmb.com/esales'
//   },
//   server3: {
//     baseUrl: 'https://epay.test-cignacmb.com/epayment'
//   }
// }

// fetch.server1.get(URL, options);

module.exports = (config = {}) => {
  const fetchMap = new Map();
  const fetchObject = {};
  forEach(config, (val = {}, key) => {
    fetchMap.set(key, got.extend(val));
    Object.defineProperty(fetchObject, key, {
      get: function () {
        return fetchMap.get(key);
      },
      set: function (v) {
        fetchMap.set(key, v);
      },
      enumerable: true
    })
  });
  return fetchObject;
}
