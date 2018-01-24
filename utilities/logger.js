const Transform = require('../transform');
const util = require('util');

/* Logs Incoming Stream Objects */
class Logger extends Transform {

  /**
   * Logger
   * @config {object}
   *   concurrency {integer} number of parallel streams
   *   key {string} entry key to log, uses dot notation.
   *   meta {string} meta key to log
   *   full {boolean} print full entry
   *   ordered {boolean} maintain stream exit order
   */
  constructor(config = {}) {

    super();
    this.config = {};

    /* Options */
    this.config.concurrency = config.concurrency || 10;
    this.config.key = config.key || null;
    this.config.meta = config.meta || null;
    this.config.expand = config.expand || null;
    this.config.ordered = Boolean(parseInt(config.ordered));
    this.config.full = Boolean(config.full);

    /* Inherit */
    this.createPipe = super.transform();
    this.getValue = super.getValue;
  }

  /*
   * Create Stream
   *
   */
  stream() {
    let self = this;

    return self.createPipe(
      self.config.concurrency,
      { ordered: self.config.ordered },
      function(entry, callback, stream) {

        stream.read(1);

        if(self.config.key) {
          console.log(
            self.config.key + ": \n",
            self.getValue(entry, self.config.key)
          );
        }

        if(self.config.meta) {
          console.log(
            self.config.meta + ": \n",
            entry.meta[self.config.meta]
          )
        }

        if(self.config.full) {
          let logged = self.config.expand ? util.inspect(entry, false, null) : entry;
          console.log(
            "Entry: \n",
            logged
          )
        }

      	return callback(null, entry);
      }
    );
  }

}

module.exports = function(config) {
  return new Logger(config).stream();
};
