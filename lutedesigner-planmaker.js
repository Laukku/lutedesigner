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
// Plan maker component to lutedesigner, only intended for personal use


// Make option for forms available if this file is included
features_init.push(function(){
	var dp = getelid("drawingpurpose");
	var fo = creel("option","","",["value","technicalformplanmaker"]);
	fo.innerHTML = "Form drawing Full Plan";
	addel(dp, fo);
	// var co = creel("option","","",["value","technicalcarvedformplanmaker"]);
	// co.innerHTML = "Carved form drawing Full Plan";
	// addel(dp, co);
	// TODO: Maybe just always run this file if it is included except for "concept for customer" OR just add a checkbox and value in editorstate?
	
	// Add page title box for easier tab bar navigation in browser
	var bvb = getelid("instrumentpreset").parentNode;
	var label = creel("label");
	var fo = creel("input","pagetitle","",["type","text","onchange","settingchange(this)"]);
	label.innerHTML = "Project Title: ";
	addelafter(bvb, label);
	addel(label, fo);
	
	// Add button for viewing the form in 3d
	// TODO: This does not work yet
	// var bvb = getelid("bodyviewerbutton").parentNode;
	// var label = creel("label");
	// var fo = creel("button","formviewerbutton","",["onclick","start_bodyviewer(this)"]);
	// fo.innerHTML = "View form in 3D";
	// addelafter(bvb, label);
	// addel(label, fo);
});

features.push(function planmaker(){
	if (editorstate.drawingpurpose == "technicalformplanmaker"){
	var frontview = getelid("frontview");
	var sideview = getelid("sideview");
	
	// Load drawing hints from file with helper function insert_drawing()
	// insert_drawing(fromsvg, id, togroup, topoint, rotate, rotpoint)
	// Draw soundboard bar hints
	// Prepare to draw bars on sideview and extra graphics on frontview
	
	var bardistances = [];
	var bl = [];
	for (var i=0; i<barlist.length; i++){ // 9th one is bass bar
		if (i !=9) {
			bardistances.push(-barlist[i].pos);
			bl.push(barlist[i]);
		}
		
	}
	
	// Soundboard thickness graduations. Scale to width and height of soundboard side
	if (editorstate.numbernuts>1 || editorstate.fingerboardcourses > 9){
		// Baroque lute or theorbo soundboard graduations
		var btm = insert_drawing("", "thicknesses-baroque", frontview, FRONTVIEWORIGIN);
		var wscale = (2*cps.width) / 340;
		var hscale = (cps.height-40) / 500;
		// console.log(wscale, hscale);
		btm.setAttribute("transform",btm.getAttribute("transform")+" scale("+wscale+" "+hscale+")"); 
		// Place thickness textballs in code since the text doesn't transfer from the svg
		var points = [	[20, 50, "2.0"], // x,y,val
						[-20, 300, "1.4"],
						[-120,70,"1.8"],
						[-100,200,"1.7"],
						[-70,435,"1.8"],
						[-15,460,"2.0"]];
		
	} else {
		var btm = insert_drawing("", "thicknesses-renaissance", frontview, FRONTVIEWORIGIN.move(0,-10));
		var wscale = (2*cps.width) / 310;
		var hscale = (cps.height-40) / 450;
		console.log(wscale, hscale);
		btm.setAttribute("transform",btm.getAttribute("transform")+" scale("+wscale+" "+hscale+")"); 
		var points = [	[20, 50, "1.9"], // x,y,val
						[-20, 270, "1.3"],
						[-120,100,"1.7"],
						[-70,200,"1.6"],
						[-70,380,"1.7"],
						[-15,430,"1.9"]];
	}
	points.forEach(function(item, index, array){
		var group = makegroup(frontview,"thicknessball_"+index);
		var p = FRONTVIEWORIGIN.move(item[0]*wscale,-item[1]*hscale);
		drawellipse(group, p,10,7,COVERSTYLE);
		drawtext(group, p.move(-6.5,3.5), item[2]);
	});
	// Draw thickness balls around the soundboard
	
	// inner endclasp thingy - use inner body shape and then something
	// inside_side
	// var line = [FRONTVIEWORIGIN.move(-10000, -barlist[9].pos), FRONTVIEWORIGIN.move(10000, -barlist[9].pos)];
	// drawline(frontview, line);
	// var intr = pathline_intersect (inside_side,line);
	// TODO: intersect inside_side every mm in y until y==barlist[9].pos to obtain points for shape of inside liner piece
	var ys = [0,-0.1,-0.2,-0.3,-0.4,-0.5,-0.8];
	var y = 1;
	while (y < barlist[9].pos){
		ys.push(-y);
		y++;
	}
	var inttr = getpoints(inside_side, ys,false)
	var iX = inttr.X;
	var iY = inttr.Y;
	var shape = [];
	var shape2 = [];
	var rshape = [];
	var rshape2 = [];
	for (var i=0; i< iY.length; i++){
		shape.push(FRONTVIEWORIGIN.move(iX[i], -2.5+iY[i]));
		shape2.push(FRONTVIEWORIGIN.move(iX[i]-2.3, -8+iY[i]));
		rshape.push(FRONTVIEWORIGIN.move(-iX[i], -2.5+iY[i]));
		rshape2.push(FRONTVIEWORIGIN.move(-iX[i]+2.3, -8+iY[i]));
	}
	shape2.reverse();
	rshape2.reverse();
	var shape3 = [];
	var rshape3 = [];
	for (var i=0; i< shape2.length; i++){
		if (rshape2[i].y > FRONTVIEWORIGIN.y-barlist[9].pos){
			shape3.push(shape2[i]);
			rshape3.push(rshape2[i]);
		}
	}
	shape.push(getlast(shape).move(2));
	rshape.push(getlast(rshape).move(-2));
	// shape.push(FRONTVIEWORIGIN.move(0, -7.5));
	shape = shape.concat(shape3);
	rshape = rshape.concat(rshape3);

	rshape.reverse();
	shape = shape.concat(rshape);
	drawshape(frontview, shape, BEHINDSTYLE, "inside-liner", true);
	// var i=0;
	// var ps = inside_side.pathSegList;
	// console.log(ps);
	// while(){}
	// console.log(intr);

	// Accurate view of pegbox from the back
	
	// Pegbox accessories like upper pegbox or treble rider etc
	
	
	
	// neck cross section
	
	
	
	
	// Rosette extra small bars
	var w = cps.rosettewidth/2;
	var rp = cps.rosettepos;
	var minibars = [];
	if (editorstate.rosettelist == "triple"){
		minibars = [new Point(w+5,	0.3*w),
					new Point(w+10,0.15*w),
					new Point(w+10,-0.15*w),
					new Point(w+5,	-0.3*w),
					new Point(w/2,	-0.55*w),
					new Point(w/2+2,	-0.7*w),
					new Point(w/2,	-w)
					];
		for (var i=0; i<minibars.length; i++){
			drawline(frontview, [rp.move(-minibars[i].x, minibars[i].y), rp.move(minibars[i].x, minibars[i].y)], THINSTYLE, "rosettebar-"+(i+1));
			
			bl.push({type:"rosette-tiny",pos:barlist[4].pos-minibars[i].y,thickness:2,height:2});
			bardistances.push(-(barlist[4].pos-minibars[i].y));
		}
		
	} else {
		minibars = [new Point(w,w*0.8),
					new Point(w+10,w*0.3),
					new Point(w+10,-w*0.3),
					new Point(w,-w*0.8),
					];
		for (var i=0; i<minibars.length; i++){
			drawline(frontview, [rp.move(-minibars[i].x, minibars[i].y), rp.move(minibars[i].x, minibars[i].y)], THINSTYLE, "rosettebar-"+(i+1));
			
			bl.push({type:"rosette-tiny",pos:barlist[4].pos-minibars[i].y,thickness:2,height:2});
			bardistances.push(-(barlist[4].pos-minibars[i].y));
		}
	}
	
	// Soundboard bar front view explanation
	insert_drawing("", "bar-side", frontview, FRONTVIEWORIGIN.move(cps.width-2.5, -barlist[2].pos));
	insert_drawing("", "bar-small", frontview, FRONTVIEWORIGIN.move(cps.width));
	insert_drawing("", "bar-basbar", frontview, FRONTVIEWORIGIN.move(10,-barlist[9].pos));
	
	// Draw bars on side view
	var inttr = getpoints(getelid("soundboard-side"), bardistances,false)
	var iX = inttr.X;
	var iY = inttr.Y;
	// console.log(intersections);
	var sidebars = makegroup(sideview, "sidebars");
	for (var i=0; i<iX.length; i++){
		var p = SIDEVIEWORIGIN.move(iX[i], iY[i]);
		// drawcircle(sideview, p, 2);
		if (bl[i].thickness && bl[i].height){
			var shape =[p.move(0, bl[i].thickness/2), 
						p.move(-bl[i].height+2.5, bl[i].thickness/2),
						
						p.move(-bl[i].height, 1),
						p.move(-bl[i].height, -1),
						
						p.move(-bl[i].height+2.5, -bl[i].thickness/2),
						p.move(0, -bl[i].thickness/2)];
			drawshape(sidebars, shape, BEHINDSTYLE, "side-bar-"+i, false);
		}
	}
	
	
	// Screws, strap buttons
	if (editorstate.pegboxstyle == "theorbo"){
		insert_drawing("", "endpin-theorbo", frontview, FRONTVIEWORIGIN);
		insert_drawing("", "endpin-theorbo-side", getelid("sideview"), SIDEVIEWORIGIN.move(-22));
		// TODO: intersect sideview path with vertical line to find correct y-position for endpin, maybe even angle with a perpendicular of the segment
		insert_drawing("", "endpin-theorbo", getelid("sideview"), cps.neckstrap, cps.neckstrapangle);
		insert_drawing("", "endpin-theorbo-top", getelid("crosslayer"), CROSSVIEWORIGIN);
		// Screw in extension/neck
		insert_drawing("", "extension-screw", sideview, new Point(SIDEVIEWORIGIN.x, cps.nutmid.y).move(-8,-3));
		
	} else {
		insert_drawing("", "endpin", frontview, FRONTVIEWORIGIN);
		insert_drawing("", "endpin", getelid("sideview"), SIDEVIEWORIGIN.move(-22,1.5));
		insert_drawing("", "endpin-top", getelid("crosslayer"), CROSSVIEWORIGIN);
		// Screw in pegbox/neck
		insert_drawing("", "pegbox-screw", sideview, new Point(SIDEVIEWORIGIN.x, cps.nutmid.y).move(-14,8));
	}
	insert_drawing("", "neckblock-screws", sideview, SIDEVIEWORIGIN.move(-2.5,-cps.neckblocky));
	
	// Patterns, nut spacings, bridge with spacings, peg&strap pin plans - a sheet
	// var origin
	var sheet = new Point(-400,0);
	var sheetgroup = makegroup(getelid("drawinglayer"), "sheetgroup");
	// var tr = sheet.move();
	
	function addtosheet (item, posel, move, rotate) {
		// Helper function for placing existing elements from generated drawing to the sheet
		// item must be visible
		var orpos = getelid(posel).getBBox();
		var el = getelid(item).cloneNode(true);
		el.id = el.id + "-copy";
		if (move) {
			var neg = "translate("+(-orpos.x)+" "+(-orpos.y)+") ";
			var tra = " translate("+(sheet.x+move.x)+" "+(sheet.y+move.y)+")";
			var rot = "";
			if (rotate) rot = " rotate("+(rotate/radtodeg)+" "+(orpos.x)+" "+(orpos.y)+")"; 
			
			el.setAttribute("transform", neg+rot+tra);
		}
		
		
		// Change ids of childnodes so they can be accessed with getElementById later
		for (var i=0;i<el.childNodes.length; i++){
			if (el.childNodes[i].id) el.childNodes[i].id = el.childNodes[i].id+"-copy";
		}
		addel(sheetgroup, el);
		return el;
	}
	
	// Copy bridge to sheet
	addtosheet("bridge-group", "bridgetop", new Point(30,30));
	var br = getelid("bridge-front-group")
	br.style = "";
	addtosheet("bridge-front-group", "bridgebody", new Point(30,10));
	delel(br);
	var br = insert_drawing("", "bridge-crosssection", sheetgroup, new Point(0,0));
	addtosheet("bridge-crosssection", "bridge-cross-outline", new Point(10,60));
	getelid("bridge_size_legend-copy").style = "";
	// nut
	var nut = addtosheet("nutgroup", "nut_outline", new Point(10,80), cps.nutangle+0.5*Math.PI);
	// console.log(nut);
	
	// Pegs 
	if (editorstate.fingerboardcourses == 6){
		insert_drawing("", "pegs-renaissance", sheetgroup, sheet.move(0,100));
		insert_drawing("", "pegs-heart", sheetgroup, sheet.move(0,100));
	} else if (editorstate.numbernuts > 1 || editorstate.fingerboardcourses >= 9){
		insert_drawing("", "pegs-baroque", sheetgroup, sheet.move(0,100));
	} else {
		insert_drawing("", "pegs-renaissance", sheetgroup, sheet.move(0,100));
	}
	
	// Endpin
	
	// Riders, extension styles
	if (editorstate.pegboxstyle == "theorbo"){
		// theorbo-head-plan
		insert_drawing("", "theorbo-head-plan", sheetgroup, sheet.move(0,200));

	}
	
	
	
	// Explanation texts spaced accurately or in a place that allows them to be moved easily

	
	} // endif
});

// 