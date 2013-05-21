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

// A better console.log. Limits how much it spits out. Good for when stuck inside a loop.
var logCounts = {};

var log = function(unique) {
  return(function() {
    logCounts[unique] = (logCounts[unique] || 0);

    if (logCounts[unique] < 50) {
      logCounts[unique]++;
      console.log(unique + ":");
      console.log.apply(console,arguments);
    }
  });
};


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

  var add = function(u,v) {
    return { x: u.x + v.x, y: u.y + v.y};
  };
  
  var sub = function(u,v) {
    return { x: u.x - v.x, y: u.y - v.y};
  };

  var mag = function(v) {
    return Math.sqrt(dot(v,v));
  };
  
  var scale = function(s,v) {
    return { x: s*v.x, y: s*v.y};
  };
  
  var invScale = function(s,v) {
    return { x: v.x/s, y: v.y/s};
  }

  var angle = function(v) {
    return Math.atan2(v.y, v.x);
  };

  var beta = function(v) {
    return Math.sqrt(1 - dot(v,v)/(c*c));
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
    dot: dot,
    add: add,
    sub: sub,
    mag: mag,
    scale: scale,
    invScale: invScale,
    angle: angle,
    beta: beta,
    boost: boost
  });
};

//
// S = ship's frame of reference
// P = planets' frame of reference 
//

var game = (function () {
  var lz; // Lorentz library
  var c; // speed of light
  var ended, canvas, r, width, height;
  var ship, planets;
  var universeWidth, universeHeight;
  var trans; // the translate function
  var accel;

  var init = function() {

    ended  = false;
    canvas = $('#gamecanvas')[0];
    width = $(window).width();
    height = $(window).height();
    $(canvas).width(width);
    $(canvas).height(height);
    c = width/1000;
    lz = Lorentz(c);
    accel = c/20;
    //
    // The time rate measures how many seconds pass in S as opposed to P.
    //
    ship    = { pos: { x:0, y:0 }, angle: 0, v: { x: 0, y: 0 }, timeRate: 1.0 };
    planets = randomPlanets(30);
    trans   = translate(0,0, width, height,1);

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
      ps.push({ pos: { x: rand(width*2), y: rand(height*2) }, r: Math.random()*width/30});
    }
    return ps;
  }

  var translate = function(tlx, tly, w,h, scale) {
    return function(o) {
      var sx = w/width;
      var sy = h/height;
      o.pos.cx = Math.round((ship.pos.x - o.pos.x)*sx*scale + w/2) + tlx;
      o.pos.cy = Math.round(h/2 - (ship.pos.y - o.pos.y)*sy*scale) + tly;
      o.cr = o.r * sx;
      return o;
    }
  };

  // Ship is always drawn at (0,0) co-ordinates
  var drawShip = function(thruster) {
    var pos = ship.pos,
        len = width/100, i, p,
        points = [ {pos: {x: pos.x-len, y: pos.y     }},
                   {pos: {x: pos.x+len, y: pos.y-len }},
                   {pos: {x: pos.x+len, y: pos.y+len }} ],
        path = "";
        s = trans(ship);
    var st = r.set();

    for (i=1; i < points.length; i++) {
      p = trans(points[i]);
      path += (i===0?"M":"L")+p.pos.cx+","+p.pos.cy;
    }
    p = trans(points[0]);
    path = "M"+p.pos.cx+","+p.pos.cy+path+"L"+p.pos.cx+","+p.pos.cy;

    if (thruster) {
      st.push(r.rect(ship.pos.cx-2*len, ship.pos.cy-len/4, len*2, len/2).attr({fill: "orange"}));
    }
    st.push(r.path(path).attr({fill: "teal"}));
    st.rotate(Raphael.deg(-ship.angle),s.pos.cx,s.pos.cy);
  }

  var drawDirectionVector = function(v) {
    var speed = lz.mag(v);
    var angle = lz.angle(v);
    var paddingX = 10;
    var paddingY = 50;
    var dl = 25;
    var dcx = width - (dl+paddingX), dcy = (dl+paddingY);
    var lineLen = (speed/c)*dl; // proportional to the speed
    var dx = lineLen*Math.cos(angle),
        dy = lineLen*Math.sin(angle); // Direction x and y for direction vector draw in top right.
    var dcolor = "pink";

    r.circle(dcx,dcy,dl).attr({stroke: dcolor, "stroke-width": "2"});
    r.path("M" + dcx + "," + dcy + "L" + (dcx+dx) + "," + (dcy - dy)).attr({stroke: dcolor, "stroke-width": "2px"});
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
      if (p.pos.cx >=1 && p.pos.cx <= rw && p.pos.cy >= 1 && p.pos.cy <= rh) {
        r.circle(p.pos.cx,p.pos.cy,p.cr).attr({fill: "grey"});
      }
    }

    // draw ship
    s = trans(ship);
    r.circle(ship.pos.cx,ship.pos.cy, 3).attr({fill: "teal"});

  }

  var drawPlanets = function(v) {
    var tx, ty, i, ang = lz.angle(v), scaleFactor = lz.beta(v),
        middlePath = "r"+Raphael.deg(Math.PI/2-ang)+ "s1,"+scaleFactor+ "r"+(-Raphael.deg(Math.PI/2 - ang));

    trans(ship); // Important. Need to have correct .pos.cx and .pos.cy for drawing planets.
    for (i=0; i < planets.length; i++) {
      p = trans(planets[i]);
      tx = ship.pos.cx + p.pos.cx;
      ty = ship.pos.cy - p.pos.cy;
      path = "t"+tx+","+ty+ middlePath + "t"+(-tx)+","+(-ty);
      r.circle(-p.pos.cx, -p.pos.cy, p.cr).attr({ fill: "grey"}).transform(path);
    }

  };


  var g;

  var thrust = function() {

    ship.v = lz.add(ship.v,{ x: accel*Math.cos(ship.angle), y: accel*Math.sin(ship.angle)});
    console.log(ship.v);
    console.log(lz.angle(ship.v));

  //   if (g === undefined) {
  //   var  sa = lz.angle(ship.v),
  //        ang = sa - ship.angle, // angle of the velocity relative to velocity of ship
  //         v = { x: ship.v.x*Math.cos(sa), y: ship.v.y*Math.sin(sa)},
  //         u = { x: accel*Math.sin(ang), y: accel*Math.cos(ang) },
  //         gamma = 1/(1 + (u.x*v.x)/(c*c)),
  //         b     = 1/lz.beta(v);
  //         // log("v")(v);
  //         // log("gamma")(gamma);
  //         // log("b")(b);
  // 
  //         log("v")(v);
  //         log("u")(u);
  //         log("sa")(sa);
  //         log("ang")(ang);
  // 
  // 
  // var newV = { x: u.x*gamma*b, y: (u.y + v.y)*gamma };
  // log("newV")(newV);
  // ship.v = newV;
  // log("ship.v")(ship.v);
  // log("----------")('----------');
  // }
//  g = 1;
  };
  
  var animate = function() {
    var maxPercent = 0.999;
    var angleInc = 0.12;
    var thruster = false;
    var i,p;
    var speed = lz.mag(ship.v);
    var path;
    var percentOfC = Math.round(speed/c*100000000)/1000000;

    $('#stats').text(percentOfC + "% c");

    r.clear();

    drawPlanets(ship.v);

    // Update ship state
    if (keyboard.keydown(37)) {
      ship.angle += angleInc;
    }

    if (keyboard.keydown(39)) {
      ship.angle -= angleInc;
    }

    // Thruuuuust!
    if (keyboard.keydown(38)) {
      thrust();
      thruster = true;
    }

    /*
     * Distance travelled (i.e. change in 'x' and 'y') is equal to velocity multiplied by time.
     * We're going at relativistic speeds so each "time unit"  (relative to the stars) is actually get larger.
     * Therefore we move larger distances in each time unit. The time unit is equal to 1/scaleFactor.
     * This means it starts at 1 for low velocities and gets much larger as we approach the speed of light.
     */
    var factor = 1/lz.beta(ship.v);
    ship.pos = { x: ship.pos.x + ship.v.x * factor,
                 y: ship.pos.y + ship.v.y * factor };

    drawShip(thruster);
    drawDirectionVector(ship.v);
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
//    console.log(ev.which);
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

