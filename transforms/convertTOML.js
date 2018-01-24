const Transform = require('../transform');

class ConvertTOML extends Transform {
  
  constructor(config = {}) {
    super();
    this.config = config;

    /* Options */
    this.config.concurrency = config.concurrency || 5;
    this.config.body = config.body;

    this.TOML = require('json2toml');
    this.pipe = super.transform();
    this.getValue = super.getValue;
  }

  stream() {

    let self = this;
    
    return self.pipe(
      self.config.concurrency,
      function(entry, callback, stream) {
      
        let body = self.config.body 
          ? self.getValue(entry, self.config.body) 
          : "";
        
        entry.data.value = self.TOML(entry.data) 
          + "---\n"
          + body;
        
        return callback(null, entry);
   
      }
    );
  }

}

module.exports = function(config) { 
    return new ConvertTOML(config).stream();
};
