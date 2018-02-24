const Asset = require('../Asset');
const toml = require('toml');
const serializeObject = require('../utils/serializeObject');

class TOMLAsset extends Asset {
  constructor(name, pkg, options) {
    super(name, pkg, options);
    this.type = 'js';
  }

  parse(code) {
    return toml.parse(code);
  }

  generate() {
    return {
      js: serializeObject(this.ast, this.options.minify)
    };
  }
}

module.exports = TOMLAsset;
