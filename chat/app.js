var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);
    //mongoose = require('mongoose'),
    //db = mongoose.createConnection('localhost', 'test');

//db.on('error', console.error.bind(console, 'connection error:'));

app.configure(function () {
  app.set('title', 'Enclave Node Demo');
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
  app.set('port', 3000);
});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

server.listen(app.get('port'), function () {
  console.log('App listening on port: ' + app.get('port'));
});

var replacements = {
  '&': '&amp',
  '<': '&lt',
  '>': '&gt'
};

function replaceTag (tag) {
  return replacements[tag] || tag;
}

function safeReplace (str) {
  return str.replace(/[&<>]/g, replaceTag);
}

var users = [];

var groupChat = io
  .of('/chat')
  .on('connection', function (socket) {
    socket.on('register', function (name) {
      if (users.indexOf(name) == -1) {
        users.push(name);
        socket.set('nick', name, function () {
          socket.emit('ready', name);
          socket.broadcast.emit('connected', {user: name});
        });
      } else {
        socket.emit('name_error');
      }
    });

    socket.on('join', function (roomName) {
      socket.join(roomName);
      socket.emit('joined', roomName);
    });

    socket.on('leave', function (roomName) {
      socket.leave(roomName);
    });

    socket.on('message', function (data) {
      var msg = {
        content: safeReplace(data.message),
        timestamp: data.timestamp,
        room: data.room
      };

      socket.get('nick', function (err, name) {
        msg.user = name;
      });

      var currentRoom = '/chat/' + data.room;

      //io.sockets.in(currentRoom).emit('message', msg);
      socket.broadcast.emit('message', msg);
    });

    socket.on('list_users', function (room) {
      socket.emit('users', {
        users: io.sockets.clients(room)
      });
    });

    socket.on('list_rooms', function () {
      socket.emit('rooms', {
        // xyz
      });
    });

    socket.on('system', function (data) {
      //io.sockets.in(data.room).emit();
    });

    socket.on('disconnect', function () {
      var msg = {};

      socket.get('nick', function (err, name) {
        msg.user = name;
        users.splice(users.indexOf(name), 1);
      });

      socket.broadcast.emit('disconnected', msg);
    });
  });