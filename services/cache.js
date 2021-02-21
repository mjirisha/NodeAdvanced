const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
// basic node.js function for creating prommise from callbacks
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

// creating a func with flag - whether to use redis or no
mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');

  // the next line is needed to make cache() chainable
  return this;
};

mongoose.Query.prototype.exec = async function () {
  // if not using cache - just keep the default behaviour
  if (!this.useCache) return exec.apply(this, arguments);

  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );

  const cacheValue = await client.hget(this.hashKey, key);

  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    // converting json to mongo document - creating new instance
    // if array -> we should create them separately
    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }

  const result = await exec.apply(this, arguments);
  // setting data to cache (with 10 sec expiration)
  client.hmset(this.hashKey, key, JSON.stringify(result), 'EX', 10);

  return result;
};

module.exports = {
  // removing cache for particular key
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
