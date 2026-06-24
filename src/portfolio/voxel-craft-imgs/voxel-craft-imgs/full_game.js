// ||   / /                              //   ) )                   //  ) )      
// ||  / /  ___              ___     // //         __      ___   __//__  __  ___ 
// || / / //   ) ) \\ / /  //___) ) // //        //  ) ) //   ) ) //      / /    
// ||/ / //   / /   \/ /  //       // //        //      //   / / //      / /     
// |  / ((___/ /    / /\ ((____   // ((____/ / //      ((___( ( //      / /               

// Github: https://github.com/HeronErin/Voxel-HTML-engine

// Forgive the spaghetti code, code.org is not a great development enviroment.
// This 'game engine' is based entirly on passing off the job of rendering to
// the browser engine, and relies on css 3d transforms. For added speed all 
// unneeded block faces are culled before being rendered. 

// The game also supports perlin noise 3d generation, basic block collision, 
// raycast based block placement, world saving, an exploit on code.org that
// allows for resizing the game window, and not at a horrible preformence cost!




// If anyone wishes to remix the game you MUST download the perlin.csv file, ( https://github.com/HeronErin/Voxel-HTML-engine/raw/main/perlin.csv )
// create a 'perlin' table under 'data', and import the csv file.
// You MUST also create a 'users' table with the following collums uuid, settings, is_simple, worlds

// Otherwise perlin noise and level saving will not be functional



// Copyright (C) 2024 HeronErin
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License as
// published by the Free Software Foundation; either version 3 of the
// License, or (at your option) any later version.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
 


var UserId = getUserId().replace(/\//g, "SLASH");


// Screen settings
var width= 320, height=450;
var userPerspective = 400;
var doCenter= false;
var hyperSimple = false;

var lastKnownUsers = {};
var lastSpace = 0;
readRecords("users", {uuid: UserId}, function(value){
  lastKnownUsers = value[0] || {};
  userPerspective=JSON.parse(lastKnownUsers.settings || "{}").userPerspective ;
  setStyle("super_world", 'perspective: '+userPerspective+'px; position: relative; overflow: hidden; width: 100%; height: 100%; background: #87CEEB; margin: 0px');
  
  hyperSimple=readRecords.is_simple == true;
});


function resetScreenSize(){
  setStyle("divApplab", "width: "+width+"px; height:"+height+"px;" + (doCenter ? " left: -"+(width/4)+"px" : "left:0"));
  setSize("mainGame", width, height);
  if (testId("viewport"))
    setStyle("viewport", 'overflow: visible;  height: '+height+'px; width: '+width+'px; margin: 0px');
}

//  World related globals

var player;
var world;
var mainInterval;
var noise;

readRecords("perlin", {}, function(records) {
  noise=records;
});



// setParent returns true IF successfull. So use an empty element and try to add it to the element you are testing
function testId(id){return setParent("test", id);}

var Breg;

// Bring block gen funcs into global scope 
var grassBlock, stoneBlock, writePerspective, dirtBlock;
var BLOCKS;

// Dict of keys pressed in-game
var pressing;


// Useful GUI functions:
var baseElementCss = {};
var baseElementStates = {};
function SButton(id, text, x, y, callBack, w){
  if (testId(id)) return id;
  var css = "overflow: visible; position: absolute; left:"+x+"px; top:"+y+"px; background-color: light-silver; color: black; border-radius: 8px; border: 2px solid #000; width: "+(w||125)+"px; transition: opacity .75s;";
  write("<button id='"+id+"' style='"+css+"; opacity: 0'>"+text+"</button>");
  onEvent(id, "click", function(){
    if (baseElementStates[id]) callBack();
  });
  baseElementStates[id]=false;
  baseElementCss[id]=css;
  return id;
}
function SInput(id, type, value, x, y, w, h){
  if (testId(id)) return id;
  var css = "overflow: visible; position: absolute; left:"+x+"px; top:"+y+"px; background-color: light-silver; color: black; border-radius: 8px; border: 2px solid #000; width: "+(w||125)+"px;"+(h  ? "height: "+h+"px; " : "")+" transition: opacity .75s;";
  write("<input id='"+id+"' style='"+css+"; opacity: 0' type='"+type+"' value='"+value+"'></input>");
  baseElementCss[id]=css;
  return id;
}
function SHtml(id, x, y, value){
  if (testId(id)) return id;
  var css = "overflow: visible; position: absolute; left:"+x+"px; top:"+y+"px; transition: opacity .75s; ";
  write("<div id='"+id+"' style='"+css+"; opacity: 0'>"+value+"</div>");
  baseElementCss[id]=css;
  return id;
}
function disableGroupBtn(ids){
  for (var i =0; i < ids.length; i++){
    setStyle(ids[i], baseElementCss[ids[i]] + "opacity: 0");
    baseElementStates[ids[i]]=false;
  }
  setTimeout(function(){
    for (var i; i < ids.length; i++){
      setParent(ids[i], "mainGame");
    }
  }, 750);
}
function enableGroupBtn(ids){
  
  for (var i =0; i < ids.length; i++){
    setParent(ids[i], "super_world");
    // setStyle(ids[i], baseElementCss[ids[i]] + "opacity: 1");
  }
  setTimeout(function(){
    for (var i =0; i < ids.length; i++){
      baseElementStates[ids[i]]=true;
      setStyle(ids[i], baseElementCss[ids[i]] + "opacity: 1");
    }
  }, 0);
}
function enableGroupBtnW(ids){
  setTimeout(function(){enableGroupBtn(ids)}, 750);
}

var SV;

// Reinit each mode change
function game(){
var types = {};
world.blocks = world.blocks || {};

SV = function(id){
  world.blocks[id] = types[id];
};

pressing = {w:false, a:false,s:false, d:false, "Shift": false, " ": false};
player = {
  "x": 0,
  "y": 0,
  "z": 0,
  "rx": 0,
  "ry": 0,
  "rz": 0,
  "currentBlock": 1,
  "gamemode": 0, // creative, survival, spectator
  "isFlying": false
};
var lastDisplayedBlock;

// Section: Event managers

// Keep pressing up to date
onEvent("mainGame", "keydown", function(event) {
	if (world.pressKey) if (world.pressKey(event.key)) return;
	pressing[event.key] = true;
	
	if ("123456789".includes(event.key)){
	  if (lastSel) _resetSel();
	  lastSel=undefined;
    if (event.key*1 < BLOCKS.length)
      if (BLOCKS[event.key*1])
        player.currentBlock=event.key*1;
	}
	if (event.key=="Enter"&&lastSel!=undefined){
	  if (player.currentBlock < BLOCKS.length){
	    
	    var func = BLOCKS[player.currentBlock];
	    if (func){
	      console.log([lastSelP[3], lastSelP[4], lastSelP[5]]);
	      var id = func(lastSelP[3], lastSelP[4], lastSelP[5]);
	      SV(id);
	      types[id] = player["currentBlock"];
      
	    };
	    _resetSel();
      types[id] = player.currentBlock;
      
	  }
	}
	
	if (event.key=="Del"&&lastSel!=undefined){
    
	  if (blockExists(lastSelP[0], lastSelP[1], lastSelP[2])){
	    var id = "B_"+lastSelP[0]+"_"+lastSelP[1]+"_"+lastSelP[2];
	   
	    decullBlockNeighbors(lastSelP[0], lastSelP[1], lastSelP[2]);
	    delete world.block[id];
	    delete types[id];
	    
	    deleteElement(id); 
	    _resetSel();
	  }
	}
	

	
	
});
onEvent("mainGame", "keyup", function(event) {
	pressing[event.key] = false;
  if (player.gamemode == 0 && event.key == " " && Date.now()-lastSpace > 25){
    
    if (Date.now()-lastSpace < 250){
      player.isFlying = !player.isFlying;
    }
    
    lastSpace = Date.now();
  }
});



// Section: Block element builder

// Block dirs:
// EAST = +x
// WEST = -X
// SOUTH= +Z

// Cull internal unseen block faces
function _cullOnPlace(x, y, z){
  var id = "B_"+x+"_"+y+"_"+z
  if (testId("B_"+(x-1)+"_"+y+"_"+z+"_E")) {hideElement("B_"+(x-1)+"_"+y+"_"+z+"_E"); hideElement(id+"_W");}
  if (testId("B_"+(x+1)+"_"+y+"_"+z+"_W")) {hideElement("B_"+(x+1)+"_"+y+"_"+z+"_W"); hideElement(id+"_E");}
  if (testId("B_"+x+"_"+y+"_"+(z+1)+"_N")) {hideElement("B_"+x+"_"+y+"_"+(z+1)+"_N"); hideElement(id+"_S");}
  if (testId("B_"+x+"_"+y+"_"+(z-1)+"_S")) {hideElement("B_"+x+"_"+y+"_"+(z-1)+"_S"); hideElement(id+"_N");}
  if (testId("B_"+x+"_"+(y-1)+"_"+z+"_U")) {hideElement("B_"+x+"_"+(y-1)+"_"+z+"_U"); hideElement(id+"_D");}
  if (testId("B_"+x+"_"+(y+1)+"_"+z+"_D")) {hideElement("B_"+x+"_"+(y+1)+"_"+z+"_D"); hideElement(id+"_U");}
}

function styleForBlock(x, y, z){
  return 'overflow: visible; position: absolute; transform-style: preserve-3d; transform: translate3d('+(x*24)+'px, '+(y*-24)+'px, '+(z*24)+'px)'
}
function _block(x, y, z, templ, B){
  // var cx = Math.floor(x/16), cz= Math.floor(z/16);
  // var cid = "C_"+cx+"_"+cz;
  // if (!testId(cid)){
    
  // }
  
  var id = "B_"+x+"_"+y+"_"+z + ((!B) ? "" : B )
  if (testId(id)) return id;
  write(('<div id="{id}" style="'+styleForBlock(x, y, z)+'; opacity .1;">'+templ+'</div>').replace(/{id}/g, id));
  if (!B){
    _cullOnPlace(x, y, z);
  }
  setParent(id, "world");
  return id;
}
function decullBlockNeighbors(x, y, z){
  if (testId("B_"+(x-1)+"_"+y+"_"+z+"_E")) showElement("B_"+(x-1)+"_"+y+"_"+z+"_E"); 
  if (testId("B_"+(x+1)+"_"+y+"_"+z+"_W")) showElement("B_"+(x+1)+"_"+y+"_"+z+"_W"); 
  if (testId("B_"+x+"_"+y+"_"+(z+1)+"_N")) showElement("B_"+x+"_"+y+"_"+(z+1)+"_N"); 
  if (testId("B_"+x+"_"+y+"_"+(z-1)+"_S")) showElement("B_"+x+"_"+y+"_"+(z-1)+"_S"); 
  if (testId("B_"+x+"_"+(y-1)+"_"+z+"_U")) showElement("B_"+x+"_"+(y-1)+"_"+z+"_U"); 
  if (testId("B_"+x+"_"+(y+1)+"_"+z+"_D")) showElement("B_"+x+"_"+(y+1)+"_"+z+"_D"); 
}
function decullBlock(x, y, z){
  var id = "B_"+x+"_"+y+"_"+z;
  if (testId(id+"_W")) showElement(id+"_W");
  if (testId(id+"_E")) showElement(id+"_E");
  if (testId(id+"_S")) showElement(id+"_S");
  if (testId(id+"_N")) showElement(id+"_N");
  if (testId(id+"_D")) showElement(id+"_D");
  if (testId(id+"_U")) showElement(id+"_U");
}


// Section: Block html


writePerspective = function(x, y, z, rx, ry, ec, ew){
  setStyle("camera", "overflow: visible; position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate3d(0px, 0px, 400px) rotateX("+rx+"rad) rotateY("+ry+"rad)"+ec);
  setStyle("world", "overflow: visible; position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate3d("+(-x)+"px, "+(-y)+"px, "+(-z)+"px)"+ew);
}




// Blocks are stored as html elements with the world element being the parrent. 

// Block IDs are in this template B_{X}_{Y}_{Z}

var BlockTemplate = ""+
  '<div id="{id}_N" style="backface-visibility: hidden; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 24px, -12px) rotateX(180deg)">{img}</div>'+
  '<div id="{id}_S" style="backface-visibility: hidden; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 0px, 12px) rotateX(0deg) rotateY(0deg) ">{img}</div>'+
  '<div id="{id}_W" style="backface-visibility: hidden; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 0px, -12px) rotateX(0deg) rotateY(270deg)">{img}</div>'+
  '<div id="{id}_E" style="backface-visibility: hidden; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; position: absolute; transform-style: preserve-3d; transform: translate3d(24px, 0px, 12px) rotateX(0deg) rotateY(90deg)">{img}</div>'+
  '<div id="{id}_U" style="backface-visibility: hidden; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 0px, -12px) rotateX(90deg) ">{img}</div>'+
  '<div id="{id}_D" style="backface-visibility: hidden; transform-origin: 0px 0px 0px; overflow: visible; width: 24px; height: 24px; position: absolute; transform-style: preserve-3d; transform: translate3d(0px, 24px, 12px) rotateX(270deg)">{img}</div>';

var GrassBlockTemplate = BlockTemplate;
for (var s = 0; s < 6; s++){
  GrassBlockTemplate=GrassBlockTemplate.replace(
  /{img}/,
  (!hyperSimple ? '<img src="https://github.com/HeronErin/Voxel-HTML-engine/blob/main/imgs/'+(s==4 ? "grass.png" : "dirt.png")+'?raw=true" style="image-rendering: pixelated; position:relative; left: -5px; top: -5px; border:none, outline: none; width: 24px; height: 24px;"/> ':
  "<div style='width: 100%; height: 100%; background: #2f6e00'></div>")
);
}

var StoneBlockTemplate = BlockTemplate.replace(
  /{img}/g,
  ( !hyperSimple ? '<img src="https://github.com/HeronErin/Voxel-HTML-engine/blob/main/imgs/stone.png?raw=true" style="image-rendering: pixelated; position:relative; left: -5px; top: -5px; border:none, outline: none; width: 24px; height: 24px;"/> ':
  "<div style='width: 100%; height: 100%; background: #000'></div>")
);
var DirtBlockTemplate = BlockTemplate.replace(
  /{img}/g,
  ( !hyperSimple ? '<img src="https://github.com/HeronErin/Voxel-HTML-engine/blob/main/imgs/dirt.png?raw=true" style="image-rendering: pixelated; position:relative; left: -5px; top: -5px; border:none, outline: none; width: 24px; height: 24px;"/> ' : 
  "<div style='width: 100%; height: 100%; background: #5d3f00'></div>")
);
var SelTemplate = ""+
  '<div id="{id}_N" style="backface-visibility: visible; transform-origin: 0px 0px 0px; background:#FFF9; overflow: visible; width: 26px; height: 26px; position: absolute; transform-style: preserve-3d; transform: translate3d(-1px, 25px, -13px) rotateX(180deg)"></div>'+
  '<div id="{id}_S" style="backface-visibility: visible; transform-origin: 0px 0px 0px; background:#FFF9; overflow: visible; width: 26px; height: 26px; position: absolute; transform-style: preserve-3d; transform: translate3d(-1px, -1px, 13px) rotateX(0deg) rotateY(0deg) "></div>'+
  '<div id="{id}_W" style="backface-visibility: visible; transform-origin: 0px 0px 0px; background:#FFF9; overflow: visible; width: 26px; height: 26px; position: absolute; transform-style: preserve-3d; transform: translate3d(-1px, -1px, -13px) rotateX(0deg) rotateY(270deg)"></div>'+
  '<div id="{id}_E" style="backface-visibility: visible; transform-origin: 0px 0px 0px; background:#FFF9; overflow: visible; width: 26px; height: 26px; position: absolute; transform-style: preserve-3d; transform: translate3d(25px, -1px, 13px) rotateX(0deg) rotateY(90deg)"></div>'+
  '<div id="{id}_U" style="backface-visibility: visible; transform-origin: 0px 0px 0px; background:#FFF9; overflow: visible; width: 26px; height: 26px; position: absolute; transform-style: preserve-3d; transform: translate3d(-1px, -1px, -13px) rotateX(90deg) "></div>'+
  '<div id="{id}_D" style="backface-visibility: visible; transform-origin: 0px 0px 0px; background:#FFF9; overflow: visible; width: 26px; height: 26px; position: absolute; transform-style: preserve-3d; transform: translate3d(-1px, 25px, 13px) rotateX(270deg)"></div>';

var WoodBlockTemplate = BlockTemplate.replace(
  /{img}/g,
  ( !hyperSimple ? '<img src="https://github.com/HeronErin/Voxel-HTML-engine/blob/main/imgs/wood.png?raw=true" style="image-rendering: pixelated; position:relative; left: -5px; top: -5px; border:none, outline: none; width: 24px; height: 24px;"/> ' : 
  "<div style='width: 100%; height: 100%; background: #a27c33'></div>")
);

var LeafBlockTemplate = BlockTemplate.replace(
  /{img}/g,
  ( !hyperSimple ? '<img src="https://github.com/HeronErin/Voxel-HTML-engine/blob/main/imgs/leaf.png?raw=true" style="image-rendering: pixelated; position:relative; left: -5px; top: -5px; border:none, outline: none; width: 24px; height: 24px;"/> ' : 
  "<div style='width: 100%; height: 100%; background: #0f8700'></div>")
);




grassBlock= function(x, y, z, B){
  var t = _block(x, y, z, GrassBlockTemplate, B);
  types[t] = 1;
  return t;
};
stoneBlock= function(x, y, z, B){
  var t = _block(x, y, z, StoneBlockTemplate, B);
  types[t] = 2;
  return t;
};
dirtBlock= function(x, y, z, B){
  var t = _block(x, y, z, DirtBlockTemplate, B);
  types[t] = 3;
  return t;
};

var woodBlock= function(x, y, z, B){
  var t = _block(x, y, z, WoodBlockTemplate, B);
  types[t] = 4;
  return t;
};
var leafBlock= function(x, y, z, B){
  var t = _block(x, y, z, LeafBlockTemplate, B);
  types[t] = 5;
  return t;
};


BLOCKS = [undefined, grassBlock, stoneBlock, dirtBlock, woodBlock, leafBlock, undefined];




function blockExists(x, y, z){
  // console.log("B_"+x+"_"+y+"_"+z);
  return testId("B_"+x+"_"+y+"_"+z);
}
var hpi = 3.14159/2;
function getDir() {
  var dx = Math.cos(player.rx) * Math.cos(player.ry-hpi);
  var dy = Math.sin(player.rx);
  var dz = Math.cos(player.rx) * Math.sin(player.ry-hpi);

  return [dx, dy, dz];
}


function raycast() {
  var lx, ly, lz;
  var x = player.x/24, y=(player.y)/-24, z=player.z/24;
  var dir = getDir();
  var stepX = dir[0] / Math.abs(dir[0]);
  var stepY = dir[1] / Math.abs(dir[1]);
  var stepZ = dir[2] / Math.abs(dir[2]);

  var tMaxX = (stepX > 0) ? ((Math.floor(x) + 1 - x) / dir[0]) : ((x - Math.floor(x)) / -dir[0]);
  var tMaxY = (stepY > 0) ? ((Math.floor(y) + 1 - y) / dir[1]) : ((y - Math.floor(y)) / -dir[1]);
  var tMaxZ = (stepZ > 0) ? ((Math.floor(z) + 1 - z) / dir[2]) : ((z - Math.floor(z)) / -dir[2]);

  var tDeltaX = Math.abs(1 / dir[0]);
  var tDeltaY = Math.abs(1 / dir[1]);
  var tDeltaZ = Math.abs(1 / dir[2]);

  var distanceTraveled = 0;

  while (distanceTraveled < 10) {
    lx=x; ly=y; lz=z;
    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        x += stepX;
        tMaxX += tDeltaX;
      } else {
        z += stepZ;
        tMaxZ += tDeltaZ;
      }
    } else {
      if (tMaxY < tMaxZ) {
        y += stepY;
        tMaxY += tDeltaY;
      } else {
        z += stepZ;
        tMaxZ += tDeltaZ;
      }
    }

    // Check if the current position intersects with a block
    if (blockExists(Math.floor(x), Math.floor(y), Math.floor(z))) {
      return [Math.floor(x), Math.floor(y), Math.floor(z), Math.floor(lx), Math.floor(ly), Math.floor(lz)];
    }

    distanceTraveled++;
  }

  return null;
}
var lastSel, lastSelP;

function _resetSel(){
    deleteElement("B_"+lastSelP[0]+"_"+lastSelP[1]+"_"+lastSelP[2]+"_SO");
    deleteElement(lastSel); 
    lastSel = undefined;
}
var vy=0;
function main(){
  // Create initial world. 
  
  
  
  
  // Testing will now work
  write("<div id='test'></div>");
  if (testId("viewport")) deleteElement("viewport")
  
  write('<div id="viewport" style="overflow: visible;  height: '+height+'px; width: '+width+'px; margin: 0px">'+
    '<div id="super_world" style="perspective: '+userPerspective+'px; position: relative; overflow: hidden; width: 100%; height: 100%; background: #87CEEB; margin: 0px">'+
      '<div id="camera" style="overflow: visible; position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate3d(0px, 0px, 400px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">'+
        '<div id="world" style="overflow: visible; position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skewX(0deg) skewY(0deg);">'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>');
  
  if (world.world_get) world.world_get();
  

  
  // stoneBlock(0, 0, 0);



  var lastTime = Date.now();
  mainInterval = setInterval(function(){
    var deltaTime = Date.now()-lastTime;
    lastTime = Date.now();
    
    // if (!(pressing.w || pressing.s || pressing.a || pressing.d || pressing.Shift || pressing[" "] || pressing.Left || pressing.Right || pressing.Up || pressing.Down))
    //   return;
    if (!world.do_player) return world.tick_player();
    
    var cy = Math.cos(player.ry);
    var sy = Math.sin(player.ry);
    
    // Change in pos coord
    var dx = 0;
    var dz = 0;
    
    if (pressing.w) dz+=deltaTime/5;
    if (pressing.s) dz-=deltaTime/5;
    if (pressing.a) dx+=deltaTime/5;
    if (pressing.d) dx-=deltaTime/5;
    
    // Pythagerian threarum stuff to correct movement speed if going diagonal
    if ((pressing.w || pressing.s) && (pressing.a || pressing.d)){
      dz = dz/Math.abs(dz) * Math.sqrt(deltaTime/5);
      dx = dx/Math.abs(dx) * Math.sqrt(deltaTime/5);
    }
    
    var bx = Math.floor(player.x/24), by = Math.floor(player.y/-24) - 1, bz = Math.round(player.z/24);
    
    
    // See https://academo.org/demos/rotation-about-point/
    // Makes sure player is going in direction they are facing
    var px=-(dx * cy - dz * sy);
    var pz=-(dz * cy + dx * sy);
    
    // Handle y movement
    var py=0;
    if (player.isFlying || player.gamemode == 2){
      if (pressing.Shift) py+=deltaTime/5;
      if (pressing[" "]) py-=deltaTime/5;
    }else{
      if (pressing[" "]){
        vy = 24*7;
      }
      // 10 blocks per secound max downward with a downwards acceleration of 6 blocks per secound ^2
      vy= Math.max(-24*10, vy-deltaTime/1000*24*6);
      
      py-=vy*deltaTime/1000;
    }


    // Collision logic    
    if (player.gamemode != 2){
      // If the player somehow got in a block PUSH THEM OUT
      if (blockExists(bx, by, bz)){
        py=deltaTime/-10;
      }else{
        // "Normalize" the direction vector (technically not normalizing, but this is better)
        var vecx = px/Math.abs(px);
        var vecy = py/Math.abs(py);
        var vecz = pz/Math.abs(pz);
        if (blockExists(bx+vecx, by, bz)) px = 0;
        if (blockExists(bx, by-vecy, bz)) {py = 0;vy=0;}
        if (blockExists(bx, by, bz+vecz)) pz = 0;
        
        
      }
    }
    player.x+=px;
    player.y+=py;
    player.z+=pz;
    
    
    // Rotation is just adding. Units is radians, makes js math faster
    
    if (pressing.Left)  player.ry-=deltaTime/750;
    if (pressing.Right) player.ry+=deltaTime/750;
    
    if (pressing.Up)  player.rx +=deltaTime/1500;
    if (pressing.Down) player.rx-=deltaTime/1500;
    
    // Apply player changes to screen
    writePerspective(player.x, player.y, player.z, player.rx, player.ry, "", "");
    
    
    // Spectator has no need for block placement/breaking
    if (player.gamemode == 2) return;
    
    if (lastDisplayedBlock != player.currentBlock){
      if (lastDisplayedBlock!=undefined) deleteElement("B_999_999_999_S");
      
      var func = BLOCKS[player.currentBlock];
      func(999, 999, 999, "_S");
      setStyle("B_999_999_999_S", "overflow: visible; position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate3d("+(width*0.1875)+"px, -113px, 180px) rotateY(45deg) rotateX(-25deg) rotateZ(-35deg)");
      setParent("B_999_999_999_S", "super_world");
      
      lastDisplayedBlock=player.currentBlock;
    }
    
    
    var pos = raycast();
    // console.log(pos);
    
    // Use a different id format so it wont interfear with other stuff (like face culling)
    var id = (!pos) ? undefined : "B_"+pos[3]+"_"+pos[4]+"_"+pos[5]+"_SX";
  
    if (id != lastSel){
      // console.log("update sel")
      if (lastSel != undefined) {
        _resetSel();
      }
      if (pos && !blockExists(pos[3], pos[4], pos[5])){
        lastSelP=pos;
        
        var func = BLOCKS[player.currentBlock];
        func(pos[3], pos[4], pos[5], "_SX");
        lastSel=id;
        _block(pos[0], pos[1], pos[2], SelTemplate, "_SO");

        
        
      }
      
      
    }
  }, 50);
}
main();


}
// Creates titlescreen + animation
function title(goto){
  setScreen("mainGame");
  var lastRot = 0;
  var rot = 0;
  var animate = ";transition-timing-function: linear;transition: transform 5s; transform-origin: 0px 0px 0px;";
  
  var defaultRotPoint = [-71, -79, 59, -0.684, -5.433];
  var rotPoint = defaultRotPoint;
  
  var reviewIds = [];
  
  var superflatRotPoint = [-24*15, -500, -24*15, -0.684, -4];
  function defaultRotSetup(){
    reviewIds.push(grassBlock(0, 0, 0));
    reviewIds.push(grassBlock(0, 0, -1));
    reviewIds.push(grassBlock(-1, 0, 0));
    reviewIds.push(grassBlock(-1, 0, -1));
    
    reviewIds.push(stoneBlock(0, -1, 0));
    reviewIds.push(stoneBlock(0, -1, -1));
    reviewIds.push(stoneBlock(-1,-1, 0));
    reviewIds.push(stoneBlock(-1,-1, -1));
  }
  
  function superflatSetup(){
    for (var x = -5; x < 5; x++){
      for (var z = -5; z < 5; z++){
        reviewIds.push(grassBlock(x, 0, z));
        reviewIds.push(stoneBlock(x, -1, z));
        reviewIds.push(stoneBlock(x, -2, z));
        reviewIds.push(stoneBlock(x, -3, z));
      }
    }
  }
  
  
  var perlinRotPoint = [-24*15, -500, -24*15, -0.684, -4];
  var perlineTimeout;
  function perlinSetup(){
    function handleX(x){
      for (var z = -7; z < 7; z++){
        var y = Math.floor(noise[Math.floor(x)+10][Math.floor(z)+10]*10);
        reviewIds.push(grassBlock(x, y, z));
        for (var i = 3; (i--)!=1;){
          reviewIds.push(dirtBlock(x, y-i, z));
        }
      }
      // Helps with lag, perview is not important enough to take 100% cpu
      if (x < 7) perlineTimeout = setTimeout(function(){handleX(x+1);}, 50);
    }
    handleX(-7);

  }
  
  
  function changePreview(func){
    
    for (var i = 0; i < reviewIds.length; i++){
      deleteElement(reviewIds[i]);
    }
    reviewIds=[];
    writePerspective(rotPoint[0], rotPoint[1], rotPoint[2], rotPoint[3], rotPoint[4], "", ";rotateY("+rot+"deg);");
    func();
  }
  
  world = {"do_player": false, "world_get": function(){
        
        
        
        writePerspective(defaultRotPoint[0], defaultRotPoint[1], defaultRotPoint[2], defaultRotPoint[3], defaultRotPoint[4], "", ";rotateY(360deg);");
        defaultRotSetup();
        
        write("<img id='logo' src='https://raw.githubusercontent.com/HeronErin/Voxel-HTML-engine/main/imgs/logo/full.png' style='overflow: visible; position: absolute; width: 100% ' />");
        write('<div id="loadingtext" style="overflow: visible; position: absolute; top: 200px; width: 100%;text-align: center;color:white;font-size:1.4em;"> Loading...<br />If this takes too long, please refresh</div>')
        setParent("logo", "super_world");
        setParent("loadingtext", "super_world");
        var settingsScreen;
        
        readRecords("users", {uuid: UserId}, function(value_){
          deleteElement("loadingtext");
          var value=JSON.parse((value_[0] || {}).settings ||"{}");
          console.log(["got", value_])
          width = value.width || 320;
          height= value.height|| 450;
          userPerspective = value.userPerspective || 400;
          doCenter = value.doCenter==true;
          
          hyperSimple = (value_[0]||{}).is_simple==true;
          
          
          resetScreenSize();
          
          
          function apply(){
              width = getText("pw")*1;
              height = getText("ph")*1;
              userPerspective=getText("renderd")*1;
              doCenter= getChecked("pcenter");
              hyperSimple = getChecked("hypersim");
              
              // setKeyValueSync(UserId+"-hyperSimple", hyperSimple);
              var settingJson = JSON.stringify({
                width:width,
                height:height,
                doCenter:doCenter,
                userPerspective:userPerspective
              });
              var data = {uuid: UserId, settings: settingJson, is_simple:hyperSimple};
              var is_exists = readRecords("users", {uuid:UserId}, function(ret){
                
                if (ret.length != 0){
                  data.worlds = ret[0].worlds;
                  deleteRecordSync("users", {id: ret[0].id});
                }
                var x = createRecordSync("users", data);
                clearInterval(mainInterval);
                deleteElement("viewport");
                title("settings");
              });
              
              
            
              
            }
          settingsScreen=[
            SHtml("PWL", 10, 100, "<h4>Screen Width:</h4>"),
            SInput("pw", "number", width, width-150, 100),
            
            SHtml("PHL", 10, 130, "<h4>Screen Height:</h4>"),
            SInput("ph", "number", height, width-150, 130),
            
            SHtml("pcenterl", 10, 160, "<h4>Center screen:</h4>"),
            SInput("pcenter", "checkbox", doCenter, width-200, 165),
            
            SHtml("hypersiml", 10, 190, "<h4>Simplifed rendering:</h4>"),
            SInput("hypersim", "checkbox", hyperSimple, width-200, 195),
            
            SHtml("Prenderd", 10, 220, "<h4>Perspective:</h4>"),
            SInput("renderd", "number", userPerspective, width-150, 220),
            
            SButton("SRES", "Reset", width/2 - 125/2, height-95, function(){
              setText("pw", 320);
              setText("ph", 450);
              setText("renderd", 400);
              setChecked("pcenter", false);
              setChecked("hypersim", false);
              apply();
            }),
            SButton("SAPPLY", "Apply", width/2 - 125/2, height-50, apply),
            
            
            SButton("SBACKS", "Back", -5, height-50, function(){
              disableGroupBtn(settingsScreen);
              enableGroupBtnW(mainScreen);
            }, 60)
          ];
          setChecked("pcenter", doCenter);
          setChecked("hypersim", hyperSimple);
          
          // Wish I could put this in a better place
          if (goto) enableGroupBtn(({settings: settingsScreen})[goto]);
          else enableGroupBtn(mainScreen);
        });
        
        var worldCusomizeScreen = [
              SHtml("NWWarning", 0, 0, "<i>**World preview not accurate**</i>"),
              SHtml("gameModeDrop", width/2-100, 75, '<select id="gamemodedrop_" style="width: 200px; height: 30px; margin: 0px; border-style: solid; background-color: rgb(255, 255, 255); color: rgb(77, 87, 95); border-color: rgb(0, 0, 0); border-radius: 4px; border-width: 1px;"><option>Creative</option><option>Survival</option><option>Spectator</option></select>'),
              SHtml("gameGenDrop", width/2-100, 108, '<select id="gamegendrop_" style="width: 200px; height: 30px; margin: 0px; border-style: solid; background-color: rgb(255, 255, 255); color: rgb(77, 87, 95); border-color: rgb(0, 0, 0); border-radius: 4px; border-width: 1px;"><option>Superflat</option><option>Perlin</option></select>'),
              
              SButton("SBACKNW2", "Back", -5, height-50, function(){
                disableGroupBtn(worldCusomizeScreen);
                enableGroupBtnW(mainScreen);
                rotPoint=defaultRotPoint;
                changePreview(defaultRotSetup);
              }, 60),
              SButton("SCreateWD", "Create world", width-130, height-50, function(){
                disableGroupBtn(worldCusomizeScreen);
                if (perlineTimeout) clearTimeout(perlineTimeout);
                newWorld(getText("NEWWORLDNAME"), getText("gamegendrop_"), ["Creative", "Survival", "Spectator"].indexOf(getText("gamemodedrop_")));
              }, 120),
              
          ];
        
        onEvent("gamegendrop_", "change", function(){
          var value = getText("gamegendrop_");
          if (value == "Superflat"){
            rotPoint=superflatRotPoint;
            changePreview(superflatSetup);
          }
          if (value == "Perlin"){
            rotPoint=perlinRotPoint;
            changePreview(perlinSetup);
          }
          
        })
        function _newWorld(name){
          disableGroupBtn(newWorldScreen);
          enableGroupBtnW(worldCusomizeScreen);
          rotPoint=superflatRotPoint;
          changePreview(superflatSetup);
          
        }
        
        function _newWorldError(text){
            setText("textboxforerrors", text)
            setStyle("textboxforerrors","color: red; transition: opacity 2s; opacity: 1;");
            setStyle("CREATEBTN", baseElementCss.CREATEBTN + "opacity: 0");
            
            setTimeout(function(){
              setStyle("textboxforerrors","color: red; transition: opacity 2s; opacity: 0;");  
              setStyle("CREATEBTN", baseElementCss.CREATEBTN + "opacity: 1");
            }, 5000);
        }
        
        var newWorldScreen = [
            SHtml("NEWWORLDLABEL", width/2-115, height/4, "<div style='font-size: 2em; text-align: center;overflow: visible; '><b style='color: white; '>Name your world:</b></div>"),
            SInput("NEWWORLDNAME","text", "", width/2-115,  height/4+30, 225, 40),
            SButton("CREATEBTN", "Create", width/2 - 125/2, height/4+30+40+10, function(){
              var name = getText("NEWWORLDNAME");
              if (name.length == 0){
                _newWorldError("Please enter a name.");
              }else if (name.length >= 30){
                _newWorldError("Name too long.");
              }else{
                readRecords("users", {uuid: UserId}, function(value){
                  var world = UserId+"-world-"+name;
                  if (JSON.parse((value[0] || {worlds: undefined}).worlds || "[]").indexOf(world) != -1){
                    return _newWorldError("World already exists!");
                  }else{
                    _newWorld(name);
                  }
                  
                });

              }
              
              
            }),
            
            SHtml("ERRBOX", width/2 - 125/2 - 50, height/4+30+40+10, "<div style='font-size: 1.75em; text-align: center;overflow: visible; '><b style='color: red; transition: opacity 2s; opacity: 0;' id='textboxforerrors'>Error text</b></div>"),
            
            
            SButton("SBACKNW", "Back", -5, height-50, function(){
              disableGroupBtn(newWorldScreen);
              enableGroupBtnW(mainScreen);
            }, 60)
        ];
        
        var playWorldScreen = [
          SHtml("kjasi", 10, 80, "<div style='font-size: 1.9em; text-align: center;overflow: visible; '><b style='color: grey; '>Select a world:</b></div>"),
          SHtml("sdjasd", 2, 110, "<div id='world-list' style='text-align: center;overflow-y: scroll;background:#000;opacity: .6; width: "+(width-4)+"px; height: "+(height-120)+"px; '></div>"),
          
          
          SButton("jnasi", "Back", width-70, 69, function(){
              disableGroupBtn(playWorldScreen);
              enableGroupBtnW(mainScreen);
            }, 60)
        ];
        
        var mainScreen = [
          SButton("CWBTN", "Create world", 0, 100, function(){
            disableGroupBtn(mainScreen);
            enableGroupBtnW(newWorldScreen);
          }),
          SButton("PWBTN", "Play world", width-135, 100, function(){
            disableGroupBtn(mainScreen);
            function capitalizeFirstLetter(string) {
              return string.charAt(0).toUpperCase() + string.slice(1);
            }
            
            innerHTML('world-list', '<br>');
            readRecords("users", {uuid: UserId}, function(value_){
              
              var worlds=JSON.parse((value_[0] || {}).worlds || "[]");
              for (var i=0; i < worlds.length; i++){
                var name = worlds[i];
                name=name.substring(name.indexOf("world-")+6, name.length);
                write("<div id='WC-"+i+"'>"+
                "<div style='float: left; margin-left: 5px; color: Aquamarine; font-size: 1.2em;'>"+capitalizeFirstLetter(name)+"</div>"+
                "<div id='WC-length-"+i+"' style='float: right; top:0; margin-right: 5px; color: Aquamarine; font-size: 0.8em;'>Size:</div>"+
                "<br><hr>"+
                "</div>");
                setParent("WC-"+i, "world-list");
                var value = getKeyValueSync(worlds[i]);
                innerHTML("WC-length-"+i, "Size: "+Math.ceil(JSON.parse(value)[1]*2000/1024)+" KB");
                onEvent("WC-"+i, "click", function(t){
                  var world = worlds[t.currentTargetId.substring(3)*1];
                  clearInterval(mainInterval);
                  deleteElement("viewport");
                  world_handle(world, function(){
                    var value = JSON.parse(getKeyValueSync(world));
                    player = value[0];
                    writePerspective(player.x, player.y, player.z, player.rx, player.ry, "", "");
                    
                    var foundPieces = {};
                    var list = [];
                    
                     var onRecive = function(data){
                        var index = data.indexOf("!");
                        var piece = data.substring(0, index)*1;
                        foundPieces[piece] = data.substring(index+1, data.length);
                        list.push(index);
                        if (list.length==value[1]){
                          var worldlyHtml = "";
                          for (var ii=0; ii<list.length; ii++){
                            worldlyHtml+=foundPieces[ii];
                          }
                          
                          var blocks = JSON.parse(worldlyHtml);
                          var keys = Object.keys(blocks);
                          for (var blocki = 0; blocki < keys.length; blocki++){
                            var pos = opos = keys[blocki];
                            pos=pos.substring(pos.indexOf("_")+1, pos.length);
                            
                            var x = pos.substring(0, pos.indexOf("_"))*1;
                            pos=pos.substring(pos.indexOf("_")+1, pos.length);
                            var y = pos.substring(0, pos.indexOf("_"))*1;
                            pos=pos.substring(pos.indexOf("_")+1, pos.length);
                            SV(BLOCKS[blocks[opos]](x*1, y*1, pos*1));
                          }
                          // deleteElement("test");
                          
                          // innerHTML("viewport", innerViewport);
                        }
                      }
                      for (var ii = 0; ii<value[1];ii++){
                        getKeyValue(ii+"-"+world, onRecive);
                        console.log(ii+"-"+world);
                      }
                    
                    
                    
                    
                   });
                 })
                
               }
              
               enableGroupBtnW(playWorldScreen);
             });
            
            
            
          }),
          SButton("SBTN", "Settings", width/2 - 125/2, height-50, function(){
            disableGroupBtn(mainScreen);
            enableGroupBtnW(settingsScreen);
          })
        ];
        

        

      },
    "tick_player": function(){
        if (Date.now()-lastRot >= 2000){
          writePerspective(rotPoint[0], rotPoint[1], rotPoint[2], rotPoint[3], rotPoint[4], animate, "rotateY("+(rot+=90)+"deg)"+animate);
          lastRot=Date.now();
        }
        
      
    }
  };
  game();
}

function newWorld(name, type, gameMode){
  clearInterval(mainInterval);
  deleteElement("viewport");
  
  
  
  
  world_handle(name, function(_ignored){_ignored;
    writePerspective(-600,-600, -600, -0.684, -4, "", "");
    player.gamemode = gameMode;
    var x, z;
    if (type == "Superflat"){
      player.x = 0;
      player.y = -2*24;
      player.z = 0;
      
      for (x = -5; x < 5; x++){
        for (z = -5; z < 5; z++){
          SV(grassBlock(x, 0, z));
          SV(stoneBlock(x, -1, z));
          SV(stoneBlock(x, -2, z));
          SV(stoneBlock(x, -3, z));
        }
      }
    }
    if (type == "Perlin"){
      var isFirst;
      var min = -5;
      var xoff = Math.floor(Math.random()*4000);
      
      
      // Set player to 0,plerlin+2, 0
      player.x = 0;
      player.y = -2*24 - Math.floor(noise[Math.abs(min)+xoff][Math.abs(min)]*10);
      player.z = 0;

      for (x = -5; x < 10; x++){
        for (z = -5; z < 10; z++){
          var y = Math.floor(noise[Math.floor(x)+Math.abs(min)+xoff][Math.floor(z)+Math.abs(min)]*10);
          SV(grassBlock(x, y, z));
          isFirst = true;
          while (y-- >= -3){
            if (isFirst){
              SV(dirtBlock(x, y, z));
              isFirst=false;
            }else
              SV(stoneBlock(x, y, z));
          }
          // console.log([x, y, z])
      
      }
      }
    }

  });
}
function world_handle(name, genHtml){
  var isPaused = false;
  var lastEscKey = Date.now();
  
  var pauseScreen = [
    SButton("P-resume", "Resume", width/2-125/2, 100, function(){
      disableGroupBtn(pauseScreen);
      isPaused=false;
    }),
    SButton("P-exit", "Exit Without Saving", width/2-125/2, 140, function(){
      disableGroupBtn(pauseScreen);
      var areYouSureScreen = [
        SButton("P-exit-yes", "Yes", 0, 140, function(){
          clearInterval(mainInterval);
          deleteElement("viewport");
          title();
        }, 100),
        SButton("P-exit-no", "No", width-105, 140, function(){
            disableGroupBtn(areYouSureScreen);
            isPaused=false;
        }, 100),
      ];
      enableGroupBtn(areYouSureScreen);
    }),
    SButton("P-exit-save", "Exit And Save", width/2-125/2, 200, function(){
      disableGroupBtn(pauseScreen);
      
      var worldHtml = JSON.stringify(world.blocks);
      var chunckCount = Math.ceil(worldHtml.length/2000);
      console.log("Saving with "+chunckCount+" chuncks");
      var chuncks = [];
      var nil=function(){};
      var sname = (name.indexOf(UserId) != -1) ? name : UserId+"-world-"+name;
      
      for (var i = 0; i < chunckCount; i++){
        var base = (i)*2000;
        var toward = Math.min(worldHtml.length, (i+1)*2000);
        var cname = i+"-"+sname;
        console.log(base-toward);
        setKeyValue(cname, i+"!"+worldHtml.substring(base, toward), nil);
        chuncks.push(cname);
      }
      
      
      setKeyValueSync(sname, JSON.stringify([player, chuncks.length]));
      
      readRecords("users", {uuid: UserId}, function(value){
        var exists = value.length;
        value = value[0];
        if (exists) deleteRecordSync("users", {id: value.id});
        
        if (value == undefined) value = {uuid: UserId};
        
        var worlds =JSON.parse(value.worlds || "[]");
        if (worlds.indexOf(sname) == -1) worlds.push(sname);;
        
        value.worlds = JSON.stringify(worlds);
        
        
        
        delete value.id;
        createRecordSync("users", value);
        
        
      });
      // var worlds = JSON.parse(getKeyValueSync(UserId+"-worlds") || "[]");
      // worlds.push(name);
      // setKeyValueSync("worlds", JSON.stringify(worlds));
      clearInterval(mainInterval);
      deleteElement("viewport");
      title();
    })
    
  ];
  
  
  
  world = {"do_player": true, "world_get": function(){
    genHtml(name);
  }, "pressKey": function(key){
    if (key == "Esc" && Date.now()-lastEscKey > 100){
      if (!isPaused) pressing = {w:false, a:false,s:false, d:false, "Shift": false, " ": false};
      isPaused = !isPaused;
      lastEscKey=Date.now();
      
      if (isPaused) enableGroupBtn(pauseScreen);
      if (!isPaused) disableGroupBtn(pauseScreen);
    }
    
    if (isPaused) return true;
    
  }};
  game();
}
title();


