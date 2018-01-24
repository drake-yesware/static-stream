const Transform = require('../transform');

class WriteAlgolia extends Transform {

  constructor(config = {}) {
    super();
    this.config = config;

    /* Options */
    this.config.key = config.key;
    this.config.id = config.id;
    this.config.index = config.index;
    this.config.concurrency = config.concurrency || 1;
    this.config.body = config.body;
    this.config.delay = config.delay || 500;
    this.config.maxRetries = config.maxRetries || 3;

    this.retriesLeft = this.config.maxRetries;
    this.algolia = require('algoliasearch');
    this.pipe = super.transform();
    this.getValue = super.getValue;
    this.client = this.algolia(this.config.id, this.config.key);

  }

  addObject(entry, callback) {
    let self = this;

    let data = self.config.body
      ? self.getValue(entry, self.config.body)
      : entry.data;
    data.objectID = entry.meta.id;
    if(data.value.body) {
      data.value.body = data.value.body.substr(0, 10000);
    }

    self.index = self.client.initIndex(entry.meta.index || this.config.index);
    self.index.addObject(data, function(err, content) {

      if(err && self.retriesLeft) {

        self.retries--;
        self.addObject(entry, callback)

      } else if(err && !self.retriesLeft) {

        let err = Error('Algolia Write Failed');
        return callback(err, entry);

      } else {

        setTimeout(function() {
          return callback(null, entry);
        }, self.config.delay);

      }

    });
  }

  splitDoc(doc) {
    // @TODO
    // Algolia has a document size limit so split documents into multiple entries.

  }

  stream() {

    let self = this;

    return self.pipe(
      self.config.concurrency,
      function(entry, callback) {

        if(entry.meta.action !== 'write' || entry.meta.type !== 'Entry'){
          return callback(null, entry);
        }

        this.read(1);
        self.addObject(entry, callback);

      }
    );
  }

};

module.exports = function(config) {
    return new WriteAlgolia(config).stream();
};
