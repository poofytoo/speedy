var express = require('express');
var router = express.Router();
var auth = require('../auth');
var firebaseRef = require('../firebase');

function getScores(userID, callback) {
  var scoreRef = firebaseRef.ref('scores');
  scoreRef.once("value", function(scoreSnapshot) {
    scoreRef.orderByChild("score").once("value", function(snapshot) {

      // fetch an updated list of games the user has played and his/her scores
      var userRef = firebaseRef.ref('users/' + userID)
      userRef.once("value", function(data) {
        user = data.val()
        var scores = [];
        snapshot.forEach(function(data) {
          scores.push(data.val())
          console.log(data.val())
        });
        callback({scores: scores.reverse(), user: user})
      });
    });
  });
}

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

router.post('/score', auth.loggedIn, function(req, res, next) {
  var scoreRef = firebaseRef.ref('scores/' + req.user.id);

  scoreRef.once("value", function(snapshot) {
    if (snapshot.val() != null && parseInt(req.body.score) > snapshot.val().score) {
      scoreRef.update({
        score: parseInt(req.body.score),
        game_id: req.body.game_id
      }, function() {
        res.send({success: true});
      })
    } else if (snapshot.val() == null) {
      scoreRef.set({
        score: parseInt(req.body.score),
        user: req.user,
        game_id: req.body.game_id
      }, function() {
        res.send({success: true});
      });
    } else {
      res.send({success: true});
    }
  });

  var userScoreRef = firebaseRef.ref('users/'+req.user.id+'/games/'+req.body.game_id)
  userScoreRef.set(req.body.score);
});

router.get('/scores', function(req, res, next) {
  var sent = false;
  getScores(req.user.id, function(scoreboard) {
    if (!sent) {
      sent = true;
      res.send(scoreboard);
    }
  });
});

module.exports = router;
