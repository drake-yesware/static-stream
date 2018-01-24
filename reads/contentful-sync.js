const Readable = require('stream').Readable;

class Contentful extends Readable {

  set configure(config) {

    this.config = {};
    this.nextSyncToken = config.nextSyncToken || null;
    this.config.resolveLinks = config.resolveLinks || true;
    this.lastSyncTime = Date.now();
    this.config.initial = Boolean(this.nextSyncToken)
      ? false
      : Boolean(parseInt(config.initial));

    this.skip = 0;
    this.entries = [];

    this.contentful = require('contentful');

    this.client = this.contentful.createClient({
      space: config.space,
      accessToken: config.token
    })

  }

  _read(size) {

    const reqOpts = {
      initial: this.config.initial
    };

    if(!reqOpts.initial && this.nextSyncToken) {
      reqOpts.nextSyncToken = this.nextSyncToken;
    }

    const self = this;

    if(this.entries.length) {
      return this.push(this.entries.shift());
    }

    this.client.sync(reqOpts).then(function(res) {
      self.nextSyncToken = res.nextSyncToken;
      self.lastSyncTime = Date.now();
      self.config.initial = false;
      self.entries = self.sync(res)

      self.push(self.entries.shift() || null);

    }).catch(function(err) {
      console.log(err);
    });;

  }

  parseWrite(entry) {
    return {
      data: {
        value: entry,
      },
      meta: {
        id: entry.sys.id,
        type: entry.sys.type,
        action: "write",
        nextSyncToken: this.nextSyncToken,
        lastSyncTime: this.lastSyncTime
      }
    };
  }

  parseDelete(entry) {
    return {
      data: {
        value: entry
      },
      meta: {
        id: entry.sys.id,
        type: entry.sys.type,
        action: "delete",
        nextSyncToken: this.nextSyncToken,
        lastSyncTime: this.lastSyncTime
      }
    };
  }

  sync(res) {

    if(res.skip + res.limit < res.total) {
      this.skip += res.limit
    }

    if(!res) {
      return null;
    }

    return [].concat(
      res.deletedEntries.map(this.parseDelete.bind(this)),
      res.entries.map(this.parseWrite.bind(this))
    );

  }

}

module.exports = function(config) {
  const klass = new Contentful({ objectMode: true });
  klass.configure = config;
  return klass;
};
