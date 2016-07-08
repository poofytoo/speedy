var express = require('express');
var router = express.Router();
var auth = require('../auth');
var firebaseRef = require('../firebase');

/* GET home page. */
router.get('/play', auth.loggedIn, function(req, res, next) {
  res.render('index', { user: req.user });
});

router.get('/highscores', auth.loggedIn, function(req, res, next) {
  var sent = false;
  getScores(req.user.id, function(scores) {
    if (!sent) {
      sent = true;
      res.render('highscores', { user: req.user, scores: scores});
    }
  })
})

router.get('/', function(req, res, next) {
  res.render('login', {layout: 'login_layout'});
});

router.get('/logout', function(req, res) {
  req.logout();
  req.session.save(function() {
    res.redirect('/');
  });
});


module.exports = router;
