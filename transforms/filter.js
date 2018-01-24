const Transform = require('../transform');

/* Creates stream with custom callback */
class Filter extends Transform {

  /**
   * Create a Stream
   * @config {object}
   *   concurrency {integer} number of parallel streams
   *   size {integer} passed to read
   *   ordered {boolean} maintains stream exit order
   */
  constructor(config = {}, userCb) {

    super();
    this.config = {};

    /* Options */
    this.config.concurrency = config.concurrency || 1;
    this.config.size = config.size || 1;
    this.config.ordered = Boolean(parseInt(config.ordered));
    this.config.key = config.key;
    this.config.meta = config.meta;

    this.createPipe = super.transform();
    this.getValue = super.getValue;

    /* Create a read stream and
     * And call read() in the callback so
     * the user doesn't have to
     */
    let self = this;

    return self.createPipe(
      self.config.concurrency,
      { ordered: self.config.ordered },
      function(entry, subCb, stream) {

        stream.read(self.config.size)

        let send = entry;

        if(self.config.key) {
          send = self.getValue(entry, self.config.key)
        }

        if(self.config.meta) {
          send = entry.meta[self.config.meta]
        }

        userCb(send, function(bool) {
          if(bool) {
            return subCb(null, entry);
          } else {
            entry.meta.skip = true;
            return subCb(null, entry);
          }

        });

      }
    );
  }

}

module.exports = function(config, callback) {
  return new Filter(config, callback);
};
