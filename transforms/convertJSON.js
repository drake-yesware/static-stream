const Transform = require('../transform');

class ConvertJSON extends Transform {
  
  constructor(config = {}) {
    super();
    this.createPipe = super.transform();
  }

  stream() {
    return this.create.Pipe(
      this.config.concurrency,
      function(entry, callback) {
      	entry.data = JSON.parse(entry.data);
      	return callback(null, entry);
      }
    );
  }

}

module.exports = { 
  initialize: function(config) { 
    return new ConvertJSON(config).stream();
  }
};