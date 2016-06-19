var express = require('express');
var router = express.Router();
var auth = require('../auth');

/* GET home page. */
router.get('/', auth.loggedIn, function(req, res, next) {
  res.render('index', { user: req.user });
});

router.get('/login', function(req, res, next) {
  res.render('login', {});
})

module.exports = router;
