'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const session = require('express-session');
const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const bcrypt = require('bcrypt');
const auth = require('./auth.js');
const flash = require('connect-flash');
const Filter = require('bad-words');
const filter = new Filter();
const routes = require('./routes.js');

const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.set('view engine', 'pug')
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store: store
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);
fccTesting(app); //For FCC testing purposes

myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');
  const myPosts = await client.db('database').collection('posts');
  routes(app, myDataBase, myPosts);
  auth(app, myDataBase, myPosts);
  
  let currentUsers = 0;
  
  io.on('connection', socket => {
    console.log('A user has connected');
    ++currentUsers;
    io.emit('user', {
        name: socket.request.user.username,
        currentUsers,
        connected: true
    });
    socket.on('chat message', (message) => {
      const msg = filter.clean(message);
      io.emit('chat message', { name: socket.request.user.username, message: msg });
    });
    socket.on('disconnect', () => {
      console.log('A user has disconnected');
      --currentUsers;
      io.emit('user', {
        name: socket.request.user.username,
        currentUsers,
        connected: false
      });
    });
  });
  
  app.use((req, res, next) => {
    res.status(404).type('text').send('Not Found');
  });
  
  http.listen(process.env.PORT || 3000, () => {
    console.log('Listening on port ' + process.env.PORT);
  }); 



}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug/index.pug', { title: e, message: 'Unable to login' });
  });
});


function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}



