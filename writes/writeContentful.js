const Transform = require('../transform');
const contentful = require('contentful-management');
const async = require('async');

class WriteContentful extends Transform {

  constructor(config = {}) {
    super();
    this.config = config;

    /* Options */
    this.config.key = config.key;
    this.config.id = config.id;
    this.config.concurrency = config.concurrency || 2;
    this.config.space = config.space;
    this.config.delay = config.delay || 500;
    this.config.maxRetries = config.maxRetries || 3;

    this.retriesLeft = this.config.maxRetries;
    this.pipe = super.transform();
    this.getValue = super.getValue;

    this.client = contentful.createClient({
      accessToken: config.token
    })

  }

  addObject(entry, callback) {
    this.parseMappedObject(entry, callback);
  }

  parseMappedObject(entry, cb) {
    const obj = entry.data.value;
    const self = this;

    async.mapValues(obj, function (value, key, callback) {

      switch(value['field']) {
          case "Symbol":
            return callback(null, { 'en-US': value['value'] });;
          case "Text":
            return callback(null, { 'en-US': value['value'] });;
          case "Boolean":
            return callback(null, { 'en-US': value['value'] });;
          case "Link":
            return callback(null, {
              'en-US': {
                sys: {
                  type: 'Link',
                  linkType: 'Entry',
                  id: value['value']
                }
              }
            })
          case "Category":
            let fields = {};
            fields['en-US'] = [];
            for(let i=0, l=value['value'].length; i<l; i++) {
              fields['en-US'].push(
                {
                  sys: {
                    type: 'Link',
                    linkType: 'Entry',
                    id: value['value'][i]
                  }
                }
              )
            }
            return callback(null, fields);;
          case "Image":
            self.uploadImage(value['value']).then(function(url) {
              return callback(null, {
                'en-US': {
                  sys: {
                    type: 'Link',
                    linkType: 'Asset',
                    id: url.sys.id
                  }
                }
              });
            });
      }
    }, function(err, result) {
      // Upload to Contentful
      self.createEntry(result, entry, cb);
    });


  }

  createEntry(result, entry, cb) {
    this.client.getSpace(this.config.space)
    .then((space) => space.createEntryWithId(this.config.contentType, entry.meta.id, { fields: result }))
    .then((createdEntry) => createdEntry.publish())
    .then((createdEntry) => cb(null, entry))
  }

  uploadImage(url) {
    return this.client.getSpace(this.config.space).then((space) => space.createAsset({
      fields: {
        title: {
          'en-US': url.substr(url.lastIndexOf('/') + 1)
        },
        file: {
          'en-US': {
            contentType: 'image/png',
            fileName: url.substr(url.lastIndexOf('/') + 1),
            upload: url
          }
        }
      }
    })
    .then((asset) => asset.processForAllLocales())
    .then((asset) => asset.publish()))
  }

  stream() {

    let self = this;

    return self.pipe(
      self.config.concurrency,
      function(entry, callback) {

        this.read(1);
        if(entry.meta.skip) {
          callback(null, entry)
        } else {
          self.addObject(entry, callback);
        }

      }
    );
  }

};

module.exports = function(config) {
    return new WriteContentful(config).stream();
};
