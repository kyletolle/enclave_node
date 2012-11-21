var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

app.configure(function () {
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.set('view options', {layout: false});
  server.set('views', __dirname + '/public/views');
});

app.configure('development', function () {
  app.set('port', 3000);
});

app.configure('production', function () {
  app.set('port', 8080);
});

app.get('/', function (req, res) {
  res.render('index');
});

app.listen(app.get('port'), function () {
  console.log('App listening on port: ' + app.get('port'));
});

var newGameId = function () {
  var id = [],
      itoh = '0123456789ABCDEF';

  for (var i = 0; i < 36; i++) {
    id[i] = Math.floor(Math.random() * 0x10);
  }

  id[14] = 4;
  id[19] = (id[19] & 0x3) | 0x8;

  for (var i = 0; i < 36; i++) {
    id[i] = itoh[id[i]];
  }

  id[8] = id[13] = id[18] = id[23] = '-';
  
  return id.join('');
};

var users = [];

var games = io
  .of('games')
  .on('connection', function (socket) {
    socket.on('register', function (name) {
      if (users.indexOf(name) == -1) {
        users.push(name);
        socket.set('nick', name, function () {
          socket.emit('ready');
        });
      } else {
        socket.emit('name_error');
      }
    });

    socket.on('join', function () {
      var games = io.sockets.manager.rooms,
          openGame = false;

      for (var id in games) {
        if (games[id].length == 1) {
          socket.join(id);
          openGame = true;
        }
      }

      if (!openGame) {
        socket.join(newGameId());
      }
    });

    socket.on('leave', function (gameId) {
      socket.leave(gameId);
    });
  });