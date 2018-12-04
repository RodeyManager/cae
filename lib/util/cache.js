'use strict';

class Cache {

  constructor(maxLength) {
    this._maxLength = maxLength;
    this.length = 0;
    this.list = new Object();
  }

  get(key) {
    return this.list[key];
  }
  set(key, value) {
    if (this.length > this.maxLength) return;
    this.list[key] = value;
    this.length++;
  }
  set maxLength(maxLength) {
    this._maxLength = maxLength;
  }
  get maxLength() {
    return this._maxLength;
  }

}

module.exports = Cache;
