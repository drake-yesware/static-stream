const Readable = require('stream').Readable;
const csv = require('csv');
const fs = require('fs');
const transform = require('parallel-transform');


class Csv {

  constructor(config) {

    const m = transform(10, { objectMode: true }, function(entry, callback) {
      const obj = {};
      obj.meta = { id: entry.ID, skip: false };
      obj.data = { value: entry };
      return callback(null, obj)
    });

    return fs.createReadStream(config.path)
      .pipe(csv.parse({ columns: true }))
      .pipe(csv.transform(config.mapper || function(v) { return v} ))
      .pipe(m);

  }

}

module.exports = function(config) {
  return new Csv(config);
};
