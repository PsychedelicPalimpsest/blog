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
  '<div style="perspective: 400px; position: relative; overflow: hidden; width: 100%; height: 100%; background: #22A; margin: 0px">'+
    '<div id="camera" style="overflow: visible; position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate3d(0px, 0px, 400px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">'+
      '<div id="world" style="overflow: visible; position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">'+
      '</div>'+
    '</div>'+
  '</div>'+
'</div>')
// Block dirs:
// EAST = +x
// WEST = -X
// SOUTH= +Z


// Cull internal unseen block faces
function cullOnPlace(x, y, z){
  var id = "B_"+x+"_"+y+"_"+z
  if (innerHTML("B_"+(x-1)+"_"+y+"_"+z+"_E")) {hideElement("B_"+(x-1)+"_"+y+"_"+z+"_E"); hideElement(id+"_W");}
  if (innerHTML("B_"+(x+1)+"_"+y+"_"+z+"_W")) {hideElement("B_"+(x+1)+"_"+y+"_"+z+"_W"); hideElement(id+"_E");}
  if (innerHTML("B_"+x+"_"+y+"_"+(z+1)+"_N")) {hideElement("B_"+x+"_"+y+"_"+(z+1)+"_N"); hideElement(id+"_S");}
  if (innerHTML("B_"+x+"_"+y+"_"+(z-1)+"_S")) {hideElement("B_"+x+"_"+y+"_"+(z-1)+"_S"); hideElement(id+"_N");}
  if (innerHTML("B_"+x+"_"+(y-1)+"_"+z+"_U")) {hideElement("B_"+x+"_"+(y-1)+"_"+z+"_U"); hideElement(id+"_D");}
  if (innerHTML("B_"+x+"_"+(y+1)+"_"+z+"_D")) {hideElement("B_"+x+"_"+(y+1)+"_"+z+"_D"); hideElement(id+"_U");}
}

var BlockTemplate = ""+
'<div id="{id}_N" style="backface-visibility: hidden; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 24px, -12px) rotateX(180deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">{img}</div>'+
'<div id="{id}_S" style="backface-visibility: hidden; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 0px, 12px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">{img}</div>'+
'<div id="{id}_W" style="backface-visibility: hidden; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 0px, -12px) rotateX(0deg) rotateY(270deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">{img}</div>'+
'<div id="{id}_E" style="backface-visibility: hidden; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; position: absolute; transform-style: preserve-3d; transform: translate3d(24px, 0px, 12px) rotateX(0deg) rotateY(90deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">{img}</div>'+
'<div id="{id}_U" style="backface-visibility: hidden; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 0px, -12px) rotateX(90deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">{img}</div>'+
'<div id="{id}_D" style="backface-visibility: hidden; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 24px, 12px) rotateX(270deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">{img}</div>'

var GrassBlockTemplate = BlockTemplate.replace(
  /{img}/g,
  '<img src="https://github.com/HeronErin/Voxel-HTML-engine/blob/main/imgs/grass.png?raw=true" style="image-rendering: pixelated; position:relative; left: -5px; top: -5px; border:none, outline: none; width: 24px; height: 24px;"/> '
);
var StoneBlockTemplate = BlockTemplate.replace(
  /{img}/g,
  '<img src="https://github.com/HeronErin/Voxel-HTML-engine/blob/main/imgs/stone.png?raw=true" style="image-rendering: pixelated; position:relative; left: -5px; top: -5px; border:none, outline: none; width: 24px; height: 24px;"/> '
);

function _block(x, y, z, templ){
  var id = "B_"+x+"_"+y+"_"+z
  write(('<div id="{id}" style="overflow: visible; position: absolute; transform-style: preserve-3d; transform: translate3d('+(x*24)+'px, '+(y*-24)+'px, '+(z*24)+'px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">'+templ+'</div>').replace(/{id}/g, id));
  cullOnPlace(x, y, z);
  setParent(id, "world");
}
function grassBlock(x, y, z){
  _block(x, y, z, GrassBlockTemplate)
}
function stoneBlock(x, y, z){
  _block(x, y, z, StoneBlockTemplate)
}

for (var x = -10; x < 10; x++){
  for (var z = -10; z < 10; z++){
    grassBlock(x, -1, z);
    stoneBlock(x, -2, z);
    stoneBlock(x, -3, z);
    stoneBlock(x, -4, z);
  }
}



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
  
  setStyle("camera", "overflow: visible; position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate3d(0px, 0px, 400px) rotateX("+(player.rx)+"rad) rotateY("+player.ry+"rad) rotateZ(0deg) skewX(0deg) skewY(0deg);")
  setStyle("world", "overflow: visible; position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate3d("+(-player.x)+"px, "+(-player.y)+"px, "+(-player.z)+"px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);")
  
  // setStyle("rot", "transform-origin: center, center, 0; overflow: visible; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 0px, 0px) rotateX("+rot+"deg) rotateY("+rot+"deg) rotateZ("+rot+"deg) skewX(0deg) skewY(0deg);")
  // rot+=5;
  // console.log([player.x/24, player.y/24, player.z/24])
}, 50);



