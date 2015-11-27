$(document).foundation();

var mRef = new Firebase('https://fakesloth.firebaseio.com/web/messages');
var uRef = new Firebase('https://fakesloth.firebaseio.com/web/users');
var socket = io('https://fakesloth-creaturephil.c9users.io/');
socket.on('connect', function() {
  console.log('hi');
});
Vue.config.debug = true;

var vm = new Vue({
  el: '#app',
  data: {
    messages: [],
    newMessage: '',
    users: [],
    currentUser: {
      beforeChooseName: '',
      name: '',
      named: false,
      choosingName: false
    }
  },
  computed: {
    userCount: function() {
      return this.users.length + (this.users.length === 1 ? ' User' : ' Users');
    },
    displayButton: function() {
      return !this.currentUser.named && !this.currentUser.choosingName;
    }
  },
  methods: {
    addMessage: function() {
      if (!this.currentUser.named || !this.newMessage) return;
      if (this.newMessage.length > 300) return;
      var m = this.currentUser.name + ': ' + this.newMessage;
      mRef.push(m);
      this.newMessage = '';
    },
    addUser: function() {
      var name = this.currentUser.name.trim();
      if (!name) return;
      this.users.$remove(this.currentUser.beforeChooseName);
      this.currentUser.named = true;
      this.currentUser.choosingName = false;
      socket.emit('name', name);
      this.users.push(name);
      uRef.set(JSON.parse(JSON.stringify(this.users)));
    },
    chooseName: function() {
      this.currentUser.beforeChooseName = this.currentUser.name;
      this.currentUser.choosingName = true;
    },
    cancelChooseName: function() {
      if (!this.currentUser.named) return;
      this.currentUser.choosingName = false;
      if (!this.currentUser.beforeChooseName) return;
      this.currentUser.name = this.currentUser.beforeChooseName;
    }
  },
  directives: {
    'focus': function (value) {
      if (!value) return;
      var el = this.el;
      Vue.nextTick(function () {
        el.focus();
      });
    }
  }
});

mRef.limitToLast(50).on('child_added', function(snapshot) {
  vm.messages.push(snapshot.val());
  Vue.nextTick(function () {
    vm.$els.chatList.scrollTop = vm.$els.chatList.scrollHeight;
  }.bind(this));
});

uRef.on('value', function(snapshot) {
  var data = snapshot.val();
  console.log(data);
  vm.users = data || [];
});

socket.on('user leave', function(name) {
  vm.users.$remove(name);
  uRef.set(JSON.parse(JSON.stringify(vm.users)));
});
