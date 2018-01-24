const transform = require('parallel-transform');
const camelCase = require('lodash.camelcase');
const pullAll = require('lodash.pullall');

class Transform {

  transform() {

    return function(concurrency, config, subCb) {

      return transform(concurrency, config, function(entry, topCb) {

        if(!Object.isFrozen(entry)) {
          Object.freeze(entry);
        }

        if(!Object.isSealed(entry.meta.id)) {
          Object.seal(entry);
        }

        subCb(entry, topCb, this);
      
      })
    }
  }

  camelCase() {
  	return camelCase;
  }

  pullAll() {
  	return pullAll;
  }

  getBool(v) {
    if (typeof v === 'boolean') { return v; }
    v = !isNaN(v) ? parseInt(v) : v;
    switch (typeof v) {
      case "number":
        return Boolean(v);
      case "string":
        return v.toLowerCase() === "true" ? true : false;
      default:
        return false;
    }
  }

  getValue(entry, key) {

  	key = key.split('.');
  	key = pullAll(key, entry.meta.ignore)
	  .join(entry.meta.deliminator);

  	if(entry.meta.camelCase) {
  	  return entry.data.value[camelCase(key)]
  	} else {
  	  return entry.data.value[key];
  	}

  }

  getKey(entry, key) {

    key = key.split('.');
    key = pullAll(key, entry.meta.ignore)
    .join(entry.meta.deliminator);

    return entry.meta.camelCase
      ? camelCase(key)
      : key;

  }
};

module.exports = Transform;
