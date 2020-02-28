/*
	<Lutedesigner - A parametric design aid for lutes>
    Copyright (C) 2019  Lauri Niskanen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
///////////////////////////////////////////////////////////////////////////////
// Global defaults and variables
///////////////////////////////////////////////////////////////////////////////
var NAMESPACE ='http://www.w3.org/2000/svg';
var TEXTH = 10;
var DIGITS = 2; // SVG coordinate accuracy, digits after decimal point
var REDSTYLE = "stroke:#ff0000;stroke-width:0.4; fill:none;";
var BLUESTYLE = "stroke:#0000ff;stroke-width:0.4; fill:none;";
var PURPLESTYLE = "stroke:#ff00ff;stroke-width:0.4; fill:none;";
var HIDDENSTYLE = "stroke:#000000;stroke-width:0.0; fill:none;";
var THINSTYLE = "stroke:#000000;stroke-width:0.4; fill:none;";
var RIBSTYLE = "stroke:#000000;stroke-width:0.4; fill:#ff9999;";
var NOFILLTHIN = "stroke:#000000;stroke-width:0.4; fill:none;";
var THICKSTYLE = "stroke:#000000;stroke-width:0.6; fill:none;";
var OCTSTYLE = "stroke:#bb0000;stroke-width:0.4; fill:none;";
var SEVENTHSTYLE = "stroke:#0000bb;stroke-width:0.4; fill:none;";
var GREENSTYLE = "stroke:#00bb00;stroke-width:0.4; fill:none;";
var GRAYSTYLE = "stroke:#999999;stroke-width:0.4; fill:none;";
var RULERSTYLE = "stroke:#0000ff;stroke-width:0.4; fill:none;stroke-dasharray:1,1";
var GUIDESTYLE= "stroke:#000000;stroke-width:0.4; fill:none;stroke-dasharray:2,4";
var BEHINDSTYLE= "stroke:#000000;stroke-width:0.4; fill:none;stroke-dasharray:1,1";
var COVERSTYLE = "stroke:#000000;stroke-width:0.4; fill:#ffffff;";
var TEXTSTYLE = "stroke:none;stroke-width:0; fill:#000000;font-size: 10px;";
var BORDERSTYLEWHITE = "stroke:#000000;stroke-width:0.5; fill:#ffffff;";
var BORDERSTYLEBLACK = "stroke:#000000;stroke-width:0.5; fill:#000000;";
var BORDERWIDTH = 5.0;
var BOXSTYLE = "stroke:#000000;stroke-width:0.4; fill:none;";
var HANDLESEGPOINTSTYLE = "stroke:#0000bb;stroke-width:1; fill:rgba(0,0,200,0.05);";
var HANDLEPOINTSTYLE = "stroke:#bb0000;stroke-width:1; fill:rgba(200,0,0,0.05);";
var HANDLELINESTYLE = "stroke:rgba(0,0,200,0.2);stroke-width:1.0; fill:none;";
var MIRROR_HORIZONTAL = "scale(-1, 1)";
var MIRROR_VERTICAL = "scale(1, -1)";
var RIBTHICKNESS = 1.5; // Amount to offset inner outline paths for mold making

var bodylist = {}; // This will be overwritten when bodies.svg is read

var DRAWINGWIDTH = 750;
var DRAWINGHEIGHT = 800;
var FRONTVIEWORIGIN = new Point(200,DRAWINGHEIGHT-20);
var SIDEVIEWORIGIN = new Point(600,DRAWINGHEIGHT-20);
var DETACHEDORIGIN = new Point(100,150);
var CROSSVIEWORIGIN = new Point(500,200);
var NECKBLOCKORIGIN = new Point(500,300);
var FORMORIGIN = new Point(300, DRAWINGHEIGHT-20);
var editorstate = {};

var bridgelist = {};
var barlist = [];
var p1="";
var p2="";
var cachedlinelist = {}; // id:{step:linelist, step:linelist}
var rulerpos = null;
var panmovestart = null;
var editable_paths = {};
var editing = {};
var currentbody = {}; // element references to side, mirrored, middle, cross
var cps = {}; // Contains some element positions like neck joint location
var radtodeg = 0.01745329252; // degrees = radians / radtodeg

var backuptime = Date.now();
var lute3d ={};

// TODO: OOPify so that many lutes can be drawn side by side - lutedesigner-lute.js
// --> lute3d, cps, currentbody




///////////////////////////////////////////////////////////////////////////////
// Create default view when page is loaded
///////////////////////////////////////////////////////////////////////////////
var pt = null;
function makedrawing(caller){
	var t0 = performance.now();
	console.log("Drawing a",editorstate.drawingpurpose);
	// if (editorstate.drawingpurpose=="") editorstate.drawingpurpose="technical";
	// Main drawing handler, used to refresh drawing completely
	// Inputs have been gathered already and are stored in editorstate
	// Delete contentsfrom previous runs
	var drawing = getelid("designer-canvas");
	delchildren(drawing);
	cps = {};
	lute3d = {};
	// Make groups for functions to populate
	var drawing = getelid("designer-canvas");
	var drawinglayer = makegroup(drawing, "drawinglayer", "Drawing");
	
	
	// Layers for the actual plan
	var frontview = makegroup(drawinglayer, "frontview");
	var sideview = makegroup(drawinglayer, "sideview");

	decidesize(drawing,frontview,sideview);
	
	var bars = makegroup(frontview, "bars");
	var detached = makegroup(drawinglayer, "detached-pegbox");
	var border = makegroup(drawinglayer, "border");
	var crosslayer = makegroup(drawinglayer, "crosslayer");
	
	var flatlayer = makegroup(drawinglayer, "flatribs-layer");
	var formlayer = makegroup(drawinglayer, "formlayer");
	var infobox = makegroup(drawinglayer, "infobox");
	var handles = makegroup(drawing, "handlelayer");
	var measure = makegroup(drawing, "measurelayer");
	var debuglayer = makegroup(drawing, "debuglayer");

	// Draw test
	// drawtest_circle(frontview);
	
	// Draw things
	drawborder(border);
	drawfront(frontview,bars);	
	drawside(sideview);
	

	drawpegbox(frontview,sideview,detached); // Draw pegbox side and front, and detached
	
	// Draw form on a new layer/group
	// if (editorstate.drawingpurpose.indexOf("form") >=0 ){
		
	// } 
	drawribs(crosslayer); // Draw and calculate ribs in sideview and crossview
	
	// drawtest();
	
	for (var i=0; i<features.length; i++){
		features[i](); // run function added features if any
	}

	
	// drawinfobox(infobox); // Logo and instrument information
	
	
	// Draw handles for editing editable paths and things
	// hidehandles(getelid("hidehandles"));
	drawhandles();
	// Hide debuglayer
	debuglayer.setAttribute("style","display:none;");
	
	document.title = editorstate.pagetitle || "Lute Designer | Niskanen Lutes";
	if (editorstate.drawingpurpose=="") editorstate.drawingpurpose="technical";
	
	var t1 = performance.now();
	console.log("It took " + (t1 - t0).toFixed(0) + " milliseconds to draw the SVG. Called by", caller)
	backup();
	

	
}
function loadassets(){
	// Load rosettes and body shapes and materials etc. so that they are available for use in the editor. This is only performed once, on page load.
	// Global bodylist will be filled with references to body shapes defined in the body.svg file which is loaded by the html page but hidden
	var embedel = getelid("svg-bodies")
	// console.log("embedel",embedel);
	var svgdoc = embedel.contentDocument;//getSVGDocument();
	// console.log("contentel",svgdoc);
	
	// In case body svg has not yet loaded, set timeout to run this function later
	// if (svgdoc === null){
		// console.log("Tried to load assets but was not able to load svg-bodies, trying again in 200ms.");
		// setTimeout(loadassets, 200 );
		// return;
	// }
	
	
	var bodiesg = svgdoc.getElementById("bodies");
	var bodyshapes = bodiesg.children;
	for (var i=0; i<bodyshapes.length; i++){
		var name = bodyshapes[i].id.split("-")[0];
		var shape = bodyshapes[i].id.split("-")[1];

		if (bodylist[name]){
			// If a new bodyshape name is met: create a new bodyshape object in bodylist
			if (bodylist[name][shape]){
				// If this name already has this shape, show error in console; There is a duplicate in the source file
				console.log("Possible duplicate in body.svg: ",name,shape);
			} else {
				// Give name a new shape
				bodylist[name][shape] = bodyshapes[i];
				// For hard coding body shape presets
				// bodynames += '["'+name+'", 13, 2.2, 0.6],\n';
				//["venere", 13, 2.2, 0.6],
			}
		} else {
			// Make new name and shape in bodylist
			var t = {};
			t[shape] = bodyshapes[i];
			bodylist[name] = t;
		}
	}
	var bridgesvgdoc = getelid("svg-bridges").getSVGDocument();
	var bridgesg = bridgesvgdoc.getElementById("bridges");
	var bridges = bridgesg.children;
	for (var i=0; i<bridges.length; i++){
		if (bridges[i].id.indexOf("bridge-") >=0 ){
			var n = bridges[i].id.split("-")[1];
			// Bridge ends are stored as groups of paths
			bridgelist[n] = bridges[i];
		}
	}
	var theorbosvgdoc = getelid("svg-theorbos").getSVGDocument();
	theorbohead_front = theorbosvgdoc.getElementById("theorbohead-front");
	theorbohead = theorbosvgdoc.getElementById("theorbohead-side");
	
	// Set defaults for loaded assets in editor
	getelid("bodyshapefromlist").lastChild.selected=true;
	getelid("bridgestyle").lastChild.selected=true;
}

function populateeditor(){
	// Populate editor with loaded assets, and with backed up values
	// Instrument preset selection
	var ipreset = getelid("instrumentpreset");
	delchildren(ipreset);
	var newoption = creel("option", "", "", ["value", "select"]);
	newoption.innerHTML = "Select";
	addel(ipreset, newoption);
	var names = Object.getOwnPropertyNames(instrumentpresets);
	for (var i=0; i<names.length; i++){
		var newoption = creel("option", "", "", ["value", names[i]]);
		newoption.innerHTML = names[i];
		addel(ipreset, newoption);
	}
	
	// Create and fill bridge style selector
	var bridgeselector = getelid("bridgestyle");
	// Remove contents first
	delchildren(bridgeselector);
	var names = Object.getOwnPropertyNames(bridgelist);
	for (var i=0; i<names.length; i++){
		var newoption = creel("option", "", "", ["value", names[i]]);
		newoption.innerHTML = names[i];
		addel(bridgeselector, newoption);
	}
	// Create and fill body shape selector
	var bodyshape = getelid("bodyshapefromlist");
	delchildren(bodyshape);
	var names = Object.getOwnPropertyNames(bodylist);
	for (var i=0; i<names.length; i++){
		var newoption = creel("option", "", "", ["value", names[i]]);
		newoption.innerHTML = names[i];
		addel(bodyshape, newoption);
		// if (names[i] == "venere"){
			// newoption.selected = true;
		// }
	}
	// console.log("populateeditor");
	// Put values from editorstate into the editor
	var targets = Object.getOwnPropertyNames(editorstate);
	for (var i=0; i<targets.length; i++){
		// console.log("did", targets[i], editorstate[targets[i]] );
		if (getelid(targets[i])){
			if (getelid(targets[i]).type == "checkbox") {
				if (editorstate[targets[i]]){
					getelid(targets[i]).checked = true;
				} else {
					getelid(targets[i]).checked = false;
				}
			} else {
				getelid(targets[i]).value = editorstate[targets[i]];
			}
			
		}
		
		// console.log("now", targets[i],  getelid(targets[i]).value);
	}
	makenutselectors();
}

function stringing(){
	// Make a string that describes the stringing of the instrument eg. "1x1+2x6-2x7"
	var courses = "";
	if (editorstate.singlestrings){
		courses+= "1x" + editorstate.fingerboardcourses;
	} else if (editorstate.chanterelles>0){
		courses+= "1x" + editorstate.chanterelles;
		courses+= "+2x" + (editorstate.fingerboardcourses-editorstate.chanterelles);
	} else {
		courses+= "2x" + editorstate.fingerboardcourses;
	}
	if (editorstate.numbernuts > 1){
		var b = 1;
		while (editorstate["singles_"+b] !==undefined && b < editorstate.numbernuts){
			if (editorstate["singles_"+b]){
				courses+= "-1x" + editorstate["courses_"+b];
			} else {
				courses+= "-2x" + editorstate["courses_"+b];
			}
			b++;
		}
		
	}
	return courses;
}


function backup(ignoretime){
// function backup(){
	if (backuptime+1000 < Date.now() || ignoretime){
		// console.log("Saving changes in hash");
		makehash(editorstate);
		backuptime = Date.now();
   
	} else {
		// console.log("backup triggered but no changes to save.");
	}
}
function read_backup(){
	/* console.log("reading backup");
	var b = getelid("designer-backup");
	if (b.value != ""){
		editorstate = JSON.parse(b.value);
		console.log(b.value);
	} else {
		// Use defaults
		
	} */
	// Current backup system stores all data in url#hash
	readhash();
	
}

//////////////////////////////////////////////////////////////////////////
// Saving editorstate data after #

var hash_replace = {
"pagetitle": "ti",
"constructionmensur": "cm",
"constructionbottom": "cb",
"constructionside": "cs",
"constructionsmall": "ca",
"constructionlength": "cl",
"constructionwidth": "cw",
"constructionwedge": "ce",
"constructionshoulder": "csh",
"constructionshoulderlength": "csl",

"drawingpurpose": "dp",
"constructor": "co",
"presetoverlay": "po",
"bodyshapefrom": "b",
"bodyshapefromlist": "bl",
"numberofribs": "nr",
"bodyscale": "sc",
"bulge": "bu",
"divisions": "di",
"ribspread": "rsd",
"rosettelist": "rl",
"rosettescale": "rs",
"mensur": "m",
"nutunit": "nu",
"courses": "cr",
"singles": "si",
"fingerboardcourses": "fc",
"chanterelles": "ch",
"singlestrings": "ss",
"hasdiapasons": "d",
"fretsonneck": "fn",
"fingerboardstyle": "fs",
"neckwidthlimit": "nl",
"neckadd": "na",
"pegboxstyle": "ps",
"foldable": "f",
"ribspacing":"rb",
"bridgestyle": "bs",
"bridgeoffset": "bo",
"distcoursesbridge": "dcb",
"diststringsbridge": "dsb",
"distchanterellesbridge": "dhb",
"distbasscoursesbridge": "dbb",
"distcoursesnut": "dcn",
"distchanterellesnut": "dhn",
"diststringsnut": "dsn",
"distbasscoursesshortnut": "dbc",
"numbernuts": "nns",
"drawallstrings": "ds",
"limitorset": "ls",
"distbasscoursesnut": "db"};
var backwardscomp = {
"bm": "mensur_1" ,
"bc": "courses_1" ,
"sb": "singles_1" ,	
};
function makehash(obj){
	var hash = [];
	var dict = {};
	var lst = "";
	var numbers = "0123456789";
	var fields = Object.getOwnPropertyNames(obj);
	for (var i=0; i<fields.length; i++){
		var spl = fields[i].split("_");
		
		var fi = spl[0];
		if (spl[1] !== undefined){
			var num = "_" + spl[1];
		} else {
			var num = "";
		}	
		// console.log(fields[i], fi);
		if (hash_replace[fi]){ // If we have a shorthand for this field
			
			
			hash.push(hash_replace[fi]+num+"!"+escape(editorstate[fields[i]]));
			
		} else if (fields[i] === undefined || fields[i] == "undefined"){
			console.log("Undefined field for hash_replace:",i,fields[i] );
		} else {
			console.log("No shorthand for",fields[i],"in hash_replace");
			hash.push(fields[i]+escape(editorstate[fields[i]]));
		}
	}
	hash = hash.join("/");
	// console.log(hash);
	location.hash = hash;
	// return hash;
}
function readhash(){
	var hash = location.hash.split("#")[1] || "";
	hash = hash.split("/");
	var counterdict = {};
	var fields = Object.getOwnPropertyNames(hash_replace);
	for (var i=0; i<fields.length; i++){
		counterdict[hash_replace[fields[i]]] = fields[i];
	}
	var addfields = Object.getOwnPropertyNames(backwardscomp);
	for (var i=0; i<addfields.length; i++){
		counterdict[addfields[i]] = backwardscomp[addfields[i]];
	}

	for (var i=0; i<hash.length; i++){
		hash[i] = hash[i].split("!");
		// Place data in editorstate. but first convert to integers and floats where necessary
		
		// Choose target in editorstate
		if (hash[i][0].indexOf("_") >= 0) {
			// nuts and string amounts need special handling
			var spl = hash[i][0].split("_");
			var name = spl[0];
			var number = spl[1];
			var target = counterdict[name]+"_"+number;
		} else {
			var target = counterdict[hash[i][0]];
		}
		
		// Handle value deserialization or conversion
		if (target == "pagetitle"){
			// TODO: Text values, if more, make an array for checking
			console.log(target);
			editorstate[target] = unescape(hash[i][1]);
		}else if (parseFloat(hash[i][1])){
			editorstate[target] = parseFloat(hash[i][1]);
		} else if (hash[i][1] == "false"){
			editorstate[target] = false;
		} else if (hash[i][1] == "true"){
			editorstate[target] = true;
		} else {
			editorstate[target] = hash[i][1];
		}
		
	}
	
	// TODO: Remove this hack:
	
	delete(editorstate.undefined);
	delete(editorstate.singlebasses);
	delete(editorstate.bassmensur);
	delete(editorstate.basscourses);
	// console.log(hash);
	backup();
	populateeditor();
	makedrawing("readhash");
}


//////////////////////////////////////////////////////////////////////////
// window.addEventListener("load", findSVGElements, false);
window.onload = function() {
	
	editorstate.drawingpurpose="technical";
	for (var i=0; i<features_init.length; i++){
		features_init[i](); 
	}
	
	editorstate = defaultlute;

	loadassets();

	read_backup();

	settingchange();

	populateeditor();

	// Make sure editor options panel renders correct contents
	changebodymethod(true);

	// read_backup();
	setInterval(backup, 10000);
}