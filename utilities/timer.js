const Transform = require('../transform');

class Timer extends Transform {
  
  constructor(config = {}) {
    
    super();
    this.config = {};

    /* Options */
    this.config.start = Boolean(parseInt(config.start));
    this.config.end = Boolean(config.end);
    this.config.log = Boolean(config.log);
    this.config.name = config.name || 'Timer';
    this.config.concurrency = config.concurrency || 1;

    /* Inherit */
    this.createPipe = super.transform();
  }

  stream() {
    let self = this;

    return self.createPipe(
      self.config.concurrency, 
      { ordered: false }, 
      function(entry, callback, stream) {

        stream.read(1);
        
        entry.meta.timings = entry.meta.timings || {};
        
        let local = entry.meta.timings[self.config.name];
        entry.meta.timings[self.config.name] = local || {};
      	entry.meta.timings[self.config.name].id = entry.meta.id;

        if(self.config.start) {
          entry.meta.timings[self.config.name].start = Date.now();
        }

        if(self.config.end) {
          entry.meta.timings[self.config.name].end = Date.now();
          entry.meta.timings[self.config.name].duration = 
            entry.meta.timings[self.config.name].end -
            entry.meta.timings[self.config.name].start;
        }

        if(self.config.log) {
          console.log(
            self.config.name + ": \n",
            entry.meta.timings[self.config.name]
          );
        }

      	return callback(null, entry);

      }
    );
  }

}

module.exports = function(config) { 
  return new Timer(config).stream();
};