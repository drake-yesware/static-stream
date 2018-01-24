const Transform = require('../transform');
const objectMapper = require('object-mapper');

class Map extends Transform {

  constructor(config = {}) {
    super();
    this.config = config;

    /* Options */
    this.config.concurrency = config.concurrency || 5;
    this.config.body = config.body;
    this.config.mapping = config.mapping;
    this.pipe = super.transform();
    this.getValue = super.getValue;
  }

  stream() {

    let self = this;

    return self.pipe(
      self.config.concurrency,
      function(entry, callback, stream) {
        this.read(1)
        if(entry.meta.skip) {
          return callback(null, entry);
        }
        entry.data.value = objectMapper(entry.data.value, self.config.mapping);
        return callback(null, entry);

      }
    );
  }

}

module.exports = function(config) {
    return new Map(config).stream();
};
