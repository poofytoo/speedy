var firebaseRef = require('./firebase');

var fullDictionary = require('./data/dictionary.json');
var comboWords = require('.//data/short-and-one-letter.json');
var filteredComboWords = require('./data/short-and-one-letter-select.json');

var filteredWordList = Object.keys(filteredComboWords);
var wordList = Object.keys(comboWords);

var activeGameList = {};

const TOTAL_WORDS_IN_SET = 100;
const GAME_DURATION = 60 * 1000 + 2000; // Extra 2000ms
const WORDS_LOADED_IN_ADVANCE = 3

function truncateList(l, pointer) {
  var upToCounter = Math.min(pointer + WORDS_LOADED_IN_ADVANCE, l.length);
  var newList = [];
  for (i = 0; i < upToCounter; i ++) {
    newList.push(l[i]);
    // remove the solution (more client side programming)
    // newList.push([l[i][0], l[i][1]])
  }
  return newList;
}

function checkValidAnagram(word, wordSet) {
  console.log(word, wordSet[2])
  if (word == undefined) {
    return false;
  }

  if (wordSet[2].split("").sort().join("") === word.split("").sort().join("")) {
    if (Object.keys(fullDictionary).indexOf(word) > -1) {
      return true;
    }
  }
  return false;
}

function newGame(user, callback) {

  // Create a new random Game
  var random = Math.random();
  randomGame = generateNewGame()
  id = saveRandomGame(randomGame);
  addGameIDToUser(user, id)

  // Create a random Game ID to be used between the server and the client
  var gameToken = Math.random().toString(36).replace(/[^a-zA-Z0-9]+/g, '').substr(1, 21);
  var gameTokenExpiry = Date.now() + GAME_DURATION;
  
  activeGameList[gameToken] = {};
  activeGameList[gameToken].expiry = gameTokenExpiry;
  activeGameList[gameToken].wordSet = randomGame;
  activeGameList[gameToken].wordPointer = 0;

  game = {
    game: truncateList(randomGame, 0),
    id: id,
    gameToken: gameToken
  }

  return game;
}

function progressGame(user, gameToken, submittedWord) {
  var currentTime = Date.now();
  console.log(currentTime, gameToken, submittedWord);
  if (Object.keys(activeGameList).indexOf(gameToken) > -1) {
  // Game Exists
    console.log('game found');
    if (currentTime < activeGameList[gameToken].expiry) {
      // Consistency Check with Server
      console.log('time valid');
      if (checkValidAnagram(submittedWord, activeGameList[gameToken].wordSet[activeGameList[gameToken].wordPointer])) {
        activeGameList[gameToken].wordPointer ++;
        game = {
          game: truncateList(activeGameList[gameToken].wordSet, activeGameList[gameToken].wordPointer)
        }
        console.log('returning game', game)
        return game
      }
      return {error_msg: "word check failed"}
    }
    return {error_msg: "game clock off"}
  }
  return {error_msg: "game token invalid"}
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
  savedGame: savedGame,
  progressGame: progressGame
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
