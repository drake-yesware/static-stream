const Transform = require('../transform');

/* Creates stream with custom callback */
class Custom extends Transform {

  /**
   * Create a Stream
   * @config {object}
   *   concurrency {integer} number of parallel streams
   *   size {integer} passed to read
   *   ordered {boolean} maintains stream exit order
   */
  constructor(config = {}, cb) {

    super();
    this.config = {};

    /* Options */
    this.config.concurrency = config.concurrency || 10;
    this.config.size = config.size || 1;
    this.config.ordered = Boolean(parseInt(config.ordered));

    this.createPipe = super.transform();

    /* Create a read stream and
     * And call read() in the callback so
     * the user doesn't have to
     */
    let self = this;
    return self.createPipe(
      self.config.concurrency,
      { ordered: self.config.ordered },
      function(entry, callback, stream) {
        stream.read(self.config.size)
        cb(entry, callback);

      }
    );
  }

}


module.exports = function(config, callback) {
  return new Custom(config, callback);
};
