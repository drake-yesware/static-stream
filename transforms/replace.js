const Transform = require('../transform');

class Replace extends Transform {

  constructor(config = {}) {
    super();
    this.config = config;

    /* Options */
    this.config.concurrency = config.concurrency || 5;
    this.config.field = config.field;
    this.pipe = super.transform();
    this.getValue = super.getValue;
  }

  stream() {

    let self = this;

    return self.pipe(
      self.config.concurrency,
      function(entry, callback, stream) {

        let body = self.config.field
          ? self.getValue(entry, self.config.field)
          : "";

        if(typeof(body) !== 'string') {
          body = "";
        }

        entry.data.value[self.config.field] = body.replace(self.config.regex, self.config.with);

        return callback(null, entry);

      }
    );
  }

}

module.exports = function(config) {
    return new Replace(config).stream();
};
