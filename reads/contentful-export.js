const Readable = require('stream').Readable;
var spaceExport = require('contentful-export')

class ContentfulExport extends Readable {

  set configure(config) {

    this.config = {};
    this.entries = [];
    this.response = {};
    this.config.space = config.space;
    this.config.managementToken = config.managementToken;
    this.config.maxAllowedItems = config.maxAllowedItems;
    this.config.errorLogFile = config.errorLogFile;
    this.config.types = config.types || ["entries"]

  }

  _read(size) {

    if(this.response.contentTypes && !this.entries.length && !this.config.types.length) {
      return this.push(null);
    }

    if(this.entries.length) {
      return this.push(this.entries.shift());
    }

    if(this.response.contentTypes) {
      this.entries = this.response[this.config.types.shift()]
          .map(entry => {
            console.log(entry)
            const obj = {};
            obj.data = {};
            obj.data.value = entry;
            obj.meta = {};
            obj.meta.id = entry.sys.id
            return obj;
      });
      return this.push(this.entries.shift());
    }

    const options = {
      spaceId: this.config.space,
      managementToken: this.config.managementToken,
      maxAllowedItems: this.config.maxAllowedItems || 100,
      errorLogFile: this.config.errorLogFile || './export-log',
      saveFile: false
    };
    
    const self = this;

    spaceExport(options)
    .then((output) => {
      self.response = output;
      self.entries = self.response[self.config.types.shift()]
      .map(entry => {
        const obj = {};
        obj.data = {};
        obj.data.value = entry;
        obj.meta = {};
        obj.meta.id = entry.sys.id
        return obj;
      });
      this.push(self.entries.shift())
    })
    .catch((err) => {
      console.error(err)
    });

  }

  
}

module.exports = function(config) { 
  const klass = new ContentfulExport({ objectMode: true });
  klass.configure = config;
  return klass;
};
