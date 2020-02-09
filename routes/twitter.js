var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var env = require('../public/env'); //environment variables
var express = require('express');
var router = express.Router();

// Define routes.
router.get('/',
  function (req, res) {
    res.render('home', { user: req.user });
  });

router.get('/login',
  function (req, res) {
    console.log('ENV');
    console.log(env);
    console.log('Headers:');
    console.log(req.headers)
    res.render('index');
    console.log(res);
  });

router.get('/login/twitter',
  passport.authenticate('twitter'));

router.get('/oauth/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
  });

router.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function (req, res) {
    res.render('profile', { user: req.user });
  });

router.get('/logout',
  function (req, res) {
    req.session.destroy(function (err) {
      res.redirect('/');
    });
  });

module.exports = router;