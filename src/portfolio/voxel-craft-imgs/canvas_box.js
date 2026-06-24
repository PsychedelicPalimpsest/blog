// Copyright (C) 2024 HeronErin
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License as
// published by the Free Software Foundation; either version 3 of the
// License, or (at your option) any later version.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

(function(){
var player = {
  "x": 0,
  "y": 0,
  "z": 0,
  "rx": 0,
  "ry": 0,
  "rz": 0
};

var C_SIZE = .5;
var BASE_CUBE = [
  [[C_SIZE, 0, C_SIZE], [-C_SIZE, 0, C_SIZE]],
  [[C_SIZE, 0, C_SIZE], [C_SIZE, 0, -C_SIZE]],
  [[-C_SIZE, 0, -C_SIZE], [-C_SIZE, 0, C_SIZE]],
  [[-C_SIZE, 0, -C_SIZE], [C_SIZE, 0, -C_SIZE]],
  
  [[C_SIZE, C_SIZE, C_SIZE], [-C_SIZE, C_SIZE, C_SIZE]],
  [[C_SIZE, C_SIZE, C_SIZE], [C_SIZE, C_SIZE, -C_SIZE]],
  [[-C_SIZE, C_SIZE, -C_SIZE], [-C_SIZE, C_SIZE, C_SIZE]],
  [[-C_SIZE, C_SIZE, -C_SIZE], [C_SIZE, C_SIZE, -C_SIZE]],
  
  [[C_SIZE, 0, C_SIZE], [C_SIZE, C_SIZE, C_SIZE]],
  [[-C_SIZE, 0, C_SIZE], [-C_SIZE, C_SIZE, C_SIZE]],
  [[C_SIZE, 0, -C_SIZE], [C_SIZE, C_SIZE, -C_SIZE]],
  [[-C_SIZE, 0, -C_SIZE], [-C_SIZE, C_SIZE, -C_SIZE]],
  
];



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
  if (dz < 0) return [];
  
  // Just devide by z to make 2d. Then screen width and height to normalize points
  var sx = dx/dz*width;
  var sy = dy/dz*height;
  
  // Make center of screen orgin 
  sy = height/2 - sy;
  sx += width/2;
  
  return [sx, sy] 
}
var cwards = [];
var world = {};

function set(pos, v){world[pos]=v; cwards.push(pos);}

for (var x = 0; x < 10; x++){
  for (var y = 0; y < 3; y++){
    set([x, 0, y], 1);
  }
}

// Init
setActiveCanvas("canvas1");
var pressing = {w:false, a:false,s:false, d:false, "Shift": false, " ": false};


var lastTime = Date.now();
var has_update = true;
setFillColor("black");
setStrokeColor("#20C20E")

var deltaTime =0;
function main(){
  
  


	has_update = pressing.w || pressing.s || pressing.a || pressing.d || pressing.Shift || pressing[" "] || pressing.Left || pressing.Right || pressing.Up || pressing.Down;

	
  
  
  // console.log(deltaTime);

  rect(0, 0, width, height);
  
  
  var block, pos;
  var cache = {};
  var lines = {};
  for (var i = 0; i <= cwards.length; block = world[pos = cwards[i++]]){
    if (!block) continue;
    
    for (var ii = 0; ii < BASE_CUBE.length; ii++){
        var CB0=BASE_CUBE[ii][0];
        var CB1=BASE_CUBE[ii][1];
        var p1 = [CB0[0]+pos[0], CB0[1]+pos[1], CB0[2]+pos[2]]; 
        var p2 = [CB1[0]+pos[0], CB1[1]+pos[1], CB1[2]+pos[2]]; 
        
        
        
        // Dont draw a line twice
        var p1p2=p1.concat(p2);
        if (lines[p1p2]) continue; lines[p1p2]=1;
        
        var p11 = cache[p1];
        cache[p1] = p11 = p11 ? p11 : projectPoint(p1[0], p1[1], p1[2]);
        var p22 = cache[p2];
        cache[p2] = p22 = p22 ? p22 : projectPoint(p2[0], p2[1], p2[2]);
        if (!p11.length || !p22.length) continue;
        
        line(p11[0], p11[1], p22[0], p22[1]);
    }
    
    var pos2 = cache[pos];
    cache[pos2] = pos2 = pos2 ? pos2 : projectPoint(pos[0], pos[1], pos[2]);
    
    
    
  }
  
  
  

  
  // Rotate negative rot dir (same as where you are looking)

  
  // Change in pos coord
  var dx = 0;
  var dz = 0;
  
  if (pressing.w) dz+=deltaTime/100;
  if (pressing.s) dz-=deltaTime/100;
  if (pressing.a) dx-=deltaTime/100;
  if (pressing.d) dx+=deltaTime/100;
  
  // See https://academo.org/demos/rotation-about-point/
  player.x+=dx * Math.cos(-player.ry) - dz * Math.sin(-player.ry);
  player.z+=dz * Math.cos(-player.ry) + dx * Math.sin(-player.ry);
  
  
  // player.x+=vx;
  
  
  if (pressing.Shift) player.y-=deltaTime/100;
  if (pressing[" "]) player.y+=deltaTime/100;
  
  if (pressing.Left)  player.ry-=deltaTime/750;
  if (pressing.Right) player.ry+=deltaTime/750;
  
  if (pressing.Up)  player.rx -=deltaTime/1500;
  if (pressing.Down) player.rx+=deltaTime/1500;
  
  deltaTime = Date.now()-lastTime;
  lastTime=Date.now();
  setTimeout(main, Math.max(0, 50-deltaTime));
  // console.log("+"+deltaTime);
}
main();













// Keep pressing up to date
onEvent("screen1", "keydown", function(event) {
	pressing[event.key] = true;
	has_update=true;
	
});
onEvent("screen1", "keyup", function(event) {
	pressing[event.key] = false;
});


})();

