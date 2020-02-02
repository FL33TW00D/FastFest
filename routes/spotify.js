var express = require('express'); // Express web server framework
var router = express.Router();
var request = require('request'); // "Request" library
const fetch = require('node-fetch');
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 900, checkperiod: 0, deleteOnExpire: true });

var client_id = '227a07d727b84fc38f34b255cbc1944f'; // Your client id
var client_secret = '4bf79f41ea064a5ba58f26a557b1bb7f'; // Your secret
var redirect_uri = process.env.BASE_URI + '/api/callback'; // Your redirect uri
console.log(redirect_uri);
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';


/**
 * Handles login
 * Scope variable controls which permissions will be requested from the user
 */
router.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);
  console.log(req.headers);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

/**
 * Handles return when authenticated
 */
router.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });
        
        // we can also pass the token to the browser to make requests from there
        res.redirect(process.env.BASE_URI + '/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

/**
 * Handles token refresh if user logged in over token lifetime
 */
router.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

router.get('/skiddle', async function(req, res) {
  if (cache.get('skiddle')) {
    res.write(cache.get('skiddle'));
    res.end();
  }
  else {
    let festivals = [];
    let pages = 0;
    await fetch('http://www.skiddle.com/api/v1/events/search/?api_key=62a2932a3c0079d4f2d0dd00abfade5f&eventcode=FEST&description=1&order=goingto&limit=100')
        .then(response => response.json())
        .then(data => {
            pages = Math.ceil(data.totalcount / 100);
            festivals.push.apply(festivals, data.results);
        });

    let base = 100;
    for (let i = 1; i < pages; i++){
        await fetch(`http://www.skiddle.com/api/v1/events/search/?api_key=62a2932a3c0079d4f2d0dd00abfade5f&eventcode=FEST&description=1&order=goingto&limit=100&offset=${base}`)
            .then(response => response.json())
            .then(data => {
                festivals.push.apply(festivals, data.results);
            });
        base += 100;
    }

    res.write(JSON.stringify(festivals));
    res.end();

    cache.set('skiddle', JSON.stringify(festivals))
  }
})

module.exports = router;
