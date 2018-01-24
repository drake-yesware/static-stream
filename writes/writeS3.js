const Transform = require('../transform');
const AWS = require('aws-sdk');
const request = require('request');
const async = require('async');

class WriteS3 extends Transform {

  constructor(config = {}) {
    super();
    this.config = config;

    /* Options */
    this.s3 = new AWS.S3();
    this.config.bucket = config.bucket;
    this.config.path = config.path;
    this.config.replace = config.replace;
    this.config.field = config.field;
    this.config.where = config.where || [];
    this.config.with = config.with;
    this.config.concurrency = config.concurrency || 5;

    this.pipe = super.transform();
  }

  parseImageSource(matches) {
    if(!matches || !matches[0]) {
      return [];
    }
    return matches.map(function(url) {
      return {
        url: url,
        key: url.substr(url.lastIndexOf('/') + 1)
      };
    });
  }

  parseTextInput(entry) {
    // get an array of all the images to be fetched
    let matches = []
    for(let i=0, l=this.config.where.length; i<l; i++) {
      matches = matches.concat(entry.data.value[this.config.field].match(this.config.where[i]))
    }
    return matches;
  }

  parse(entry, callback) {
    let matches = this.parseTextInput(entry);
    console.log(matches)
    let images = this.parseImageSource(matches);
    console.log(images)
    this.fetchUploadReplace(images, entry, callback);
  }

  fetchUploadReplace(images, entry, callback) {
    const self = this;
    if(!images.length) {
      return callback(null, entry)
    }
    async.each(images, function (image, cb) {

      request({
        url: image.url,
        encoding: null
      }, function(err, res, body) {

        self.s3.putObject({
            Bucket: self.config.bucket,
            Key: self.config.path + image.key,
            ContentType: res.headers['content-type'],
            ContentLength: res.headers['content-length'],
            Body: body // buffer
        }, function(err) {

          if(self.config.replace) {
            entry.data.value[self.config.field]
              = entry.data.value[self.config.field].replace(image.url, self.config.with + image.key)
          }

          return cb(null);

        });

      });

    }, function (err) {
      return callback(null, entry)
    });
  }


  stream() {

    const self = this;

    return self.pipe(
      self.config.concurrency,
      function(entry, callback, stream) {

        this.read(1);

      /* @todo
       * Validate entry.data has been stringified
       */

        if(entry.meta.skip) {
          callback(null, entry);
        } else {
          self.parse(entry, callback);
        }

      }
    );
  }

};

module.exports = function(config) {
  return new WriteS3(config).stream();
};
