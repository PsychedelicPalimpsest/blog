// Copyright (C) 2024 HeronErin
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License as
// published by the Free Software Foundation; either version 3 of the
// License, or (at your option) any later version.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

var player = {
  "x": 0,
  "y": 0,
  "z": 0,
  "rx": 0,
  "ry": 0,
  "rz": 0
};

var BASE_PLAIN = [
  [1, 0, 1],
  [-1, 0, 1],
  [-1, 0, -1],
  [1, 0, -1],
  [1, 0, 1],
];
function plain(x, y, z, dx, dy, dz){
  var ret = [];
  for (var i = 0; i < BASE_PLAIN.length; i++){
    ret.push([BASE_PLAIN[i][0] * dx + x, BASE_PLAIN[i][1] * dy + y, BASE_PLAIN[i][2] * dz + z])
  }
  return ret;
}



var width = getProperty("canvas1", "width")*1;
var height = getProperty("canvas1", "height")*1;
function projectPoint(x, y, z){
  // Make play the orgin of the world
  x-=player.x;
  y-=player.y;
  z-=player.z;
  
  // See https://en.wikipedia.org/wiki/3D_projection
  // For prospectiv projection
  var cx = Math.cos(player.rx);
  var cy = Math.cos(player.ry);
  var cz = Math.cos(player.rz);
  
  var sx = Math.sin(player.rx);
  var sy = Math.sin(player.ry);
  var sz = Math.sin(player.rz);
  
  // Handles player rotation
  var dx = cy * (sz * y + cz * x) - sy * z;
  var dy = sx * (cy * z + sy * (sz * y + cz * x)) + cx * (cz * y - sz * x);
  var dz = cx * (cy * z + sy * (sz * y + cz * x)) - sx * (cz * y - sz * x);
  
  // Just devide by z to make 2d. Then screen width and height to normalize points
  var sx = dx/dz*width;
  var sy = dy/dz*height;
  
  // Make center of screen orgin 
  sy = height/2 - sy;
  sx += width/2;
  
  return [sx, sy] 
}

function render(obj){
  var last = null;
  for (var i = 0; i < obj.length; i++){
    var current = obj[i];
    if (last != null){
      var _2d = projectPoint(last[0], last[1], last[2]);
      var _2d2 = projectPoint(current[0], current[1], current[2]);
      // console.log(_2d);
      // console.log(_2d2);
      line(_2d[0], _2d[1], _2d2[0], _2d2[1]);
      
    }
    last = current;
    
  }
  
}


// Init
setActiveCanvas("canvas1");
var pressing = {w:false, a:false,s:false, d:false, "Shift": false, " ": false};


var lastTime = Date.now();

var int = setInterval(function(){
  var deltaTime = Date.now()-lastTime;
  lastTime=Date.now();
  // console.log(deltaTime);
  clearCanvas();
  
  
  
  
  render(plain(0, -1, 3, 1, 1, 1));
  
  // Rotate negative rot dir (same as where you are looking)
  var cy = Math.cos(-player.ry);
  var sy = Math.sin(-player.ry);
  
  // Change in pos coord
  var dx = 0;
  var dz = 0;
  
  if (pressing.w) dz+=deltaTime/100;
  if (pressing.s) dz-=deltaTime/100;
  if (pressing.a) dx-=deltaTime/100;
  if (pressing.d) dx+=deltaTime/100;
  
  // See https://academo.org/demos/rotation-about-point/
  player.x+=dx * cy - dz * sy;
  player.z+=dz * cy + dx * sy;
  
  
  // player.x+=vx;
  
  
  if (pressing.Shift) player.y-=deltaTime/100;
  if (pressing[" "]) player.y+=deltaTime/100;
  
  if (pressing.Left)  player.ry-=deltaTime/750;
  if (pressing.Right) player.ry+=deltaTime/750;
  
  if (pressing.Up)  player.rx -=deltaTime/1500;
  if (pressing.Down) player.rx+=deltaTime/1500;
}, 50);













// Keep pressing up to date
onEvent("screen1", "keydown", function(event) {
	pressing[event.key] = true;
	
});
onEvent("screen1", "keyup", function(event) {
	pressing[event.key] = false;
});

