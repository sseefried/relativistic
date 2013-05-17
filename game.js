/*
 * TODO:
 * 1. Be able to turn relativity on and off.
 * 2. Show speed as a fraction of 'c'
 */

(function() {
  var lastTime=0;
  var vendors=['ms', 'moz', 'webkit', 'o'];
  var x;
  for (x=0; x<vendors.length && !window.requestAnimationFrame; ++x) {
  window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
  window.cancelAnimationFrame =
    window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x] +
      'CancelRequestAnimationFrame'];
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
});


//
// Library of Lorentz transformations in 2D.
// It must be initaliased with the value of c
// otherwise it defaults to 1.
//
// Usage: var <variable> = Lorentz(42);
//
var Lorentz = function(c) {
  c = (c || 1);
  
  // Dot product of two vectors
  var dot = function(u,v) {
    return (u.x * v.x + u.y * v.y);
  };

  var beta = function(v) {
    Math.sqrt(1 - dot(v,v)/(c*c));
  };

  // 'st' is  a space time object e.g. { x: <x>, y: <y>, t: <y> }
  // 'v'  is a velocity object { x: <x component of velocity>, 
  //                             y: <y component of velocity> }
  var boost = function(st,v) {
    return({ x: (st.x - v.x*st.t)/beta(v), 
             y: (st.y - v.y*st.t)/beta(v),
             t: (st.t - (dot(v,st)/(c*c)))/beta(v) });
  };
  
  // Export the methods of this module
  return({
    boost: boost
  });
};

var game = (function () {
  var c; // speed of light
  var ended, canvas, r, width, height;
  var ship, planets;
  var universeWidth, universeHeight;
  var trans; // the translate function

  var init = function() {

    ended  = false;
    canvas = $('#gamecanvas')[0];
    width = $(window).width();
    height = $(window).height();
    $(canvas).width(width);
    $(canvas).height(height);
    c = width/1000;
    ship    = { x:0, y:0, angle: 0.0, vx: 0, vy: 0};
    planets = randomPlanets(30);
    universeWidth
    trans = translate(0,0, width, height,1);


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
      ps.push({x: rand(width*2), y:rand(height*2), r: Math.random()*width/30});
    }
    return ps;
  }

  var translate = function(tlx, tly, w,h, scale) {
    return function(o) {
      var sx = w/width;
      var sy = h/height;
      o.cx = Math.round((ship.x - o.x)*sx*scale + w/2) + tlx;
      o.cy = Math.round(h/2 - (ship.y - o.y)*sy*scale) + tly;
      o.cr = o.r * sx;
      return(o);
    }
  };


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

  var drawDirectionVector = function(speed,angle) {
    var paddingX = 10;
    var paddingY = 50;
    var dl = 25;
    var dcx = width - (dl+paddingX), dcy = (dl+paddingY);
    var lineLen = (speed/c)*dl; // proportional to the speed
    var dx = lineLen*Math.sin(angle),dy = lineLen*Math.cos(angle); // Direction x and y for direction vector draw in top right.
    var dcolor = "pink";

    r.circle(dcx,dcy,dl).attr({stroke: dcolor, "stroke-width": "2"});
    r.path("M" + dcx + "," + dcy + "L" + (dcx-dx) + "," + (dcy + dy)).attr({stroke: dcolor, "stroke-width": "2px"});


  }

  /*
   * Draws the planets in a small radar screen in the top-left
   */
  drawRadar = function() {
    var rw = width/10, rh = height/10, trans, i, s;
    r.rect(1,1,rw,rh).attr({fill: "black", stroke: "blue"});
    // draw smaller versions of the planets, undistorted by relativity
    trans = translate(1,1,rw,rh,1/4);

    for (i=0;i<planets.length;i++) {
      p = trans(planets[i]);
      if (p.cx >=1 && p.cx <= rw && p.cy >= 1 && p.cy <= rh) {
        r.circle(p.cx,p.cy,p.cr).attr({fill: "grey"});
      }
    }

    // draw ship
    s = trans(ship);
    r.circle(ship.cx,ship.cy, 3).attr({fill: "teal"});

  }

  var drawPlanets = function(ang, scaleFactor) {
    var tx, ty,
        middlePath = "r"+Raphael.deg(ang)+ "s1,"+scaleFactor+ "r"+(-Raphael.deg(ang));

    trans(ship); // important. Need to have correct .cx and .cy for drawing planets.
    for (i=0; i < planets.length; i++) {
      p = trans(planets[i]);
      tx = ship.cx - p.cx;
      ty = ship.cy - p.cy;
      path = "t"+tx+","+ty+ middlePath + "t"+(-tx)+","+(-ty);
      r.circle(p.cx, p.cy, p.cr).attr({ fill: "grey"}).transform(path);
    }

  }

  var animate = function() {

    var maxPercent = 0.999;

    var angleInc = 0.12;
    var thruster = false;
    var i,p;

    var acceleration = c/40;
    var f = function(v) { return(Math.sqrt(1.0 - v*v/(c*c))); };
    var mag = function(x,y) { return(Math.sqrt(x*x+y*y));};
    var sgn = function(x) { return x < 0 ? -1 : 1; };
    var speed = mag(ship.vx, ship.vy);
    var speedAtAngle;

    var scaleFactor = f(speed);
    // angle the ship is travelling (not the direction it is facing)
    var ang = Math.atan2(ship.vx,ship.vy);
    var path;

    var percentOfC = Math.round(speed/c*1000)/10;


    $('#stats').text(percentOfC + "% c");

    r.clear();


    drawPlanets(ang, scaleFactor);

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

      if (mag(nvx,nvy) < maxPercent *c) {
        ship.vx = nvx;
        ship.vy = nvy;
      }
      thruster = true;
    }

    /*
     * Distance travelled (i.e. change in 'x' and 'y') is equal to velocity multiplied by time.
     * We're going at relativistic speeds so each "time unit"  (relative to the stars) is actually get larger.
     * Therefore we move larger distances in each time unit. The time unit is equal to 1/scaleFactor.
     * This means it starts at 1 for low velocities and gets much larger as we approach the speed of light.
     */
    ship.x += ship.vx * (1/scaleFactor);
    ship.y += ship.vy * (1/scaleFactor);

    drawShip(thruster);
    drawDirectionVector(speed,ang);
    drawRadar();

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

