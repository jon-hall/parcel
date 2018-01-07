function middleware(req) {
  req.send('Test!');
}

module.exports = middleware;
