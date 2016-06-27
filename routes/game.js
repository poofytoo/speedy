var express = require('express');
var router = express.Router();
var auth = require('../auth');
var firebaseRef = require('../firebase');
var game = require('../game');

router.get('/new', auth.loggedIn, function(req, res, next) {
  res.json(game.newGame(req.user));
});

router.get('/id/:id', auth.loggedIn, function(req, res, next) {
  game.savedGame(req.params.id, function(game) {
    res.json(game);
  })
});

module.exports = router;
