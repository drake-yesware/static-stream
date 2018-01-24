const Transform = require('../transform');

class Flatten extends Transform {

  constructor(config = {}) {

    super();
    this.getBool = super.getBool();
    this.config = {};

    /* Options */
    this.config.concurrency = config.concurrency || 10;
    this.config.ignore = config.ignore || [];
    this.config.deliminator = config.deliminator || '.';
    this.config.camelCase = config.camelCase;

    this.traverse = require('traverse');
    this.pullAll = super.pullAll();
    this.camelCase = super.camelCase();
    this.createPipe = super.transform();
  }

  /*
   * Flatten
   *   @desc Flattens Object into single depth
   *   @options
   *     useCamelCase {boolean} if camelcase should be use
   *     deliminator {string} deliminator to use in keys
   *     ignore {array} list of keys to ignore
   *
   */
  stream() {
    const self = this;

    return this.createPipe(
      this.config.concurrency,
      { ordered: false },
      function(entry, callback, stream) {

        stream.read(1);

        entry.meta.deliminator = self.config.deliminator;
        entry.meta.camelCase = self.config.camelCase;
        entry.meta.ignore = self.config.ignore;

        let data = self.traverse(entry.data.value).reduce(function(acc, x) {
          if (this.isLeaf && this.level > 0) {
            let obj = {};
            let path = this.parent.path.toString().split(',');
            path.push(this.key);

            let name = self
              .pullAll(path, self.config.ignore)
              .join(self.config.deliminator);

            name = self.config.camelCase ? self.camelCase(name) : name;

            obj[name] = x;
            acc.push(obj);
          }

          return acc;
        }, []);

        entry.data.value = Object.assign({}, ...data);

        return callback(null, entry);

      }
    );
  }
};

module.exports = function(config) {
  return new Flatten(config).stream();
};
