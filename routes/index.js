var express = require('express');
var router = express.Router();

var fs = require('fs');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(__dirname.slice(0, __dirname.length - 6) + 'views/index.html');
});

router.get('/api/countries', (req, res) => {
  fs.readFile('./public/countrymapping.json', (err, json) => {
      let obj = JSON.parse(json);
      res.json(obj);
  });
});


module.exports = router;
