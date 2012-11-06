var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    mongoose = require('mongoose'),
    db = mongoose.createConnection('localhost', 'test');

db.on('error', console.error.bind(console, 'connection error:'));

app.configure(function () {
  app.set('title', 'Enclave Node Demo');
});

app.configure('development', function () {
  app.set('port', 3000);
});

app.get('/', function (req, res) {
  res.sendfile(__dirname, 'index.html');
});

app.listen(app.get('port'), function () {
  console.log('App listening on port: ' + app.get('port'));
});

var groupChat = io
  .of('/chat')
  .on('connection', function (socket) {
    
  });

//io.sockets.on('connection', function (socket) {
  //socket.emit('', {});
  //socket.on('', function (data) {});
//});