const Transform = require('../transform');

class ConvertYAML extends Transform {

  constructor(config = {}) {
    super();
    this.config = config;

    /* Options */
    this.config.concurrency = config.concurrency || 10;
    this.config.body = config.body;

    this.YAML = require('json2yaml');
    this.pipe = super.transform();
    this.getValue = super.getValue;
    this.getKey = super.getKey;
  }

  stream() {

    let self = this;

    return self.pipe(
      self.config.concurrency,
      function(entry, callback) {

        let body = self.config.body
          ? self.getValue(entry, self.config.body)
          : "";

        if(body) {
          delete entry.data.value[self.getKey(entry, self.config.body)]
        }

        // Add Fields
        entry.data.value.layout = entry.data.value.contentTypeId;
        //entry.data.value.featuredImage =

        entry.data.value = self.YAML.stringify(entry.data.value)
          + "---\n"
          + (body || "");

        return callback(null, entry);

      }
    );
  }

}

module.exports = function(config) {
    return new ConvertYAML(config).stream();
};
