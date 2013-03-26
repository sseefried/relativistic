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
    width = $(window).width();
    height = $(window).height();
    $(canvas).width(width);
    $(canvas).height(height);

    ship    = { x:0, y:0, angle: 0.0, vx: 0, vy: 0};
    planets = randomPlanets(25);
              
              
    keyboard.init();

    r = Raphael(canvas, $(canvas).width(), $(canvas).height());
  };

  var start = function() {
    window.requestAnimationFrame(animate, canvas);
  };

  var randomPlanets = function(n) {
    var i, ps = [];
    var rand = function(n) { return Math.round(Math.random()*n*2) - n};
    
    for (i=0; i<n; i++) {
      ps.push({x: rand(width/2), y:rand(height/2), r: Math.random()*width/50});
    }
    return ps;
  }
  
  // Translates the co-ordinates from idealised to concrete.
  var trans = function(o) {
    o.cx = Math.round((ship.x - o.x) + width/2);
    o.cy = Math.round(height/2 - (ship.y - o.y));
    return(o);
  }

  // Ship is always drawn at (0,0) co-ordinates
  var drawShip = function(thruster) {
    var len = width/100, i, p,
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
    var thruster = false;
    var i,p;
    var c = 5; // speed of "light"
    var acceleration = c/30;
    var f = function(v) { return(Math.sqrt(1.0 - v*v/(c*c))); };
    var mag = function(x,y) { return(Math.sqrt(x*x+y*y));};
    var sgn = function(x) { return x < 0 ? -1 : 1; };
    var speed = mag(ship.vx, ship.vy);
    var speedAtAngle;

    var scaleFactor = f(speed);
    var ang = Math.atan2(ship.vx,ship.vy);
    var path;
    var tx, ty;

    r.clear();

    var middlePath = "r"+Raphael.deg(ang)+ "s1,"+scaleFactor+ "r"+(-Raphael.deg(ang));

    for (i=0; i < planets.length; i++) {
      p = trans(planets[i]);
      tx = ship.cx - p.cx;
      ty = ship.cy - p.cy;
      path =  "t"+tx+","+ty+ middlePath + 
              "t"+(-tx)+","+(-ty);
      r.circle(p.cx, p.cy, p.r).attr({ fill: "grey"}).transform(path);
    }

    // Update ship state
    if (keyboard.keydown(37)) {
      ship.angle -= angleInc;
    }
    
    if (keyboard.keydown(39)) {
      ship.angle += angleInc;
    }
    
    if (keyboard.keydown(38)) {
      speedAtAngle =  mag(Math.cos(ship.angle) * ship.vy, Math.sin(ship.angle) * ship.vx);
      var partialAcc = acceleration*f(speedAtAngle);

      var nvx = ship.vx - Math.sin(ship.angle) * partialAcc;
      var nvy = ship.vy - Math.cos(ship.angle) * partialAcc;
 
      if (mag(nvx,nvy) < c) {
        ship.vx = nvx;
        ship.vy = nvy;
      }
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

