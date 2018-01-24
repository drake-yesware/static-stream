const Transform = require('../transform');

class DeleteGitHub extends Transform {
  
  constructor(config = {}) {
    super();
    this.config = config;

    /* Options */
    this.config.message = config.message || "Created by Blog Bot";
    this.config.path = config.path.replace(/\/$/, "") || "";
    this.config.token = config.token;
    this.config.repo = config.repo;
    this.config.delay = config.delay || 2000;
    this.config.maxRetries = config.maxRetries || 3;
    this.config.concurrency = config.concurrency || 1;
    
    this.retriesLeft = this.config.maxRetries;
    this.octonode = require('octonode');
    this.client = this.octonode.client(this.config.token);
    this.repo = this.client.repo(this.config.repo);
    this.pipe = super.transform();
  }

  delete(entry, sha, callback) {
    let self = this;
    self.repo.deleteContents(
      files.path,
      self.config.message,
      entry.data,
      files.sha,
      function(err, files) {
        
        if(err && self.retriesLeft) {
          
          self.retries--;
          self.delete(entry, sha, callback)

        } else if(err && !self.retriesLeft) {
          
          let err = Error('GitHub Delete Failed');
          return callback(err, entry);

        } else {
          
          setTimeout(function() {
            return callback(null, entry);
          }, self.config.delay);

        }
      }

    );
  }

  stream() {
    
    const self = this;

    return self.pipe(
      self.config.concurrency,
      function(entry, callback) {

      /* @todo
       * Validate entry.data has been stringified
       */ 

        this.read(1);

        if(entry.meta.type !== 'write') {
          return callback(null, entry);
        }

        self.repo.contents(
          self.config.path + "/" + entry.meta.id,
          function(err, files) {
            if(err && err.statusCode === 404) {
              return callback(null, entry);
            } else {
              self.delete(entry, files, callback);
            }

          }
        );
      
      }
    );
  }

};

module.exports = function(config) { 
  return new DeleteGitHub(config).stream();
};
