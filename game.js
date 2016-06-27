var firebaseRef = require('./firebase');

var fullDictionary = require('./data/dictionary.json');
var comboWords = require('.//data/short-and-one-letter.json');
var filteredComboWords = require('./data/short-and-one-letter-select.json');

var filteredWordList = Object.keys(filteredComboWords);
var wordList = Object.keys(comboWords);

const TOTAL_WORDS_IN_SET = 20;


function newGame(user, callback) {

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
    addGameIDToUser(user, id)
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

// Given a word and a round number, return true only if the word is is an 
// appropriate length/difficulty based on the round
function checkWordDifficulty(word, level) {
  wordLengthByRound = [3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 7, 8, 9, 9, 10, 10, 10]
  wordLengthVariance= [0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 2, 2, 3, 3, 3]
  if (level >= wordLengthByRound.length) {
    return true;
  } else if (word.length <= (wordLengthByRound[level] + wordLengthVariance[level]) && word.length >= (wordLengthByRound[level] - wordLengthVariance[level])){
    return true;
  } else {
    return false;
  }
}

function generateNewGame() {
  var gameSet = [];
  var wordSet = [];
  while (gameSet.length < TOTAL_WORDS_IN_SET) {
    var randomIndex = Math.floor(Math.random() * filteredWordList.length);
    var randomWord = filteredWordList[randomIndex];

    if (checkWordDifficulty(randomWord, gameSet.length)) {
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

function savedGame(user, id, callback) {
  gameRef = firebaseRef.ref('games/' + id);
  gameRef.once('value', function(data) {
    game = {game: data.val(), id: id}
    addGameIDToUser(user, id)
    callback(game);
  })
}

function addGameIDToUser(user, gameid) {
  userRef = firebaseRef.ref('users/' + user.id + '/games/' + gameid)
  userRef.once('value', function(data) {
    if (data.val() == undefined) {
      userRef.set('');
    }
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
