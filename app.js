var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var mustacheExpress = require('mustache-express');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var session = require('express-session');
require('dotenv').config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var spotifyRouter = require('./routes/spotify');
var env = require('./public/env');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, '/views'));
app.engine('html', mustacheExpress());
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, 'public/images')));
app.use(express.static(path.join(__dirname, 'public/favicons')));
app.use('/fa', express.static(__dirname + '/node_modules/font-awesome/css'));
app.use(cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', spotifyRouter);

app.use(session({secret: 'secret-key',resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new TwitterStrategy({
  consumerKey: env['TWITTER_CONSUMER_KEY'],
  consumerSecret: env['TWITTER_CONSUMER_SECRET'],
  callbackURL: 'http://192.168.0.22:3000/auth/twitter/callback'
},
function(token, tokenSecret, profile, cb) {
  console.log('USER TOKEN:' + token);
  console.log('TOKEN SECRET: ' + tokenSecret);
  return done(null, profile);
}));
// Save to session
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});


app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/?auth_failed' }), 
  function (req, res) {
    res.redirect('/');
  });


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(500).render('error', {title: '500'});
});


console.log('server running at ' + env.HOSTNAME);
// console.log('server running at http://192.168.1.11:3000');

module.exports = app;
