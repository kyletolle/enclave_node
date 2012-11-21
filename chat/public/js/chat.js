var App = {};

var chat = App.chat = io.connect('http://10.1.10.36:3000/chat');

chat.on('name_error', function () {
  console.log('name_error');
});

chat.on('ready', function (name) {
  app.models.user.set('name', name);
  app.navigate('/', true);
  app.models.user.join('lobby');
});

chat.on('message', function (msg) {
  var room = app.models.rooms.where({name: msg.room})[0];
  room.addToBuffer({user: msg.user, content: msg.content});
});

chat.on('joined', function (name) {
  var rooms = app.models.rooms;

  rooms.push(new App.Models.Room({
    name: name
  }));

  var roomView = new App.Views.Room({model: rooms.last()});
  app.appView.showView(roomView);
});

chat.on('connected', function (msg) {
  var room = app.models.rooms.where({name: 'lobby'})[0];
  room.addToBuffer({user: 'System', content: 'User: ' + msg.user + ' has connected.'});
});

chat.on('disconnected', function (msg) {
  var room = app.models.rooms.where({name: 'lobby'})[0];
  room.addToBuffer({user: 'System', content: 'User: ' + msg.user + ' has disconnected.'});
});

Backbone.View.prototype.close = function () {
  if ('subViews' in this) {
    for (var view in this.subViews) {
      var thisView = this.subViews[view];

      if (thisView instanceof Array) {
        for (var i = 0, len = thisView.length; i < len; i++) {
          thisView[i].close();
        }
      } else {
        thisView.close();
      }
    }
  }
  
  this.remove();
  this.unbind();

  if (this.onClose) this.onClose();
};

(function(App) {
  App.Models = {};
  App.Views = {};
  App.Routers = {};

  App.AppView = function () {
    this.showView = function (view) {
      if (this.currentView) this.currentView.close();

      this.currentView = view;
      this.currentView.render();

      if ('subViews' in this.currentView) {
        for (var sv in this.currentView.subViews) {
          var subView = this.currentView.subViews[sv];

          if (subView instanceof Array) {
            for (var i = 0, len = subView.length; i < len; i++) {
              subView[i].render(this.currentView.el);
            }
          } else {
            subView.render(this.currentView.el);
          }
        }
      }
      $('#content').html(this.currentView.el);
    }
  };

  App.Models.Room = Backbone.Model.extend({
    initialize: function () {
      this.set({
        buffer: []
      });
    },
    addToBuffer: function (msg) {
      var buffer = this.get('buffer');
      if (buffer.length > 30)
        buffer.shift();
      buffer.push(msg);

      app.appView.currentView.messages.push(new App.Views.Message({model: new App.Models.Message(msg)}));
      app.appView.currentView.messages[app.appView.currentView.messages.length - 1].render();
    },
    displayBuffer: function () {}
  });

  App.Models.Rooms = Backbone.Collection.extend({
    model: App.Models.Room
  });

  App.Models.Message = Backbone.Model.extend({});

  App.Models.User = Backbone.Model.extend({
    initialize: function () {
      this.set({
        rooms: []
      });
    },

    join: function (name) {
      this.get('rooms').push(name);
      this.set('currentRoom', name);
      chat.emit('join', name);
    },

    leave: function (name) {
      var rooms = this.get('rooms');
      rooms.splice(rooms.indexOf(name), 1);
      chat.emit('leave', name);
    },

    getCurrent: function () {
      var room = this.get('currentRoom');
      
      if (room === 'undefined') {
        var rooms = this.get('rooms');
        if (rooms.length == 1) {
          room = rooms[0];
        }
      }

      return room;
    },
    
    setCurrent: function (name) {
      this.set('currentRoom', name);
    }
  });

  App.Views.Message = Backbone.View.extend({
    events: {},
    initialize: function () {
      this.template = _.template($('#message-template').html());
      _.bindAll(this, 'render');
    },
    render: function () {
      $(this.el).html(this.template());
      $(this.el).appendTo('#messages');
      $('#messages').scrollTop(1000000);
      return this;
    }
  });

  App.Views.Room = Backbone.View.extend({
    events: {
      'click #submit': 'submitMessage'
    },
    initialize: function () {
      this.template = _.template($('#room-template').html());
      this.messages = [];
      _.bindAll(this, 'render');
    },
    render: function () {
      $(this.el).html(this.template());
      return this;
    },
    submitMessage: function (e) {
      e.preventDefault();

      chat.emit('message', {
        message: $('#message').val(),
        timestamp: +(new Date()),
        room: app.models.user.getCurrent()
      });

      var room = app.models.rooms.where({name: app.models.user.getCurrent()})[0];
      room.addToBuffer({user: app.models.user.get('name'), content: $('#message').val()});

      $('#message').val('').focus();
    }
  });

  App.Views.Login = Backbone.View.extend({
    //template: _.template($('#user-template').html()),
    events: {
      'click #user_submit': 'submitUser'
    },
    initialize: function () {
      this.template = _.template($('#user-template').html());
      this.subViews = {};
      _.bindAll(this, 'render');
    },
    render: function () {
      $(this.el).html(this.template());
      return this;
    },
    submitUser: function (e) {
      e.preventDefault();
      var name = $('#user_name').val();
      chat.emit('register', name);
    }
  });

  App.Views.Index = Backbone.View.extend({
    events: {
      'click #submit': 'submitMessage'
    },
    initialize: function () {
      this.template = _.template($('#chat-template').html());
      this.subViews = {};
      _.bindAll(this, 'render');
    },
    render: function () {
      $(this.el).html(this.template());
      return this;
    },
    submitMessage: function (e) {
      e.preventDefault();
    }
  });

  App.Routers.MyApp = Backbone.Router.extend({
    models: {},
    views: {},
    routes: {
      '': 'index',
      'login': 'login'
    },
    initialize: function () {
      this.appView = new App.AppView();
    },
    index: function () {
      if (this.models.user.get('name') === undefined) {
        this.navigate('/login', true);
      } else {
        console.log(this.models.user.get('name'));
        var view = new App.Views.Index();
        this.appView.showView(view);
      }
    },
    login: function () {
      console.log('login');
      var view = new App.Views.Login();
      this.appView.showView(view);
    }
  });

  App.init = function () {
    window.app = new App.Routers.MyApp();
    app.models.user = new App.Models.User();
    app.models.rooms = new App.Models.Rooms();
    Backbone.history.start();
  };
})(App);

$(document).ready(function () {
  App.init();
});
/*
function positionWindow (elem) {
  var winWidth = document.documentElement.clientWidth,
      winHeight = document.documentElement.clientHeight,
      elemWidth = elem.clientWidth,
      elemHeight = elem.clientHeight;

  elem.style.left = ((winWidth / 2) - (elemWidth / 2)) + 'px';
  elem.style.top = ((winHeight / 2) - (elemHeight / 2)) + 'px';
}
*/