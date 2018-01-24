const Transform = require('../transform');

class Wait extends Transform {
  
  constructor(config = {}) {
    
    super();
    this.config = {};
    
    /* Options */
    this.config.duration = config.duration || 0;
    this.config.random = Boolean(config.random);
    this.config.concurrency = config.concurrency || 1;
    
    /* Inherit */
    this.createPipe = super.transform();
  }

  stream() {
    let self = this;

    return self.createPipe(
      self.config.concurrency, { ordered: false }, 
      function(entry, callback, stream) {

        stream.read(1);
        
        const waitTime = self.config.random ? 
          Math.floor(Math.random() * self.config.duration) : 
          self.config.duration;
        entry.meta.waitTime = waitTime;

        setTimeout(function() {
          return callback(null, entry);
        }, waitTime)
      	
      }
    );
  }

}

module.exports = function(config) { 
  return new Wait(config).stream();
};