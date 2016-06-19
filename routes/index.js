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
  var scoreRef = firebaseRef.ref('scores/' + req.user.id);

  scoreRef.on("value", function(snapshot) {
    if (snapshot.val() != null && parseInt(req.body.score) > snapshot.val().score) {
      scoreRef.child("score").set(parseInt(req.body.score), function() {
        res.send({success: true});
      })
    } else if (snapshot.val() == null) {
      scoreRef.set({
        score: parseInt(req.body.score),
        user: req.user
      }, function() {
        res.send({success: true});
      });
    }
  });
});

router.get('/scores', function(req, res, next) {
  var scoreRef = firebaseRef.ref('scores');
  var sent = false;
  scoreRef.on("value", function(scoreSnapshot) {
    scoreRef.orderByChild("score").on("value", function(snapshot) {
      if (!sent) {
        sent = true;
        var scores = [];
        snapshot.forEach(function(data) {
          scores.push(data.val())
        });
        res.send({scores: scores.reverse()});
      }
    });
  });
});

module.exports = router;
