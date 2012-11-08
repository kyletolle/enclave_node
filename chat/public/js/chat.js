var chat = io.connect('http://localhost:3000/chat'),
    user = {
      rooms: []
    };

chat.on('name_error', function () {
  var elem = document.getElementById('user_name');
  elem.style.background = '#ff6666';
  elem.style.border = '#990000';
  var error = document.getElementById('user_error');
  error.innerHTML = 'User name in use.';
  error.style.display = 'block';
});

chat.on('ready', function () {
  var elem = document.getElementById('blackout');
  elem.parentNode.removeChild(elem);
  join('lobby');
});

function join (room) {
  chat.emit('join', room);
  user.rooms.push(room);
  setCurrent(room);
}

function leave (room) {
  chat.emit('leave', room);
  user.rooms.splice(user.rooms.indexOf(room), 1);
  setCurrent(user.rooms[user.rooms.length - 1]);
}

function getCurrent () {
  if (user.currentRoom !== 'undefined') {
    return user.currentRoom;
  } else if (user.rooms.length == 1) {
    return user.rooms[0];
  }
}

function setCurrent (room) {
  user.currentRoom = room;
}

function positionWindow (elem) {
  var winWidth = document.documentElement.clientWidth,
      winHeight = document.documentElement.clientHeight,
      elemWidth = elem.clientWidth,
      elemHeight = elem.clientHeight;

  elem.style.left = ((winWidth / 2) - (elemWidth / 2)) + 'px';
  elem.style.top = ((winHeight / 2) - (elemHeight / 2)) + 'px';
}

function userWindow () {
  var userWindow = document.getElementById('user_info');
  positionWindow(userWindow);
  userWindow.style.visibility = 'visible';
}

window.onload = function () {
  userWindow();

  document.getElementById('user_form').addEventListener('submit', function (e) {
    e.preventDefault();
    chat.emit('register', document.getElementById('user_name').value);
  }, false);

  document.getElementById('message_form').addEventListener('submit', function (e) {
    e.preventDefault();
    var message = document.getElementById('message').value;
    chat.emit('message', {
      room: getCurrent(),
      message: message
    });
  }, false);
}