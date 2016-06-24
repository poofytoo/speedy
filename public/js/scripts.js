var data = {};
var seed;

var numberOfWords = 20;
var numEasyWords = 10;

var wordDictionaryAll;
var wordDictionarySelect;

var wordSetCounter = 0;
var wordSet = [];
var playerPlacematStack = [];
var tileTracker = {};
var solvedWords = [];
var gameTimer;
var gameTimerCount = 0;
var lastSolveTime; // number of seconds left when the last word was solved

var fullDictionary = {}

var gameState = 'ENTER_NAME';

const TOTAL_WORDS_IN_SET = 20;
const COUNTDOWN_TIME = 400;
const MAX_SEARCH = 1000;
const GAME_TIME_LENGTH = 15;

$(function() {

  var gameWidth = $('.game-container').width();
  var gameHeight = $('.game-container').height();
  var tileWidth = 80;
  var tileHeight = 83;
  var tileSpacing = 10;
  var placematWidth = 90;
  var placematSpacing = 10;
  var secondsSinceLastSolve = 0;

  $(".test-score").click(function() {
    $.post("/score", { score: 30 }, function(response) {
      console.log(response);
    });
  });

  $(document).on('click', '.play-again', function(e) {
    console.log('play again');
    if (gameState == 'GAME_ENDED') {
      resetGame();
    }
  })

  $(document).bind('keydown', function(e) {
    if(e.which == 13) {
      if (gameState == 'ENTER_NAME') {
        $('.enter-name-container').animate({
          top: "-100",
          opacity: 0
        }, 600, 'easeInBack', function() {
          $('.enter-name-container').hide();
          showCountdown();
        });
      }
    }
    if (gameState == 'IN_GAME') {
      if (e.which != 8) {
        char = String.fromCharCode(e.which).toLowerCase();
        moveLetterToPlayerPlacemat(char);
      } else {
        e.preventDefault();
        removeLastLetter();
      }
    }
  });

  function showCountdown() {
    gameState = 'COUNTDOWN';
    $('.countdown-container').fadeIn();
    animateCountdown();
  }

  function animateCountdown() {
    setTimeout(function() {
      $('.countdown-3').addClass('countdown-transition')
    }, COUNTDOWN_TIME)
    setTimeout(function() {
      $('.countdown-2').addClass('countdown-transition')
    }, COUNTDOWN_TIME*2)
    setTimeout(function() {
      $('.countdown-1').addClass('countdown-transition')
      setTimeout(function() {
        $('.countdown-container').hide();
        startGame();
      }, COUNTDOWN_TIME)
    }, COUNTDOWN_TIME*3)
  }

  function resetGame() {
    wordSetCounter = 0;
    wordSet = [];
    playerPlacematStack = [];
    tileTracker = {};
    solvedWords = [];
    gameTimer;
    gameTimerCount = 0;

    $('.countdown-1').removeClass('countdown-transition')
    $('.countdown-2').removeClass('countdown-transition')
    $('.countdown-3').removeClass('countdown-transition')

    seed = generateSeed();
    generateWordList(seed);

    if (gameState == 'GAME_ENDED') {
      $('.game-container *').fadeOut();
      setTimeout(function() {
        $('.game-container *').remove();
        $('.game-container').hide();
        showCountdown();
      }, 400)
    }
  }

  function startGame() {
    solvedWords = [];
    animateTilesEnter(wordSet[0][0], wordSet[0][1]);
    gameTimerCount = GAME_TIME_LENGTH
    $('.timer').text(gameTimerCount);

    // reset hint timer
    secondsSinceLastSolve = 0;
    gameTimer = setInterval(function() {
      gameTimerCountdown();
    }, 1000);
    gameState = 'IN_GAME'
  }

  function endGame() {
    $('.cover').show();
    $('.cover').css({
      width: 0,
      height: 0,
      bottom: 70,
      backgroundColor: '#CCC7BF'
    })
    $('.cover').animate({
      width: "2000px",
      height: "2000px",
      bottom: "-1000px",
      backgroundColor: "#fff"
    }, 1000, "easeInOutQuad", function() {
      gameState = 'GAME_ENDED';
      console.log(wordSetCounter, wordSet[wordSetCounter]);
      clearTileBoard();
      $('.timer-container').hide();
      showHighScore();
      $('.cover').hide();
    })
  }

  function clearTileBoard() {
    $('.game-container .letter-tile').remove();
    $('.game-container .wordbank-placemat').remove();
    $('.game-container .player-placemat').remove();
    $('.game-container .hint-container').remove();
    $('.game-container .plus-tile-placemat').remove();
  }

  function showHighScore() {
    console.log('solvedwords', solvedWords);
    var longestLength = 0;
    var score = 0;
    var totalWordsToDisplay = solvedWords.length;

    for (i in solvedWords) {
      longestLength = Math.max(solvedWords[i][0].length, longestLength);
    }

    if (lastSolveTime === undefined || lastSolveTime > 0) {
      longestLength = Math.max(wordSet[wordSetCounter][0].length, longestLength);
      totalWordsToDisplay += 1;
    }

    for (i in solvedWords) {
      wordRound = solvedWords[i];

      for (j in wordRound[0]) {
        letter = wordRound[0][j];
        $letter = $('<div id="mini-'+i+'-'+j+'" class="mini-letter-tile">'+letter+'</div>');
        $letter.css({
          top: i*30,
          left: j*25
        })
        $('.game-container').append($letter);
      }

      singleLetterFound = false;

      for (j in wordRound[2]) {
        letter = wordRound[2][j];
        $letter = $('<div class="mini-letter-tile">'+letter+'</div>');
        $letter.css({
          top: i*30,
          left: j*25 + (longestLength+1)*25
        })

        // the first two letters don't get scored
        if (j > 1) {
          $letter.attr('id', 'scoring-' + score)
          score ++;
        }

        // look for the single letter to highlight
        if (letter == wordRound[1] && !singleLetterFound) {
          singleLetterFound = true;
          $letter.addClass('highlight')
        }

        $('.game-container').append($letter);
      }
    }

    // if there is an unsolved word, show that too
    if (lastSolveTime == undefined || lastSolveTime > 0) {
      var unsolvedWordRound = wordSet[wordSetCounter];
      var numSolved = solvedWords.length;

      for (j in unsolvedWordRound[0]) {
        letter = unsolvedWordRound[0][j];
        $letter = $('<div id="mini-'+i+'-'+j+'" class="mini-letter-tile mini-letter-tile-unsolved">'+letter+'</div>');
        $letter.css({
          top: numSolved*30,
          left: j*25
        })
        $('.game-container').append($letter);
      }

      singleLetterFound = false;

      for (j in unsolvedWordRound[2]) {
        letter = unsolvedWordRound[2][j];
        $letter = $('<div class="mini-letter-tile mini-letter-tile-unsolved">'+letter+'</div>');
        $letter.css({
          top: numSolved*30,
          left: j*25 + (longestLength+1)*25
        })

        // look for the single letter to highlight
        if (letter == unsolvedWordRound[1] && !singleLetterFound) {
          singleLetterFound = true;
          $letter.addClass('highlight')
        }

        $('.game-container').append($letter);
      }
    }

    function blinkScoreTile(countUp) {
      $('#scoring-' + countUp).animate({
        opacity: 0
      }, 100, function() {
        $(this).animate({
          opacity: 1
        }, 100)
      });
      $('.final-score-container').text(countUp);
      if (countUp < score) {
        countUp ++;
        setTimeout(function() {
          blinkScoreTile(countUp)
        }, 100)
      }
    }

    $('.mini-letter-tile').fadeIn()
    setTimeout(function() {
      blinkScoreTile(0)
    }, 500)

    $fsc = $('<div class="final-score-caption">final score: <span class="final-score-container">0</span></div>');
    $fsc.css({
      top: totalWordsToDisplay * 30+20,
      left: 0
    })
    $fsc.find('.final-score-container').text('0')
    $fsc.fadeIn();
    $('.game-container').append($fsc);

    $playAgainBtn = $('<div class="play-again">play again</div>').hide();
    $playAgainBtn.css ({
      top: totalWordsToDisplay * 30+68,
      left: -5
    })
    $('.game-container').append($playAgainBtn);
    $playAgainBtn.fadeIn();

    $highscore = $('<div class="highscore-container"></div>');
    $highscore.append('<h3>highscores</h3>');
    $highscoreTable = $('<table></table>')

    $.post('/score', {score: score, seed: seed}, function() {
      $.get('/scores', function(data) {
        console.log(data.scores);
        for (i in data.scores) {
          row = data.scores[i];
          rowHTML = '<tr><td class="score">' + row.score + '</td><td>' + row.user.firstName + ' '  + row.user.lastInitial + '.</td></tr>';
          $highscoreTable.append(rowHTML)
        }
        $highscore.append($highscoreTable);
        console.log('ADDING SIR ')
        $('.game-container').append($highscore);
        $highscore.css({
          top: 0,
          left: Math.max((longestLength * 2 + 4) * 25, 250),
        })
        $highscore.fadeIn(300);
      })
    })
  }

  function gameTimerCountdown() {
    gameTimerCount --;
    if (gameTimerCount < 0) {
      gameTimerCount = 0;
      console.log('ENDING GAME NOW', gameState);

      endGame();
      clearInterval(gameTimer);
    } else {
      secondsSinceLastSolve ++;
      checkSecondsSinceLastSolve();
      $('.timer').text(gameTimerCount);
    }
  }

  function checkSecondsSinceLastSolve() {
    solution = wordSet[wordSetCounter][2]
    for (i = 0; i < solution.length; i ++) {
      if (secondsSinceLastSolve == i*3 + 6) {// Object.keys(tileTracker).length) {
        hintLetter = solution.substr(i,1);
        rLeft = $('#pp' + i).position().left;
        rTop = $('#pp' + i).position().top + tileHeight + 10;
        $hint = $('<div class="hint-container">'+hintLetter+'</div>')
        $hint.css({
          left: rLeft,
          top: rTop,
          display: 'none'
        })
        $('.game-container').append($hint);
        $hint.fadeIn(300);
      }
    }
  }

  function generateLetterTile(letter, top, left, j) {
    $tile = $('<span class="letter-tile">'+letter+'</span>')
    rTop = (Math.random()*200 + 100) + top// (Math.random() < 0.5 ? -1 : 1);
    rLeft = (Math.random()*200 + 100) * (Math.random() < 0.5 ? -1 : 1) + left;
    $tile.css({
      top: rTop,
      left: rLeft,
      opacity: 0
    }).animate({
      top: top,
      left: left,
      opacity: 1
    }, 700, 'easeOutExpo')
    tileTracker[j] = {t: letter, l: 'BANK', sx: left, sy: top, id: j}
    return $tile;
  }

  function moveLetterToPlayerPlacemat(letter) {

    placematPosition = $('#pp' + playerPlacematStack.length).position();
    for (i in tileTracker) {
      if (tileTracker[i].t == letter && tileTracker[i].l == 'BANK') {
        tileTracker[i].l = 'PLACEMAT'
        $('#t' + i).animate({
          left: placematPosition.left + 5,
          top: placematPosition.top - 4
        }, 100)
        playerPlacematStack.push(tileTracker[i])
        break
      }
    }

    if (playerPlacematStack.length == Object.keys(tileTracker).length) {
      checkProceed();
    }
  }

  function scatterOut($elem) {
    l = (Math.random()*50 + 50) * (Math.random() < 0.5 ? -1 : 1);
    t = (Math.random()*50 + 50) * (Math.random() < 0.5 ? -1 : 1);
    console.log($elem.position().top)
    $elem.animate({
      top: $elem.position().top + t,
      left: $elem.position().left + l,
      opacity: 0
    }, 300, 'easeInQuad');
  }

  function checkProceed() {
    userWord = playerPlacematStack.map(function(elem){
      return elem.t;
    }).join("");
    if (fullDictionary[userWord] !== undefined) {
      $('.game-container .player-placemat').animate({
        backgroundColor: '#6FD06C',
      }, 100);
      setTimeout(function() {
        $.each($('.game-container .letter-tile'), function() {
          scatterOut($(this));
        });
        $('.game-container .wordbank-placemat').fadeOut();
        $('.game-container .player-placemat').fadeOut();
        $('.game-container .hint-container').fadeOut();
        $('.game-container .plus-tile-placemat').fadeOut();
        setTimeout(function() {
          clearTileBoard();
          resetAndLoadNew();
        }, 400)
      }, 400)
      console.log('VALID!');
      lastSolveTime = gameTimerCount;
      solvedWords.push([
        wordSet[wordSetCounter][0],
        wordSet[wordSetCounter][1],
        userWord
      ])
      wordSetCounter ++;
      secondsSinceLastSolve = 0;
    }
  }

  function resetAndLoadNew() {
    tileTracker = {};
    playerPlacematStack = [];
    if (gameState == 'IN_GAME') {
      animateTilesEnter(wordSet[wordSetCounter][0], wordSet[wordSetCounter][1]);
    }
  }

  function removeLastLetter() {
    if (playerPlacematStack.length > 0) {
      removeChar = playerPlacematStack.pop();
      tileTracker[removeChar.id].l = 'BANK';
      $('#t' + removeChar.id).animate({
        left: removeChar.sx,
        top: removeChar.sy,
      }, 100)
    }
  }

  function animateTilesEnter(letters, plusLetter) {
    lettersArr = letters.split('')

    $('.timer-container').fadeIn();

    for (i = 0; i < lettersArr.length+1; i ++) {
      playerPlacematX = gameWidth / 2 - ((lettersArr.length+1) * (placematWidth+placematSpacing) - placematSpacing)/2 + i * (placematWidth+placematSpacing)
      playerPlacematY = 250

      $playerPlacemat = $('<div id="pp'+i+'" class="player-placemat"></div>');
      $playerPlacemat.css({
        left: playerPlacematX,
        top: playerPlacematY
      })
      $('.game-container').append($playerPlacemat);
    }

    for (i in lettersArr) {
      letter = lettersArr[i];
      letterStartX = gameWidth / 2 - (lettersArr.length * (tileWidth+tileSpacing) - tileSpacing)/2 + i * (tileWidth+tileSpacing)
      letterStartY = 130
      $tile = generateLetterTile(letter, letterStartY, letterStartX, i);

      $wordbankPlacemat = $('<div class="wordbank-placemat"></div>');
      $wordbankPlacemat.css({
        left: letterStartX,
        top: letterStartY
      })
      $tile.attr('id', 't' + i)
      $('.game-container').append($wordbankPlacemat);
      $('.game-container').append($tile);
    }

    plusStartX = gameWidth / 2 - tileWidth / 2;
    plusStartY = 0;
    $plusTile = generateLetterTile(plusLetter, plusStartY, plusStartX, lettersArr.length);
    $plusTile.attr('id', 't' + lettersArr.length);

    $plusTilePlacemat = $('<div class="plus-tile-placemat"></div>');
    $plusTilePlacemat.css({
      left: plusStartX - 5,
      top: plusStartY + 4
    }).fadeIn();
    // $plusTile.addClass('plus-tile');

    $('.game-container').append($plusTilePlacemat);
    $('.game-container').append($plusTile);

    $('.game-container').show();

    /*
    for (i = 0; i < lettersArr.length+1; i ++) {
      $('.placemat-container').append($('<span id="l'+i+'" class="tile-placemat"></span>'))
    }
    $plusTile = generateLetterTile(plusLetter);
    $plusTile.addClass('plus-tile');
    $('.plus-tile-container').append($plusTile);
    $('.game-container').show();
    */
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

  function generateDictionary(callback) {
    $.getJSON('/data/dictionary.json', function(data) {
      fullDictionary = data;
    });

    $.getJSON('/data/short-and-one-letter-select.json', function(select) {
      $.getJSON('/data/short-and-one-letter.json', function(all) {
        callback(select, all);
      })
      .fail(function(err) {
        console.log( "error" , err);
      });
    })
    .fail(function(err) {
      console.log( "error" , err);
    });
  }

  function generateSeed() {
    return Math.floor(Math.random() * 89999 + 10000)
  }

  function randomSeed(seed) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  /*
  Seed Random Tester
  test = {}
  for (i = 0; i < 100000; i ++) {

    a = Math.floor(randomSeed(seed)*100);
    if (test[a]) {
      test[a] ++;
    } else {
      test[a] = 1;
    }
  }
  console.log(test);
  */


  function generateWordList(seed) {
    random = randomSeed(seed);
    numberOfWords = TOTAL_WORDS_IN_SET;

    numEasyWordsCounter = 0;
    startingIndex = Math.floor(wordList.length * random)
    for (i = 0; i < numberOfWords; i ++) {

      randomIndex = Math.floor(wordList.length*randomSeed(seed*(i+1)))
      wordProbe = wordList[randomIndex];

      if (wordSet.indexOf(wordProbe) < 0) {
        wordPlusIndex = Math.floor(wordDictionarySelect[wordProbe].length*randomSeed(seed/(i+1)))
        wordPlus = wordDictionarySelect[wordProbe][wordPlusIndex];
        if (allWordList.indexOf(wordPlus) > -1) {

          letter = getLetterDifference(wordList[randomIndex], wordPlus)
          console.log(wordList[randomIndex], letter, wordPlus)
          wordSet.push([wordList[randomIndex], letter, wordPlus]);
        } else {
          // ensuring there is at least one word in the easy set
          // word not in 'easy' set
          if (numberOfWords < MAX_SEARCH) {
            numberOfWords += 1;
          }
        }
      } else {
        // word not in set
        if (numberOfWords < MAX_SEARCH) {
          numberOfWords += 1;
        }
      }
    }
  }

  function init() {
    generateDictionary(function(dSelect, dAll) {
      // Selected 'good words'
      // AllWordList: all valid words in the scrabble dictionary
      wordDictionarySelect = dSelect;
      wordDictionaryAll = dAll

      wordList = Object.keys(dSelect);
      allWordList = Object.keys(dAll);

      seed = generateSeed();

      console.log('seed: ', seed)
      // seed = 5;
      generateWordList(seed);

      // console.log(wordSet, wordSet.length);

      // for testing

/*
      $('.enter-name-container').hide();
      startGame();
      */
      /*
      gameState = 'IN_GAME';
      animateTilesEnter(wordSet[0][0], wordSet[0][1]);
      */

    })
  }

  init();
})
