var express = require('express'),
    server = express();

server.configure(function () {
  // log every request
  server.use(function (req, res, next) {
    console.log('%s %s', req.method, req.url);
    next();
  });

  // give router preference > static assets
  server.use(server.router);

  // handle html files using template engine
  server.engine('html', require('ejs').renderFile);
  server.set('view engine', 'html');
  server.set('view options', {layout: false});

  // tell express where to find your templates
  server.set('views', __dirname + '/public/views');

  // static assets directory
  server.use(express.static(__dirname + '/public'));
});

// specify options in development mode
server.configure('development', function () {
  server.set('port', 3000);
});

// specify options in production mode
server.configure('production', function () {
  server.set('port', 8080);
});

// trivial "middleware" example
function luckyNumber (req, res, next) {
  var num = Math.floor(Math.random() * 10) + 1;

  if (num >= 2) {
    next();
  } else {
    res.send(403, 'Bad joss! You drew a: ' + num);
  }
}

// server route(s); server.VERB {get, post, etc.}
server.get('/', luckyNumber, function (req, res) {
  res.render('index');
});

// tell server to listen on specified port
// execute callback function if successful
server.listen(server.get('port'), function () {
  console.log('Server listening on port: ' + server.get('port'));
});