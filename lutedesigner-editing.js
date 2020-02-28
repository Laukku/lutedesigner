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
// editorstate - object for creating options and storing user input in hash
///////////////////////////////////////////////////////////////////////////////
// editor is created from this multilevel list, but data is stored in a flat object
// var options = [
	// {"Body":[
		// new opt("bodyshapefrom"),
		// new opt("bodyshapefrom"),
		// new opt("bodyshapefrom"),
		// new opt("bodyshapefrom"),
	// ]},
	// []
// ];
// function opt (name,type,options,children){
	// this.name = name;
	// return this;
// }
// Preset option boxes that don't store their selection, only affect other fields that are stored
// Conditional option boxes that affect what other boxes are visible. What if parent has many options?
// Need to be able to give an opt new options on the fly









///////////////////////////////////////////////////////////////////////////////
// User interaction functions
///////////////////////////////////////////////////////////////////////////////


function zoom_editor(ev){
	// Zoom event handler; Attempts to zoom so that the part of the svg under the mouse remains there after zooming

	ev.preventDefault();
	var wrapper = getelid("designer-canvas-wrapper");
	var drawing = getelid("designer-canvas");

	zpt.x = ev.clientX; 
	zpt.y = ev.clientY;
	// zpt: cursor in px in html, point: in svg in mm (uunits)
	var point = zpt.matrixTransform(drawing.getScreenCTM().inverse());
	// Parse old viewbox from svg
	var orcoords = drawing.getAttribute("viewBox");
	orcoords = orcoords.split(" ");
	orcoords = {x:parseFloat(orcoords[0]), y:parseFloat(orcoords[1]), w:parseFloat(orcoords[2]), h:parseFloat(orcoords[3])};
	// Choose zoom direction based on scroll wheel
	var level=1;
	if (ev.deltaY < 0){
		level = 0.8; 
	} else {
		level = 1.25; 
	}
	var newW = orcoords.w*level;
	var newH = orcoords.h*level;
	var newX = (orcoords.x - point.x) * level + point.x;
	var newY = (orcoords.y - point.y) * level + point.y;

	drawing.setAttribute("viewBox",""+newX+" "+newY+" "+newW+" "+newH);
}
function getmensur(bnut){
	// This function should always be used instead of directly accessing editorstate.mensur_n
	// return absolute float value for bass nut mensurs based on chosen unit
	if (editorstate["mensur_"+bnut] && editorstate["nutunit_"+bnut]){
		if (editorstate["nutunit_"+bnut] == ""){
		}else if (editorstate["nutunit_"+bnut] == "frets"){
			// Calculate distance in frets
			fretpos = [0,0.056125,0.10910,0.159105,0.20630,0.250845,0.292895,0.33258,0.37004,0.405395,0.43877,0.47027,0.50000];
			fretpos.reverse();
			fretpos.forEach(function(item, index, array) {
				array[index] = 1-item;
			});
			var frets = editorstate["mensur_"+bnut];
			
			// var fpos = fretpos[parseInt(frets)];
			// console.log(frets,fpos );
			var out = editorstate.mensur;
			if (frets > 0 && frets <= 12 ) {
				out = (editorstate.mensur*2) * fretpos[parseInt(frets)];
			} else if (frets > 12 && frets <= 24 ) {
				console.log("many frest!" );
				out = (editorstate.mensur*4) * fretpos[parseInt(frets)-12];
			} 
			
			
			
			
			return out;
			
		}else if (editorstate["nutunit_"+bnut] == "percent"){
			// Calculate distance in percent
			return (editorstate["mensur_"+bnut]/100.0) * editorstate.mensur;
		}else if (editorstate["nutunit_"+bnut] == "addmm"){
			// Add to fingerboard mensur
			return editorstate["mensur_"+bnut] + editorstate.mensur;
		} else {
			// absolute
			return editorstate["mensur_"+bnut];
		}
	} else if(editorstate["mensur_"+bnut]) {
		// absolute
		return editorstate["mensur_"+bnut];
	} else {
		return null; // or maybe mensur? or mensur*2?
	}
}

function settingchange(el){
	// console.log("settingchange");
	// Gather data from changed element and put it in editorstate, then redraw svg
	if (el){
		// Called by changing a single input in control panel
		if (el.type=="checkbox"){
			console.log("checkbox clicked", el.id, el.value);
			editorstate[el.id] = el.checked;
		// } else if (el.type=="number") {
			// if nut_* or mensur_*
			// TODO: calculate editorstate.mensur_* based on unit that is shown
			// mensur in editorstate should always be absolute float value, but should be shown in the chosen unit.
			
			
		} else if (el.type=="number") {
			editorstate[el.id] = parseFloat(el.value);
		} else {
			editorstate[el.id] = el.value;
			// If body shape was changed, load its corresponding shape presets from bodypresets
			if (el.id=="bodyshapefromlist" && bodypresets && bodypresets[el.value]){
				editorstate.numberofribs = bodypresets[el.value][0];
				getelid("numberofribs").value = bodypresets[el.value][0];
				editorstate.bulge = bodypresets[el.value][1];
				getelid("bulge").value = bodypresets[el.value][1];
				editorstate.ribspread = bodypresets[el.value][2];
				getelid("ribspread").value = bodypresets[el.value][2];
				// TODO: editorstate.changeval("ribspread", bodypresets[el.value][2])
			} else if (el.id=="bodyshapefromlist") {
				// console.log("else in settingchange type");
				editorstate.numberofribs = 9;
				getelid("numberofribs").value = 9;
				editorstate.bulge = 2.2;
				getelid("bulge").value = 2.2;
				editorstate.ribspread = 1;
				getelid("ribspread").value = 1;
			}
			
		}
		backup();
		makedrawing("settingchange el");
	} else {
		// Called by a function, regather all data from editor
		// Get all <label>s, check if child has onchange= settingchange(this)
		var labels = document.getElementsByTagName("label");
		for (var i=0; i<labels.length;i++){
			if(labels[i].hasChildNodes()){
				if(labels[i].children[0].getAttribute("onchange") == "settingchange(this)"){
					editorstate[labels[i].children[0].id] = labels[i].children[0].value;
					if (labels[i].children[0].type=="checkbox"){
						editorstate[labels[i].children[0].id] = labels[i].children[0].checked;
						// console.log("settinchange cjheckbox");
						// console.log(labels[i].children[0].id);
					} else if (labels[i].children[0].type=="number") {
						editorstate[labels[i].children[0].id] = parseFloat(labels[i].children[0].value);
					} else{
						editorstate[labels[i].children[0].id] = labels[i].children[0].value;
					}
				}
			}
		}
		backup();
	}
	
}

function alter_editorstate (name, new_value, redraw){
	// Change value shown in editor and in editorstate
	editorstate[name] = new_value;
	var el = getelid(name);
	console.log(el.type);
	if (el.type =="checkbox"){
		if (new_value){
			el.checked = true;
		} else {
			el.checked = false;
		}
	} else {
		el.value = new_value;
	}
	
	if (redraw) makedrawing("alter_editorstate");
}


function makenutselectors(el){
	// nutname	mensur	unit	strings	single?
	// chanterelles as a separate checkbox above
	if (el) editorstate.numbernuts = el.value;
	// console.log(editorstate.numbernuts);
	var t = getelid("nut_table");
	delchildren(t);
	var thr = creel("tr");
	addel(t,thr);
	["Name", "Mensur", "Unit", "# Courses", "All Singles"]
	.forEach(function(item, index, array) {
		var th = creel("th");
		th.innerHTML = item;
		addel(thr,th);
	});
	for (var i=0; i<editorstate.numbernuts; i++){
		var tr = creel("tr");
		addel(t,tr);
		// Name 
		var td = creel("td");
		if (i==0) {
			td.innerHTML = "Fingerboard"; 
		} else if (i==1 && editorstate.numbernuts==2){
			if (editorstate.pegboxstyle=="bassrider"){
				td.innerHTML = "Bass rider"; 
			} else {
				td.innerHTML = "Extension"; 
			}
		} else {
			td.innerHTML = "Nut " + i; 
		}
		addel(tr,td);
		
		// Mensur
		var td = creel("td");
		var input = creel("input");
		input.setAttribute("type","number");
		
		input.setAttribute("onchange","settingchange(this);");
		if (i==0){
			input.value = editorstate.mensur;
			input.setAttribute("id","mensur");
		} else {
			input.value = editorstate["mensur_"+i];
			input.setAttribute("id","mensur_"+i);
		}
		addel(td,input);
		addel(tr,td);
		
		// Unit
		var td = creel("td");
		var sel = creel("select");
		if (i!=0) {
			sel.id = "nutunit_"+i;
			sel.setAttribute("onchange","settingchange(this);");
		}
		[["mm","absolute mm"],["addmm","mensur + mm"],["percent","% of mensur"],["frets","Frets"]]
		.forEach(function(item, index, array) {
			if (i!=0 || (i==0 && index==0)){
				var opt = creel("option");
				addel(sel,opt);
				opt.setAttribute("value", item[0]);
				opt.innerHTML = item[1];
				
			}
			
		});
		if (editorstate["nutunit_"+i]) sel.value = editorstate["nutunit_"+i];
		addel(td,sel);
		addel(tr,td);
		
		// number of strings on this nut
		var td = creel("td");
		var input = creel("input");
		input.setAttribute("type","number");
		input.setAttribute("onchange","settingchange(this);");
		if (i==0){
			input.setAttribute("id","fingerboardcourses");
			input.value = editorstate.fingerboardcourses;
		} else {
			input.setAttribute("id","courses_"+i);
			input.value = editorstate["courses_"+i];
		}
		
		addel(td,input);
		addel(tr,td);
		
		// All single strings on this nut?
		var td = creel("td");
		var input = creel("input");
		input.setAttribute("type","checkbox");
		input.setAttribute("onchange","settingchange(this);");
		if (i==0){
			input.setAttribute("id","singlestrings");
			if (editorstate.singlestrings) input.checked = true;
		} else {
			input.setAttribute("id","singles_"+i);
			if (editorstate["singles_"+i]) input.checked = true;
		}
		addel(td,input);
		addel(tr,td);
		
	}
}



function changebodymethod (silent) {

	// hide and show additional options
	var el = getelid("bodyshapefrom");
	var handles = getelid("handlelayer");
	var btn = getelid("hidehandles");
	
	if(el.value == "fromlist"){ // Load a preset path from SVG as the body shape
		// console.log("changebodymethod fromlist");
		// getelid("bodyshapefromlist").parentNode.style = "";
		getelid("constructionoptions").style = "display:none";
		editorstate.bodyshapefrom = "fromlist";
		
		if (handles) handles.classList.add("hidehandles");
		if (btn) btn.innerHTML = "Show handles";
	} else if (el.value == "classical"){ // Classical construction from circles
		console.log("changebodymethod else");
		// getelid("bodyshapefromlist").parentNode.style = "display:none";
		// getelid("presetoverlay").parentNode.style = "";
		getelid("constructionoptions").style = "margin-left:1em;";
		editorstate.bodyshapefrom = "classical";
		// Show handles too
		if (handles) handles.classList.remove("hidehandles");
		if (btn) btn.innerHTML = "Hide handles";
		// makeclassicalpreset()
	}
	
	// Redraw the editor if bodymethod was actually changed
	if (!silent) makedrawing("changebodymethod");
	
	
}

function spacingpresetchange(el){
	// Change string spacings in editor and redraw lute
	console.log("spacingpresetchange", el);
	var e=editorstate;
	var spacingpresets = {
		"renaissance": [9.9, 5, 10.5, 9.9,   6.4, 8.1, 2.5, 3.6,    5],
		"baroque11c": [8.5, 5, 10, 9.9,    6, 7.5, 2.5, 3.6,    5],
		"baroque13c": [7.8, 5, 10, 9.9,    6, 7.5, 2.5, 3.6,    4],
		"theorbosingle": [12, 5, 12, 10.2,    8, 8, 2.5, 7,     5],
		"archlute": [7.8, 5, 8.5, 10.2,    6.4, 8.1, 1.8, 3.6,    5],
		"guitar": [9, 5, 11, 9,    6.7, 6.5, 2, 6.7, 5]};
	var ids = ["distcoursesbridge", "diststringsbridge", 	
		"distchanterellesbridge", "distbasscoursesbridge", 
	
		"distcoursesnut", "distchanterellesnut", "diststringsnut", "distbasscoursesshortnut",	 "distbasscoursesnut"  ];
	// var b = getelid("bridge");
	var sel = spacingpresets[el.value];
	for (var i = 0; i< sel.length; i++){
		// console.log("spacingpresetchange", ids[i]);
		getelid(ids[i]).value = sel[i];
	}
	
	e.distcoursesbridge = sel[0];
	e.diststringsbridge = sel[1];
	e.distchanterellesbridge = sel[2];
	e.distbasscoursesbridge = sel[3];
	
	e.distcoursesnut = sel[4];
	e.distchanterellesnut = sel[5];
	e.diststringsnut = sel[6];
	e.distbasscoursesshortnut = sel[7];
	e.distbasscoursesnut = sel[8];
	settingchange(); // Save spacings to editorstate
	makedrawing("spacingpresetchange");
}
function register_editable(){
	// Register SVG path as editable, so its handle points will get drawn
	for (var i=0; i<arguments.length;i++){
		editable_paths[arguments[i].id] = arguments[i];
		
	}
}

function hidehandles(src){
	var handles = getelid("handlelayer");
	var btn = getelid("hidehandles");
	if (btn.innerHTML == "Hide handles"){
		if (handles) handles.classList.add("hidehandles");
		btn.innerHTML = "Show handles";
	} else {
		if (handles) handles.classList.remove("hidehandles");
		btn.innerHTML = "Hide handles";
	}

}

function drawhandles(){
	// Draw handles for path editing
	// Paths to be edited must be saved in global editable_paths[]
	if (!getelid("hidehandles")) return;
	if (getelid("hidehandles").innerHTML == "Show handles"){
		getelid("handlelayer").classList.add("hidehandles");
	}
	// var drawing = getelid("designer-canvas");
	// var handles = makegroup(drawing, "handlelayer");
	var handles = getelid("handlelayer");
	
	// console.log(seglist);
	// for (var j=0; j<editable_paths.length;j++){
	for (var id in editable_paths){
	  if (editable_paths.hasOwnProperty(id)){
		var path = editable_paths[id];
		var seglist = path.pathSegList;
		var lenseglist = seglist.numberOfItems;
		var seg0 = seglist.getItem(0);
		var cur = new Point(seg0.x, seg0.y);
		for (var i=1; i<seglist.length;i++){
			// console.log(seglist[i].x,seglist[i].y);
			var seg = seglist.getItem(i);
			if (seg.pathSegTypeAsLetter == "c"){
				// Draw control points for bezier curves
				var l1 = drawline(handles, 
						[cur, cur.move(seg.x1,seg.y1)],
						HANDLELINESTYLE,"line:"+id+":"+i+":1");
				var l2 = drawline(handles, 
						[cur.move(seg.x,  seg.y),
						 cur.move(seg.x2, seg.y2)],
						HANDLELINESTYLE,"line:"+id+":"+i+":2");
				l1.onmousedown = prevdef;
				l2.onmousedown = prevdef;
				
				var xy1 = drawcircle(handles, 
						cur.move(seg.x1,seg.y1),3, 
						HANDLEPOINTSTYLE,"point:"+id+":"+i+":1");
				xy1.onmousedown = editpath;
				xy1.setAttribute("data-cur.x",cur.x);
				xy1.setAttribute("data-cur.y",cur.y);
				var xy2 = drawcircle(handles, 
						cur.move(seg.x2, seg.y2),3, 
						HANDLEPOINTSTYLE,"point:"+id+":"+i+":2");
				xy2.onmousedown = editpath;
				xy2.setAttribute("data-cur.x",cur.x);
				xy2.setAttribute("data-cur.y",cur.y);
				
			} 
			var ox = cur.x;
			var oy = cur.y;
			
			cur.x += seg.x;
			cur.y += seg.y;
			
			// console.log(cur.x,cur.y);
			var endpoint = drawcircle(handles, cur, 3, 
							HANDLESEGPOINTSTYLE,"segpoint:"+id+":"+i);
			endpoint.onmousedown = editpath;
			// endpoint.setAttribute("data-id",id);
			endpoint.setAttribute("data-cur.x",ox);
			endpoint.setAttribute("data-cur.y",oy);
		}
		var startpoint = drawcircle(handles, 
				new Point(seg0.x,seg0.y),3, 
				HANDLESEGPOINTSTYLE,"startpoint:"+id+":"+"0");
		startpoint.onmousedown = editpath;
		startpoint.setAttribute("data-cur.x",0);
		startpoint.setAttribute("data-cur.y",0);
	  }
	}
}

///////////////////////////////////////////////////////////////////////////////
// SVG editing event handlers
///////////////////////////////////////////////////////////////////////////////


function editpath(ev){
	ev.preventDefault();
	// console.log("started", ev);
	var drawing = getelid("designer-canvas");
	drawing.setAttribute("data-editingpath", ev.target.id);
	editing = {}; // Start from scratch
	editing.edittype = "path";
	
	var d = ev.target.id.split(":");
	var path = getelid(d[1]);
	editing.pathid = d[1];
	// console.log(path);
	var seg0 = path.pathSegList.getItem(0);
	editing.startpos = {"x": seg0.x, "y": seg0.y};
	editing.segment = parseInt(d[2]); 
	editing.handle = isNaN(parseInt(d[3])) ? "" : parseInt(d[3]);
	editing.handleid = ev.target.id;
	// console.log(d[2]);
	if (editing.segment == "0") {
		// First segment, handlepos equals x,y
		editing.handlepos = {"x": seg0.x, "y": seg0.y};
	} else {
		 
		var seg = path.pathSegList.getItem(parseInt(d[2]));
		editing.handlepos = {"x": seg["x"+d[3]], "y": seg["y"+d[3]]};
	}
	
	editing.segstartpos = {"x": parseInt(ev.target.getAttribute("data-cur.x")), "y": parseInt(ev.target.getAttribute("data-cur.y"))};
	// Get client mouse coordinates and convert to svg coordinates
	// initiate move
	// Add mouseup event to ev.target
	drawing.onmousemove = movingpath; // Add this to svg so the cursor can't escape
	drawing.onmouseup = finisheditingpath;
}
function prevdef(ev){ev.preventDefault();}

function movingpath(ev){
	ev.preventDefault();
	var drawing = getelid("designer-canvas");
	// Find svg coordinates from client coordinates 
	pt.x = ev.clientX; pt.y = ev.clientY;
	var point = pt.matrixTransform(drawing.getScreenCTM().inverse());
	// console.log("moving", point.x,point.y);
	// and redraw handles to that point
	var handle = getelid(editing.handleid);
	handle.setAttribute("cx",point.x);
	handle.setAttribute("cy",point.y);
	var lineid = editing.handleid.split(":")
	var curseg = parseInt(lineid[2]);
	var curhandle = parseInt(lineid[3]);
		lineid = ["line",lineid[1]].join(":");
	if (!editing.handle){
		// This is a segment end point, so move both lines that are connected
		var line1 = getelid(lineid+":"+curseg+":2");
		var line2 = getelid(lineid+":"+(curseg+1)+":1");

		if (line1){
			var seg = line1.pathSegList.getItem(0);
			seg.x = point.x;
			seg.y = point.y;
		}
		if (line2){
			var seg = line2.pathSegList.getItem(0);
			seg.x = point.x;
			seg.y = point.y;
		}
		// console.log(lineid);
		var newx = point.x-(editing.segstartpos.x);
		var newy = point.y-(editing.segstartpos.y);
		// TODO: All segment end points after this one need to be moved back by the amount this one was moved
		// TODO: Move handle 2 from previous segment the same amount
	} else {
		// This is a handle, only one line needs to be moved
		var line = getelid(lineid+":"+curseg+":"+curhandle);
		var seg = line.pathSegList.getItem(1);
		seg.x = point.x;
		seg.y = point.y;
		
		var newx = point.x-(editing.segstartpos.x);
		var newy = point.y-(editing.segstartpos.y);
		
	}
	// Change path too
	var path = getelid(editing.pathid);
	// console.log("x"+editing.handle);
	var seg = path.pathSegList.getItem(editing.segment);
	seg["x"+editing.handle] = newx;
	seg["y"+editing.handle] = newy;
	
	// Make sure cachedlinelist is recalculated for edited paths
	delete cachedlinelist[editing.pathid];
	// if path is edge or mirror, change the other one too
	var pname = editing.pathid.split("-");
	if (pname[1] == "edge"){
		
		if (pname[2]){ // is mirrored
			var pathn = pname[0]+"-"+pname[1];
			var path = getelid(pathn);
			var seg = path.pathSegList.getItem(editing.segment);
			seg["x"+editing.handle] = -newx;
			seg["y"+editing.handle] = newy;
			delete cachedlinelist[pathn];
		} else { // is the original edge
			var pathn = getelid(pname[0]+"-"+pname[1]+"-mirrored");
			var path = getelid(pathn);
			var seg = path.pathSegList.getItem(editing.segment);
			seg["x"+editing.handle] = -newx;
			seg["y"+editing.handle] = newy;
			delete cachedlinelist[pathn];
		}
	}
	
	
}
function finisheditingpath(ev){
	ev.preventDefault();
	// console.log("finished", ev)
	var drawing = getelid("designer-canvas");
	pt.x = ev.clientX; pt.y = ev.clientY;
	var point = pt.matrixTransform(drawing.getScreenCTM().inverse());
	var ele = drawing.getAttribute("data-editingpath");
	// console.log("finished", point.x,point.y, ele);
	// Remove event handlers from drawing
	drawing.onmousemove = null;
	drawing.onmouseup = null;
	// Save edited path so it will be reloaded in its edited state
	
	// Refresh drawing
	makedrawing("finishededitingpath");
}

function mousecoords(evt){
	// Draws mouse coordinates on screen. If middle mouse button is pressed, also calculates distance from start point to current point.
	// console.log(evt);
	// Capture mouse coordinates in SVG units

	var svg = getelid("designer-canvas");
	pt.x = evt.clientX; 
	pt.y = evt.clientY;
	var point = pt.matrixTransform(svg.getScreenCTM().inverse());
	// console.log(pt,point);
	var handles = getelid("measurelayer");
	if (evt.type == "mousedown" && evt.which == 2){
		// Middle mouse for measuring - save position
		rulerpos = {"x": point.x, "y": point.y};
		var zero = new Point(0,0);
		var l = drawline(handles,[zero,zero], RULERSTYLE, "rulerline");
	} else if (evt.type == "mouseup" && evt.which == 2) {
		// Delete position so ruler won't get drawn
		rulerpos = null;
		var rline = getelid("rulerline");
		if (rline){delel(rline);}
	}  else if (evt.type == "mouseup" && evt.which == 1) {
		// Delete position so pan/move won't happen again
		panmovestart = null;

	} else if (evt.type == "mousedown" && evt.which == 1){
		// Pan/move drawing
		// console.log("ctrl click");
		var wrapper = getelid("designer-canvas-wrapper");
		// console.log(pt.x, pt.y);
		evt.preventDefault();
		var orcoords = svg.getAttribute("viewBox");
		orcoords = orcoords.split(" ");
		var scale = orcoords[2] / wrapper.clientWidth;
		// console.log(orcoords);
		// Why does this not trigger many times but rulerpos works?
		panmovestart = {mouse:new Point(pt.x, pt.y), viewbox:orcoords, scale:scale};
		
	} 

	// creel(tagname, id, cla, attrs, NS, del)
	var cbox = getelid("mousecoordtext");
	if (cbox){delel(cbox);}
	// Add ruler data if middle mouse is pressed and a start point is available
	if (rulerpos) {
		var shiftright = 15;
		var size = 10;
		var textcoord = new Point(pt.x+shiftright, pt.y-10);
		var styling = "position:fixed; font-size: 1em; top:"+(pt.y+10)+"px; left:"+(pt.x+shiftright)+"px;";

		// Draw text at pt in the main html document
		cbox = creel("div", "mousecoordtext", null, ["style",styling])
		addel(getelid("pagewrapper"), cbox);
		
		// Mouse coordinates in a div
		var tspan = creel("div","mousepos","",null);
		tspan.innerHTML = "Pos: " + point.x.toFixed(0)+", "+point.y.toFixed(0);
		addel(cbox, tspan);
		var xmove = point.x-rulerpos.x;
		var ymove = rulerpos.y-point.y;
		// Hypotenuse
		var dist = Math.sqrt((xmove)**2+(ymove)**2)
		tspan = creel("div","mouseXdist","",["dy", 10,"x", point.x+shiftright]);
		tspan.innerHTML =  "X: " + (xmove.toFixed(1));
		addel(cbox, tspan);
		
		tspan = creel("div","mouseYdist","",["dy", 10,"x", point.x+shiftright]);
		tspan.innerHTML =  "Y: " + (ymove.toFixed(1));
		addel(cbox, tspan);
		
		tspan = creel("div","mousedist","",["dy", 10,"x", point.x+shiftright]);
		tspan.innerHTML =  "Dist: " + (dist.toFixed(1));
		addel(cbox, tspan);
		// Draw line
		var l = getelid("rulerline");
		l.setAttribute("d","M "+rulerpos.x + " " + rulerpos.y + " L " + point.x + " " +point.y);
		
	} else if (panmovestart){
		// Calculate difference between start and current
		// TODO: Something funny going on here...
		var dx = (pt.x-panmovestart.mouse.x)*panmovestart.scale;
		var dy = (pt.y-panmovestart.mouse.y)*panmovestart.scale;
		// console.log(dx,dy);
		// console.log(panmovestart.mouse);
		// console.log(panmovestart.viewbox);
		// console.log("Viewbox now: ", svg.getAttribute("viewBox"));
		svg.setAttribute("viewBox", ""
				+(parseFloat(panmovestart.viewbox[0])-dx)+" "+
				+(parseFloat(panmovestart.viewbox[1])-dy)+" "+
				+(parseFloat(panmovestart.viewbox[2]))+" "+
				+(parseFloat(panmovestart.viewbox[3])));
	}
}
// function catchmousedown(e){  
    
	// if (e.which == 2){
		// rulerpos = e
	// }
// }
// function catchmouseup(e){  
    
	// if (e.which == 2){
		// rulerpos = null;
	// }
// }