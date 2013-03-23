(function() {
  var lastTime=0;
  var vendors=['ms', 'moz', 'webkit', 'o'];
	var x;
  for (x=0; x<vendors.length && !window.requestAnimationFrame; ++x) {
  window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
  window.cancelAnimationFrame =
    window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame=function(callback, element) {
      var currTime=new Date().getTime();
      var timeToCall=Math.max(0, 16 - (currTime - lastTime));
      var id=window.setTimeout(function() { callback(currTime+timeToCall); }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }
})();

//-----------------------------------

$('document').ready(function () {
  game.init();
  game.start();
})

var game = (function () {
  var ended, canvas, r, width, height; 
  var ship, planets; 

  var init = function() {
    ended  = false;
    canvas = $('#gamecanvas')[0];
    width  = $(canvas).width();
    height = $(canvas).height();

    ship    = { x: 0, y: 0};
    planets = [{x:100, y:100, r:10}, {x:200, y:-100, r:20}];    
    keyboard.init();

    r = Raphael(canvas, $(canvas).width(), $(canvas).height());
  };

  var start = function() {
    window.requestAnimationFrame(animate, canvas);
    if (!ended) {
      window.requestAnimationFrame(animate, canvas);
    }
  };
  
  // Translates the co-ordinates from idealised to concrete.
  var trans = function(o) {
    o.cx = Math.round((ship.x - o.x) + width/2);
    o.cy = Math.round(height/2 - (ship.y - o.y));
    return(o);
  }

  var animate = function() {
    r.clear();
    var i,p;
    var s = trans(ship);

    r.path("M"+s.cx+","+(s.cy-5)+
           "L"+(s.cx-5)+","+(s.cy+5)+
           "L"+(s.cx+5)+","+(s.cy+5)+
           "L"+s.cx+","+(s.cy-5));
//    r.circle(s.cx, s.cy, 5);
    for (i=0; i < planets.length; i++) {
      p = trans(planets[i]);
      r.circle(p.cx, p.cy, p.r);
    }
  }

  return ({
    init:  init,
    start: start
  });


})();

var keyboard = (function () {
  var keypresses = [];

  var init = function() {
    var body = $('body');
    body.keydown(keydownHandler);
    body.keyup(keyupHandler);
  };

  var keydownHandler = function(ev) {
    keypresses[ev.which] = true;
  };
  
  var keyupHandler = function(ev) {
    keypresses[ev.which] = false;
  };

  var keydown = function(key) {
    keypresses[key] === true;
  }

  return({
    init:    init,
    keydown: keydown
  });


})();

