var express = require('express');
var router = express.Router();
var auth = require('../auth');
var firebaseRef = require('../firebase');
var game = require('../game');

router.get('/new', auth.loggedIn, function(req, res, next) {
  res.json(game.newGame(req.user));
});

router.get('/continue', auth.loggedIn, function(req, res, next) {
  res.json(game.progressGame(req.user, req.query.gameToken, req.query.word));
});

router.get('/id/:id', auth.loggedIn, function(req, res, next) {
  game.savedGame(req.user, req.params.id, function(game) {
    res.json(game);
  })
});


router.post('/score', auth.loggedIn, function(req, res, next) {
  game.postScore(req.user, req.body.game_id, req.body.score, function(success) {
    res.send(success);
  });
});

router.get('/scores', function(req, res, next) {
  game.getScores(req.user.id, function(scoreboard) {
    res.send(scoreboard);
  });
});



module.exports = router;
