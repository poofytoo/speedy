var firebaseRef = require('./firebase');

var fullDictionary = require('./data/dictionary.json');
var comboWords = require('.//data/short-and-one-letter.json');
var filteredComboWords = require('./data/short-and-one-letter-select.json');

var filteredWordList = Object.keys(filteredComboWords);
var wordList = Object.keys(comboWords);

var activeGameList = {};

const TOTAL_WORDS_IN_SET = 100;
const GAME_DURATION = 60 * 1000 + 7000; // Extra 7000ms
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
  console.log(word, wordSet)
  if (word == undefined) {
    return false;
  }

  if (wordSet.split("").sort().join("") === word.split("").sort().join("")) {
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

  console.log('gameToken created: ', gameToken);
  console.log('gameToken list:', activeGameList);

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
      if (checkValidAnagram(submittedWord, activeGameList[gameToken].wordSet[activeGameList[gameToken].wordPointer][2])) {
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

      // Create a random Game ID to be used between the server and the client
    var gameToken = Math.random().toString(36).replace(/[^a-zA-Z0-9]+/g, '').substr(1, 21);
    var gameTokenExpiry = Date.now() + GAME_DURATION;

    activeGameList[gameToken] = {};

    console.log('gameToken created: ', gameToken);
    console.log('gameToken list:', activeGameList);

    activeGameList[gameToken].expiry = gameTokenExpiry;
    activeGameList[gameToken].wordSet = data.val();
    activeGameList[gameToken].wordPointer = 0;

    game = {
      game: truncateList(data.val(), 0),
      id: id,
      gameToken: gameToken
    }

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

function validateSolvedWords(solvedWords, gameToken) {
  wordSet = activeGameList[gameToken].wordSet
  score = 0
  for (i = 0; i < solvedWords.length; i ++) {
    if (!checkValidAnagram(solvedWords[i], wordSet[i][2])) {
      return false
    }
    score += solvedWords[i].length - 2
  }
  return score
}

function postScore(user, gameToken, gameid, score, solvedWords, callback) {
  console.log('FULL ACTIVITY:', gameToken, gameid, score, solvedWords);

  if (validateSolvedWords(solvedWords.split("_"), gameToken) == score) {
    currentTime = Date.now();
    console.log('time', currentTime, activeGameList[gameToken].expiry)
    if (currentTime < activeGameList[gameToken].expiry) {

      // This will guarantee the bot later to clean it up
      activeGameList[gameToken].expiry -= 100000 
      var scoreRef = firebaseRef.ref('scores/' + user.id);

      // housekeeping, remove old games stored on server
      for (gameToken in activeGameList) {
        if (activeGameList[gameToken].expiry < currentTime) {
          delete activeGameList[gameToken]
        }
      }

      var userScoreRef = firebaseRef.ref('users/'+user.id+'/games/'+gameid)
      userScoreRef.set(score);

      scoreRef.once("value", function(snapshot) {
        if (snapshot.val() != null && parseInt(score) > snapshot.val().score) {
          scoreRef.update({
            score: parseInt(score),
            game_id: gameid
          }, function() {
            callback({success: true});
          })
        } else if (snapshot.val() == null) {
          scoreRef.set({
            score: parseInt(score),
            user: req.user.id,
            game_id: gameid
          }, function() {
            callback({success: true});
          });
        } else {
          callback({success: true});
        }
      });

    } else {
      console.log('error failed server clock check');
      callback({error_msg: 'failed server clock check'})
    }
  } else {
    console.log('error failed word check');
    callback({error_msg: 'failed word list check'})
  }
}

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
        });
        callback({scores: scores.reverse(), user: user})
      });
    });
  });
}

module.exports = {
  newGame: newGame,
  savedGame: savedGame,
  progressGame: progressGame,
  postScore: postScore,
  getScores: getScores
};

