const middleware = require('./dist/app.js');

const req = {
  send(message) {
    console.log(message);
  }
};

middleware(req);
