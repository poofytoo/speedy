var firebaseRef = require('./firebase');

var fullDictionary = require('./data/dictionary.json');
var comboWords = require('.//data/short-and-one-letter.json');
var filteredComboWords = require('./data/short-and-one-letter-select.json');

var filteredWordList = Object.keys(filteredComboWords);
var wordList = Object.keys(comboWords);

const TOTAL_WORDS_IN_SET = 20;


function newGame(user) {
  // scary code to remove things
  goodbyeScores = firebaseRef.ref('scores');
  goodbyeScores.once('value', function(data) {
    console.log(data.val())
  });
  /*
  goodbyeScores.set('');
  */

  var random = Math.random();
  // it's fun time, let's make a new game!
  // if (random < 0.5) {
    randomGame = generateNewGame()
    id = saveRandomGame(randomGame);
    // store game

    game = {
      game: randomGame,
      id: id
    }
    return game;
  // } else {
    // return getExistingGame(user);
  // }
}

function saveRandomGame(game) {
  var gameRef = firebaseRef.ref('games');
  newGameRef = gameRef.push(game);
  /*
  var gameID = newGameRef.key();

  console.log(gameID)
  gameRef.child(gameID).set(game);
  */
  return newGameRef.key
}

function generateNewGame() {
  var gameSet = [];
  var wordSet = [];
  while (gameSet.length < TOTAL_WORDS_IN_SET) {
    var randomIndex = Math.floor(Math.random() * filteredWordList.length);
    var randomWord = filteredWordList[randomIndex];

    if (wordSet.indexOf(randomWord) < 0) {
      var randomLetterIndex = Math.floor(Math.random() * filteredComboWords[randomWord].length);
      var randomWordCombo = filteredComboWords[randomWord][randomLetterIndex];

      if (wordList.indexOf(randomWordCombo) >= 0) {
        var extraLetter = getLetterDifference(randomWord, randomWordCombo);
        gameSet.push([randomWord, extraLetter, randomWordCombo]);
        wordSet.push(randomWord);
      }
    }
  }

  return gameSet;
}

function getLetterDifference(s1, l2) {
  // Get letter difference, short word, long word
  for (var i = 0; i < s1.length; i ++) {
    char = s1.charAt(i);
    k = l2.indexOf(char)
    if (k != -1) {
      l2 = l2.substr(0,k) + l2.substr(k+1, l2.length);
    } else {
      return false;
    }
  }
  return l2
}

function getExistingGame(user) {

}

function savedGame(id, callback) {
  // TODO: return saved game in firebase 
  gameRef = firebaseRef.ref('games/' + id);
  gameRef.once('value', function(data) {
    game = {game: data.val(), id: id}
    callback(game);
  })
}

module.exports = {
  newGame: newGame,
  savedGame: savedGame
};

// module.exports = {
//   newGame: function(user) {
//     var random = Math.random();
//
//     // it's fun time, let's make a new game!
//     if (random < 0.5) {
//
//     }
//   }
// };
