var express = require('express');
var router = express.Router();
var auth = require('../auth');
var firebaseRef = require('../firebase');
var game = require('../game');

router.get('/new', auth.loggedIn, function(req, res, next) {
  res.json({ game: game.newGame(req.user) });
});

module.exports = router;
