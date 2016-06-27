var HighscoreTable = React.createClass({
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
        <table>
          <tbody>
            {
              this.state.scores.map(function(score, index) {
                return (
                  <tr key={index}>
                    <td className="score">{score.score}</td>
                    <td>{score.user.firstName} {score.user.lastName}</td>
                    <td><div className="replay-game-id-btn">load game</div></td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      );
    } else {
      return <table />;
    }
  }
});

ReactDOM.render(
  <HighscoreTable />,
  document.querySelector("#highscore-table")
);
