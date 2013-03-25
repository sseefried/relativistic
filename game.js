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

    ship    = { x:0, y:0, angle: 0.0, vx: 0, vy: 0};
    planets = [{x:100, y:100, r:10}, {x:200, y:-100, r:20}];    
    keyboard.init();

    r = Raphael(canvas, $(canvas).width(), $(canvas).height());
  };

  var start = function() {
    window.requestAnimationFrame(animate, canvas);
  };
  
  // Translates the co-ordinates from idealised to concrete.
  var trans = function(o) {
    o.cx = Math.round((ship.x - o.x) + width/2);
    o.cy = Math.round(height/2 - (ship.y - o.y));
    return(o);
  }

  // var rotateAbout = function(o, p, theta) {
  //   var px = p.x, py = p.y, o2;
  //   o.x -= px;
  //   o.y -= py;
  //   o2 = rotate(o, theta);
  //   o2.x += px;
  //   o2.y += py;
  //   return o2;
  // }
  // 
  // // rotate about (0,0)
  // var rotate = function(o,theta) {
  //   var ct = Math.cos(theta), st = Math.sin(theta);
  //   return({x: o.x*ct + o.y*st, y: o.y*ct - o.x*st });
  // }

  // Ship is always drawn at (0,0) co-ordinates
  var drawShip = function(thruster) {
    var len = 10, i, p,
        points = [ {x: ship.x,     y: ship.y-len },
                   {x: ship.x-len, y: ship.y+len }, 
                   {x: ship.x+len, y: ship.y+len } ],
        path = "";
        s = trans(ship);
    var st = r.set();

    for (i=1; i < points.length; i++) {
          p = trans(points[i]);
          path += (i===0?"M":"L")+p.cx+","+p.cy;
        }
    p = trans(points[0]);
    path = "M"+p.cx+","+p.cy+path+"L"+p.cx+","+p.cy;

    if (thruster) {
      st.push(r.rect(ship.cx-len/4, ship.cy, len/2, len*2).attr({fill: "orange"}));
    }
    st.push(r.path(path).attr({fill: "teal"}));
    st.rotate(Raphael.deg(ship.angle),s.cx,s.cy);
  }

  var animate = function() {
    var angleInc = 0.12;
    var shipSpeed = 2;
    var acceleration = 0.03;
    var thruster = false;
    var i,p;

    // var c = 2; // speed of "light"
    // var f = function(x) { return(Math.abs(1 - Math.sqrt(x*x/(c*c)))); }
    // 
    // var sx = f(ship.vx);
    // var sy = f(ship.vy);

    r.clear();



    for (i=0; i < planets.length; i++) {
      p = trans(planets[i]);
      r.circle(p.cx, p.cy, p.r).attr({ fill: "grey"}); //.scale(sx, sy, ship.cx, ship.cy);
    }

    // Update ship state
    if (keyboard.keydown(37)) {
      ship.angle -= angleInc;
    }
    
    if (keyboard.keydown(39)) {
      ship.angle += angleInc;
    }
    
    if (keyboard.keydown(38)) {
      ship.vx -= Math.sin(ship.angle) * acceleration;
      ship.vy -= Math.cos(ship.angle) * acceleration;
      thruster = true;
    }

    ship.x += ship.vx;
    ship.y += ship.vy;

    drawShip(thruster);

    if (!ended) {
      window.requestAnimationFrame(animate, canvas);
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
    console.log(ev.which);
    keypresses[ev.which] = true;
  };
  
  var keyupHandler = function(ev) {
    keypresses[ev.which] = false;
  };

  var keydown = function(key) {
    return (keypresses[key] === true);
  }

  return({
    init:    init,
    keydown: keydown
  });


})();

