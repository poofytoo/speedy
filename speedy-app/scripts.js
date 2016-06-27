$(function() {

  var wordSetCounter = 0;
  var wordSet = [];
  var playerPlacematStack = [];
  var tileTracker = {};
  var solvedWords = [];
  var gameTimer;
  var gameTimerCount = 0;
  var lastSolveTime; // number of seconds left when the last word was solved
  var currentGameID;

  var fullDictionary = {}

  var gameState = 'ENTER_NAME';

  const TOTAL_WORDS_IN_SET = 20;
  const COUNTDOWN_TIME = 700; // 800
  const MAX_SEARCH = 1000;
  const GAME_TIME_LENGTH = 60;
  const FINAL_SCORE_COUNT_SPEED = 50;
  const FETCH_GAME_URL = '/game/new';

  var gameWidth = $('.game-container').width();
  var gameHeight = $('.game-container').height();
  var tileWidth = 80;
  var tileHeight = 83;
  var tileSpacing = 10;
  var placematWidth = 90;
  var placematSpacing = 10;
  var secondsSinceLastSolve = 0;

  $(document).on('click', '.play-again', function(e) {
    if (gameState == 'GAME_ENDED') {
      resetGame();
    }
  })

  $(document).on('click', 'tr', function(e) {
    id = $(this).data('gameid')
    if (gameState == 'GAME_ENDED' && !$(this).hasClass('hasPlayed')) {
      resetGame(id);
    }
  })

  $(document).on('click', '.start-game', function(e) {
    confirmStartGame();
  })

  $(document).bind('keydown', function(e) {
    if(e.which == 13) {
      confirmStartGame();
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

  function fetchGameByID(id, callback) {
    $.get('/game/id/' + id, function(data) {
      wordSet = data.game;
      currentGameID = data.id;
      callback();
    });
  }

  function fetchGame(callback) {
    $.get(FETCH_GAME_URL, function(data) {
      wordSet = data.game;
      currentGameID = data.id;
      callback();
    });
  }

  function confirmStartGame() {
    if (gameState == 'ENTER_NAME') {
      gameState = 'COUNTDOWN';
      $('.start-game-container').animate({
        top: "-100",
        opacity: 0
      }, 600, 'easeInBack', function() {
        $('.start-game-container').hide();
        fetchGame(showCountdown);
        // showCountdown();
      });
    }
  }

  function showCountdown() {
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

  function resetGame(id) {
    id = id || '';
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

    if (gameState == 'GAME_ENDED') {
      $('.game-container *').fadeOut();
      if (id == '') {
        setTimeout(function() {
          $('.game-container *').remove();
          $('.game-container').hide();
          fetchGame(showCountdown);
        }, 400)
      } else {
        setTimeout(function() {
          $('.game-container *').remove();
          $('.game-container').hide();
          fetchGameByID(id, showCountdown);
        }, 400)
      }
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
        }, FINAL_SCORE_COUNT_SPEED)
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

    gameID = '';

    $.post('/score', {score: score, game_id: currentGameID}, function() {
      $.get('/scores', function(data) {
        userGameScores = data.user.games;
        for (i in data.scores) {
          row = data.scores[i];
          playerName = row.user.firstName + ' '  + row.user.lastInitial + '.';
          gameid = row.game_id;
          if (row.user.id == data.user.id) {
            // user is on highscore table
            rowHTML = '<tr class="hasPlayed" data-gameid="'+gameid+'" data-playername="'+playerName+'"><td class="score">' + row.score + '</td>';
            rowHTML += '<td>'+playerName+'</td>'
            rowHTML += '<td></td></tr>'
          } else if (userGameScores[gameid] == undefined) {
            // user has not played this game before
            rowHTML = '<tr data-gameid="'+gameid+'" data-playername="'+playerName+'"><td class="score">' + row.score + '</td>';
            rowHTML += '<td>'+playerName+'</td>'
            rowHTML += '<td><div class="replay-game-id-btn">load game</div></td></tr>'
          } else {
            // user has played this game before
            rowHTML = '<tr class="hasPlayed" data-gameid="'+gameid+'" data-playername="'+playerName+'"><td class="score">' + row.score + '</td>';
            rowHTML += '<td>'+playerName+'</td>'
            rowHTML += '<td><div class="your-score-badge">your score: ' + userGameScores[gameid] + '</div></td></tr>'
          }
          $highscoreTable.append(rowHTML)
        }
        $highscore.append($highscoreTable);
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
        $('#t' + i)
          .stop()
          .css({
            opacity: 1
          })
          .animate({
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
      playerPlacematStack = [];
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

      $playerPlacemat = $('<div id="pp'+i+'" class="player-placemat"></div>')
        .css({
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

      $wordbankPlacemat = $('<div class="wordbank-placemat"></div>')
        .css({
        left: letterStartX,
        top: letterStartY
      })
      $tile.attr('id', 't' + i)
      $('.game-container').append($wordbankPlacemat)
        .append($tile);
    }

    plusStartX = gameWidth / 2 - tileWidth / 2;
    plusStartY = 0;
    $plusTile = generateLetterTile(plusLetter, plusStartY, plusStartX, lettersArr.length)
      .attr('id', 't' + lettersArr.length);

    $plusTilePlacemat = $('<div class="plus-tile-placemat"></div>')
      .css({
        left: plusStartX - 5,
        top: plusStartY + 4
      }).fadeIn();

    $('.game-container').append($plusTilePlacemat)
      .append($plusTile)
      .show();
  }

  function generateDictionary(callback) {
    $.getJSON('/data/dictionary.json', function(data) {
      callback(data)
    });
  }

  function init() {
    generateDictionary(function(dAll) {
      fullDictionary = dAll
    })
  }

  init();
})