(function e(t,r,n){function a(l,o){if(!r[l]){if(!t[l]){var s=typeof require=="function"&&require;if(!o&&s)return s(l,!0);if(c)return c(l,!0);var u=new Error("Cannot find module '"+l+"'");throw u.code="MODULE_NOT_FOUND",u}var i=r[l]={exports:{}};t[l][0].call(i.exports,function(e){var r=t[l][1][e];return a(r?r:e)},i,i.exports,e,t,r,n)}return r[l].exports}var c=typeof require=="function"&&require;for(var l=0;l<n.length;l++)a(n[l]);return a})({1:[function(e,t,r){var n=React.createClass({displayName:"HighscoreTable",componentWillMount:function(){var e=this;$.get("/scores",function(t){e.setState({scores:t.scores})})},render:function(){if(this.state!=null&&this.state.scores!==undefined){return React.createElement("table",null,React.createElement("tbody",null,this.state.scores.map(function(e,t){return React.createElement("tr",{key:t},React.createElement("td",{className:"score"},e.score),React.createElement("td",null,e.user.firstName," ",e.user.lastName),React.createElement("td",null,React.createElement("div",{className:"replay-game-id-btn"},"load game")))})))}else{return React.createElement("table",null)}}});ReactDOM.render(React.createElement(n,null),document.querySelector("#highscore-table"))},{}]},{},[1]);