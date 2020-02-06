var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var mustacheExpress = require('mustache-express');
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
app.use('/api', spotifyRouter)
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
