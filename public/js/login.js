$(function() {
  theta = Math.random()*2*Math.PI;
  $.each($('.letter-tile'), function() {
    radius = Math.random()*100+200;
    theta += Math.random()*2+0.5
    $(this).css({
      top: Math.floor(radius*Math.cos(theta)),
      left: Math.floor(radius*Math.sin(theta)),
      opacity: 0
    }).animate({
      top: 0,
      left: 0,
      opacity: 1
    }, 800, 'easeOutQuint')
    console.log(radius, theta)
  })
});