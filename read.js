const Readable = require('stream').Readable;

class Read extends Readable {

	_read(size) {
	  while (this.push( this.pull() ) ) {
      this.push( this.pull() );
    }
	}

	set onPull(callback) {
    this._onPull = callback;
  }

  pull() {
    let data = this._onPull();
    return data || null;
  }

};

module.exports = function(callback) {
  return new Read({ objectMode: true });
};