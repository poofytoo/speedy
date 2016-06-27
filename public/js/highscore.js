(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var HighscoreTable = React.createClass({displayName: "HighscoreTable",
  componentWillMount: function() {
    var _this = this;
    $.get("/scores", function(response) {
      _this.setState({
        scores: response.scores
      });
    });
  },
  render: function() {
    if (this.state != null && this.state.scores !== undefined) {
      return (
        React.createElement("table", null, 
          React.createElement("tbody", null, 
            
              this.state.scores.map(function(score, index) {
                return (
                  React.createElement("tr", {key: index}, 
                    React.createElement("td", {className: "score"}, score.score), 
                    React.createElement("td", null, score.user.firstName, " ", score.user.lastName), 
                    React.createElement("td", null, React.createElement("div", {className: "replay-game-id-btn"}, "load game"))
                  )
                )
              })
            
          )
        )
      );
    } else {
      return React.createElement("table", null);
    }
  }
});

ReactDOM.render(
  React.createElement(HighscoreTable, null),
  document.querySelector("#highscore-table")
);

},{}]},{},[1]);
