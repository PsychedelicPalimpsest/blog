// Copyright (C) 2024 HeronErin
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License as
// published by the Free Software Foundation; either version 3 of the
// License, or (at your option) any later version.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

var pressing = {w:false, a:false,s:false, d:false, "Shift": false, " ": false};
var player = {
  "x": 0,
  "y": 0,
  "z": 0,
  "rx": 0,
  "ry": 0,
  "rz": 0
};

// Keep pressing up to date
onEvent("screen1!!", "keydown", function(event) {
	pressing[event.key] = true;
	has_update=true;
	
});
onEvent("screen1!!", "keyup", function(event) {
	pressing[event.key] = false;
});



// Blocks are stored as html elements with the world element being the parrent. 

// Block IDs are in this template B_{X}_{Y}_{Z}

// Create initial world. 
write('<div id="viewport" style="height: 450px; width: 320px; margin: 0px">'+
  '<div style="perspective: 400px; position: relative; overflow: hidden; width: 100%; height: 100%; background: #000; margin: 0px">'+
    '<div id="camera" style="overflow: visible; position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate3d(0px, 0px, 400px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">'+
      '<div id="world" style="overflow: visible; position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">'+
      '</div>'+
    '</div>'+
  '</div>'+
'</div>')

var GrassBlockTemplate = ""+
'<div id="rot" style="overflow: visible; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">'+
'<div style="backface-visibility: visible; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; background: #0F0; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 0px, -12px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);"></div>'+
'<div style="backface-visibility: visible; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; background: #0F0; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 0px, 12px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);"></div>'+
'<div style="backface-visibility: visible; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; background: #0E1; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 0px, 12px) rotateX(0deg) rotateY(90deg) rotateZ(0deg) skewX(0deg) skewY(0deg);"></div>'+
'<div style="backface-visibility: visible; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; background: #0E1; position: absolute; transform-style: preserve-3d; transform: translate3d(24px, 0px, 12px) rotateX(0deg) rotateY(90deg) rotateZ(0deg) skewX(0deg) skewY(0deg);"></div>'+
'<div style="backface-visibility: visible; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; background: #0C2; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 0px, -12px) rotateX(90deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);"></div>'+
'<div style="backface-visibility: visible; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; background: #FC2; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 24px, -12px) rotateX(90deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);"></div>'+
'</div>'
function grassBlock(x, y, z){
  var id = "B_"+x+"_"+y+"_"+z
  write('<div id="'+id+'" style="overflow: visible; position: absolute; transform-style: preserve-3d; transform: translate3d('+x+'px, '+y+'px, '+z+'px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">'+GrassBlockTemplate+'</div>')
  setParent(id, "world")
}


grassBlock(0, 0, -500);
grassBlock(0, 0, -500+40);
var rot = 0;

var lastTime = Date.now();
setInterval(function(){
  var deltaTime = Date.now()-lastTime;
  lastTime = Date.now();
  
  var cy = Math.cos(player.ry);
  var sy = Math.sin(player.ry);
  
  // Change in pos coord
  var dx = 0;
  var dz = 0;
  
  if (pressing.w) dz+=deltaTime/5;
  if (pressing.s) dz-=deltaTime/5;
  if (pressing.a) dx+=deltaTime/5;
  if (pressing.d) dx-=deltaTime/5;
  
  // See https://academo.org/demos/rotation-about-point/
  player.x-=dx * cy - dz * sy;
  player.z-=dz * cy + dx * sy;
  
  
  
  
  if (pressing.Shift) player.y+=deltaTime/5;
  if (pressing[" "]) player.y-=deltaTime/5;
  
  if (pressing.Left)  player.ry-=deltaTime/750;
  if (pressing.Right) player.ry+=deltaTime/750;
  
  if (pressing.Up)  player.rx +=deltaTime/1500;
  if (pressing.Down) player.rx-=deltaTime/1500;
  
  setStyle("camera", "overflow: visible; position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate3d(0px, 0px, 400px) rotateX("+player.rx+"rad) rotateY("+player.ry+"rad) rotateZ(0deg) skewX(0deg) skewY(0deg);")
  setStyle("world", "overflow: visible; position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate3d("+(-player.x)+"px, "+(-player.y)+"px, "+(-player.z)+"px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);")
  
  setStyle("rot", "transform-origin: center, center, 0; overflow: visible; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 0px, 0px) rotateX("+rot+"deg) rotateY("+rot+"deg) rotateZ("+rot+"deg) skewX(0deg) skewY(0deg);")
  rot+=5;
  // console.log(player)
}, 50);



