var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var env = require('../public/env'); //environment variables
var router = express.Router();
var trustProxy = false;
if (env.DYNO) {
  // Apps on heroku are behind a trusted proxy
  trustProxy = true;
}

passport.use(new Strategy({
    consumerKey: env['TWITTER_CONSUMER_KEY'],
    consumerSecret: env['TWITTER_CONSUMER_SECRET'],
    callbackURL: 'http://192.168.0.22:3000'
  },
  function(token, tokenSecret, profile, cb) {
    // In this example, the user's Twitter profile is supplied as the user
    // record.  In a production-quality application, the Twitter profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    return cb(null, profile);
  }));

  passport.serializeUser(function(user, cb) {
    cb(null, user);
  });
  
  passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
  });

  router.get("/login/success", (req, res) => {
    if (req.user) {
      res.json({
        success: true,
        message: "user has successfully authenticated",
        user: req.user,
        cookies: req.cookies
      });
    }
  });
  
  // when login failed, send failed msg
  router.get("/login/failed", (req, res) => {
    res.status(401).json({
      success: false,
      message: "user failed to authenticate."
    });
  });
  
  // When logout, redirect to client
  router.get("/logout", (req, res) => {
    req.logout();
    res.redirect(CLIENT_HOME_PAGE_URL);
  });
  
  // auth with twitter
  router.get("/twitter", passport.authenticate("twitter"));
  
  // redirect to home page after successfully login via twitter
  router.get(
    "/twitter/redirect",
    passport.authenticate("twitter", {
      successRedirect: CLIENT_HOME_PAGE_URL,
      failureRedirect: "/auth/login/failed"
    })
  );

  module.exports = router;