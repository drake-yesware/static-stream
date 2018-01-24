const Readable = require('stream').Readable
const fs = require('fs')
const ldj = require('ldjson-stream')
const xmlNodes = require('xml-nodes')
const xmlObjects = require('xml-objects')
const pumpify = require('pumpify')
const extend = require('extend')
const transform = require('parallel-transform')


class Xml {

  constructor(config) {

    const m = transform(10, { objectMode: true }, function(entry, callback) {
      const obj = {};
      obj.meta = { id: entry.title };
      obj.data = { value: JSON.parse(entry) };
      return callback(null, obj)
    });

    this.config = {};
    this.stream = fs.createReadStream(config.path);
    this.converter = this.convert(config.elementName, [])
    return this.stream.pipe(this.converter).pipe(ldj.serialize()).pipe(m)

  }

  convert(nodeFilter, opts) {
    var nodes = xmlNodes(nodeFilter)
    var objOpts = extend({explicitRoot: false, explicitArray: false, mergeAttrs: true}, opts)
    var objects = xmlObjects(objOpts)
    return pumpify.obj(nodes, objects)
  }
}

module.exports = function(config) {
  return new Xml(config);
};
