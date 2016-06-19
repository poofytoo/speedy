var express = require('express');
var router = express.Router();
var auth = require('../auth');
var firebaseRef = require('../firebase');

/* GET home page. */
router.get('/', auth.loggedIn, function(req, res, next) {
  res.render('index', { user: req.user });
});

router.get('/login', function(req, res, next) {
  res.render('login', {});
});

router.post('/score', auth.loggedIn, function(req, res, next) {
  var scoreRef = firebaseRef.ref('scores');
  scoreRef.push({
    user: req.user,
    score: req.body.score
  });

  res.send({success: true});
});

router.get('/scores', function(req, res, next) {
  var scoreRef = firebaseRef.ref('scores');
  scoreRef.orderByChild("score").on("value", function(snapshot) {
    res.send({scores: snapshot.val()});
  });
});

module.exports = router;
