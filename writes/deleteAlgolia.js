const Transform = require('../transform');

class DeleteAlgolia extends Transform {
  
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

  deleteObject(entry, callback) {
    let self = this;

    self.index = self.client.initIndex(entry.meta.index || this.config.index);
    self.index.deleteObject(entry.meta.id, function(err, content) {

      if(err && self.retriesLeft) {

        self.retries--;
        self.deleteObject(entry, callback)

      } else if(err && !self.retriesLeft) {

        let err = Error('Algolia Delete Failed');
        return callback(err, entry);

      } else {

        setTimeout(function() {
          return callback(null, entry);
        }, self.config.delay);

      }

    });
  }

  stream() {

    let self = this;
    
    return self.pipe(
      self.config.concurrency,
      function(entry, callback, stream) {
        
        if(entry.meta.type !== 'delete'){
          return callback(null, entry);
        }

        stream.read(1);
        self.deleteObject(entry, callback);
        
      }
    );
  }

};

module.exports = function(config) { 
    return new DeleteAlgolia(config).stream();
};
