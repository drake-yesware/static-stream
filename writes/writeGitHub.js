const Transform = require('../transform');

class WriteGitHub extends Transform {

  constructor(config = {}) {
    super();
    this.config = config;

    /* Options */
    this.config.message = config.message || "Created by Blog Bot";
    this.config.path = config.path.replace(/\/$/, "") || "";
    this.config.token = config.token;
    this.config.repo = config.repo;
    this.config.delay = config.delay || 1000;
    this.config.maxRetries = config.maxRetries || 3;
    this.config.concurrency = config.concurrency || 1;

    this.retriesLeft = this.config.maxRetries;
    this.octonode = require('octonode');
    this.client = this.octonode.client(this.config.token);
    this.repo = this.client.repo(this.config.repo);
    this.pipe = super.transform();
  }

  create(entry, callback) {
    let self = this;
    self.repo.createContents(
      self.config.path + "/" + entry.meta.id + ".md",
      self.config.message,
      entry.data.value,
      function(err, file) {

        if(err && self.retriesLeft) {

          self.retries--;
          self.create(entry, callback)

        } else if(err && !self.retriesLeft) {

          let err = Error('GitHub Write Failed');
          return callback(err, entry);

        } else {

          setTimeout(function() {
            return callback(null, entry);
          }, self.config.delay);

        }
      }
    );
  }

  update(entry, sha, callback) {
    let self = this;
    self.repo.updateContents(
      self.config.path + "/" + entry.meta.id + ".md",
      self.config.message,
      entry.data.value,
      sha,
      function(err, file) {

        if(err && self.retriesLeft) {

          self.retries--;
          self.update(entry, sha, callback)

        } else if(err && !self.retriesLeft) {

          let err = Error('GitHub Write Failed');
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

        if(entry.meta.action !== 'write' || entry.meta.type !== "Entry") {
          return callback(null, entry);
        }

        self.repo.contents(
          self.config.path + "/" + entry.meta.id + ".md",
          function(err, file) {
            if(err && err.statusCode === 404) {
              self.create(entry, callback);
            } else {
              self.update(entry, file.sha, callback);
            }

          }
        );

      }
    );
  }

};

module.exports = function(config) {
  return new WriteGitHub(config).stream();
};
