const Transform = require('../transform');

class ConvertMarkdown extends Transform {

  constructor(config = {}) {
    super();
    this.config = config;

    /* Options */
    this.config.concurrency = config.concurrency || 5;
    this.config.body = config.body;

    this.toMarkdown = require('turndown')
    this.md = new this.toMarkdown();
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

        let body = self.config.body
          ? self.getValue(entry, self.config.body)
          : "";

        if(typeof(body) !== 'string') {
          body = "";
        }

        entry.data.value[self.config.body] = self.md.turndown(body);

        return callback(null, entry);

      }
    );
  }

}

module.exports = function(config) {
    return new ConvertMarkdown(config).stream();
};
