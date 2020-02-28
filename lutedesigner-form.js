// Lutedesigner form calculations

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

// Make option for forms available if this file is included
features_init.push(function(){
	var dp = getelid("drawingpurpose");
	var fo = creel("option","","",["value","technicalform"]);
	fo.innerHTML = "Form drawing";
	addel(dp, fo);
	var co = creel("option","","",["value","technicaltemplates"]);
	co.innerHTML = "Technical with templates";
	addel(dp, co);
});
var inside_side, inside_middle;

features.push(function drawform(){
	
	if (editorstate.drawingpurpose.startsWith("technical") 
		&& editorstate.drawingpurpose != "technical") draw_rib_templates();
	
	//////////////////////////////////////////////////////////////
	//// Draw form stuff
	if (editorstate.drawingpurpose.startsWith("technicalform")){
		// Create foamcore mold
		// accuracy = 3;
		// Draw inside shapes for the form
		inside_side = pathoffset(currentbody.side,RIBTHICKNESS);
		
		inside_middle = pathoffset(currentbody.middle,RIBTHICKNESS);
		
		// Get points along paths for side and middle
		// console.log("inside_side",inside_side);
		var insidepoints = getpoints(inside_side,null, false);
		
		// console.log("insidepoints",insidepoints); // this is empty TODO:
		var inmidpoints = getpoints(inside_middle,insidepoints.Y);
		var inYpoints = flipsign(insidepoints.Y);
		
		insidepoints = flipsign(insidepoints.X);
		inmidpoints = flipsign(inmidpoints.X);
		
		// console.log(insidepoints,inmidpoints,inYpoints);
		// Find 3D points for ribs (only one half of the form though)
		var inwidest_i = findmax(insidepoints);
		// console.log(inwidest_i);
		var inwidest = circumference(inYpoints,insidepoints,inmidpoints, inwidest_i, 0.1);
		
		// var inribs = getribangles(inwidest);
		var t0 = performance.now();
		var inribpaths = calculateribjoints_plane(inYpoints,insidepoints,inmidpoints, lute3d.ribs, inwidest_i);
		var t1 = performance.now();
		console.log("It took " + (t1 - t0).toFixed(0) + " ms to calculate ribjoints for the inside shape.")
		// Find neck joint shape and evenly space ribs on it
		// var t0 = performance.now();	
		// var neckj = neckjoint(inside_side,inside_middle,ribs); 
		// var neckj = neckjoint(currentbody.side,currentbody.middle,ribs); 
		neckjoint_3D(inribpaths.threedee,lute3d.ribs); 
		// var t1 = performance.now();
		// console.log("It took " + (t1 - t0).toFixed(0) + " ms to calculate neck joint.")
		// Hide these here because otherwise can't get BBox before this
		// inside_side.style= "display:none;";
		// inside_middle.style= "display:none;";
		// Move inside offset paths to debuglayer
		var debuglayer = getelid("debuglayer");
		addel(debuglayer,inside_side);
		addel(debuglayer,inside_middle);
		lute3d.inribpaths = inribpaths;
		// Decide what kind of form to draw
		// if (editorstate.drawingpurpose.startsWith("technicalfoamform")) {
			drawfoamcore();
		// } else if (editorstate.drawingpurpose.startsWith("technicalcarvedform")) {
			drawcarvedform();
		// }
		
		
		
	}
	
	
});

function drawcarvedform() {
	// Draws carved or whalebone mould plans
	var materialth = 12; // Material thickness in mm, for bottom and cross supports
	var supportw = 30; // 
	var f = getelid("formlayer");
	var wanted_interval = 70; // Max distance between cross supports
	// form length is from butt to neckblock
	// Move neckjoint surface of the mold by RIBTHICKNESS because its position is defined by outside ribpaths but the mold is created from insideribpaths
	var formlength = cps.neckblocky-RIBTHICKNESS;
	
	var shape = lute3d.inribpaths.threedee;
	var offsets = lute3d.inribpaths.offsets; // Needed since the ribs begin at different y coordinates
	// console.log(offsets);
	
	
	
	// Draw bottom shape
	var bottomg = makegroup(f, "carved-form-bottom-group");
	var borigin = new Point(DRAWINGWIDTH+100,-100);
	var lpoints = [borigin];
	var rpoints = [];
	
	last_yi = 0;
	var s_edge = lute3d.inribpaths.soundboard_edge;
	while(s_edge[last_yi].y < formlength){
		
		lpoints.push(borigin.move(-s_edge[last_yi].x, -s_edge[last_yi].y));
		rpoints.push(borigin.move(s_edge[last_yi].x, -s_edge[last_yi].y));
		
		last_yi +=1;		
				
	}
	
	// intersect to get last point in the actual Y position wanted
	var p1 = new Point(s_edge[last_yi-1].x, s_edge[last_yi-1].y);
	var p2 = new Point(s_edge[last_yi].x, s_edge[last_yi].y);
	var yval = formlength;
	var x = p1.x -(Math.abs(p1.y-yval)*Math.abs(p2.x-p1.x))/Math.abs(p2.y-p1.y)
	var ip = new Point(x,yval);
	lpoints.push(borigin.move(-ip.x,-ip.y));
	rpoints.push(borigin.move(ip.x,-ip.y));
	rpoints.reverse();
	lpoints = lpoints.concat(rpoints);
	drawshape(bottomg, lpoints, NOFILLTHIN,"carved-form-bottom", true);
	
	
	// Top shape of bottom plate, somewhere in the middle of the last rib
	var lpoints2 = []; 
	var rpoints2 = [];
	var prevx = -1;
	var yi = 0;
	var lrib = shape.length-1;
	while(shape[lrib][yi+offsets[lrib]].y <= formlength){
		yi +=1;	
		var ypos = shape[lrib][yi+offsets[lrib]].y;
		// console.log(shape[lrib][yi+offsets[lrib]]);
		p1 = new Point(	shape[lrib][yi+offsets[lrib]].x, 
						shape[lrib][yi+offsets[lrib]].z);
		p2 = new Point(	shape[lrib-1][yi+offsets[lrib-1]].x, 
						shape[lrib-1][yi+offsets[lrib-1]].z);
		var ix;
		if (p2.y >= materialth){
			ix = p2.x+((p2.y-materialth)*(p1.x-p2.x))/(p2.y-p1.y);
			// console.log((p2.y-materialth),(p1.x-p2.x),(p2.y-p1.y));
		}
		if (ix && ix != prevx ) {
			lpoints2.push(borigin.move(-ix,-ypos));
			rpoints2.push(borigin.move(ix,-ypos));
			prevx = ix;
		}
		// console.log(ix, ypos);
			
				
	}
	drawshape(bottomg, lpoints2, NOFILLTHIN,"carved-form-bottom-ltop", false);
	drawshape(bottomg, rpoints2, NOFILLTHIN,"carved-form-bottom-rtop", false);
	
	
	
	// Draw middle support
	// Follow first rib joint
	var midg = makegroup(f, "carved-form-middle-group");
	var morigin = new Point(DRAWINGWIDTH-300,-100);
	var points = [];
	last_yi = 0;
	while (shape[0][last_yi].z < materialth){
		// Find first value over material thickness
		last_yi +=1;
	}
	var mid_start_y = shape[0][last_yi].y
	points.push(morigin.move(materialth,-mid_start_y));
	last_yi +=1;
	while(shape[0][last_yi].y < formlength){
		points.push(morigin.move(shape[0][last_yi].z,
							-shape[0][last_yi].y));
		last_yi +=1;					
		
	}
	var p1 = new Point(shape[0][last_yi-1].z,
						shape[0][last_yi-1].y);
	var p2 = new Point(shape[0][last_yi].z,
						shape[0][last_yi].y);
	var yval = formlength;
	var x = p1.x -(Math.abs(p1.y-yval)*Math.abs(p2.x-p1.x))/Math.abs(p2.y-p1.y)
	points.push(morigin.move(x,-yval));
	points.push(morigin.move(materialth,-yval));
	// points.push(morigin.move(p2.x,-p2.y));
	drawshape(midg, points, NOFILLTHIN,"carved-form-middle", true);
	// Draw position on bottom shape
	var shoop = [borigin.move(-0.5*materialth, -mid_start_y),
				borigin.move(0.5*materialth, -mid_start_y),
				borigin.move(0.5*materialth, -formlength),
				borigin.move(-0.5*materialth, -formlength)];
	drawshape(bottomg, shoop, NOFILLTHIN,"middle-position", true);
	
	// Draw cross supports
	
	var last_yi = 0; // The last y position visited
	var origin = new Point(DRAWINGWIDTH+100,20);
	
	function makecross (ypos,yi, name, number, ori, inside){
		var rz,rx; // Where to put the number; Return values
		var points = []; // The cross support shape
		var points2 = [ori]; // crosse section of the rest of the mold
		// make a group so the number moves with it
		var g = makegroup(f, name+number);
		if (!inside) { // Full plate, draw center point
			points.push(ori.move(materialth/2.0, -materialth));
		} 
		// Middle of body at the same height as first rib joint
		if (ypos){
			var p = planey3dline(	shape[0][yi+offsets[0]],
									shape[0][yi+offsets[0]-1], ypos)
			points.push(new Point(	ori.x+(materialth/2.0), 
									ori.y-p.z));	
			points2.push(new Point(	ori.x, ori.y-p.z));	
			points2.push(new Point(	ori.x+(materialth/2.0), 
									ori.y-p.z));	
			
		} else {
			points.push(new Point(	ori.x+(materialth/2.0), 
									ori.y-shape[0][yi+offsets[0]].z));	
			points2.push(new Point(	ori.x, ori.y-shape[0][yi+offsets[0]].z));	
			points2.push(new Point(	ori.x+(materialth/2.0), 
									ori.y-shape[0][yi+offsets[0]].z));							
		}
		points2.push(ori.move(materialth/2.0, -materialth));
		
		rz = points[points.length-1];
		// calculate plane and 3d line intersection between points in list
		for (var i =0; shape[i][yi+offsets[i]].z > materialth
						&& i<shape.length-1; i++){
			if (ypos){
				var p = planey3dline(	shape[i][yi+offsets[i]-1],
										shape[i][yi+offsets[i]], ypos)
				p = new Point(ori.x+p.x, ori.y-p.z);
			} else {
				p = new Point(	ori.x+shape[i][yi+offsets[i]].x, 
								ori.y-shape[i][yi+offsets[i]].z);
			}
			
			points.push(p);

			// Draw short lines showing corners, maybe angle from the two points that are used in getting the shape
			// var angle = Math.atan2(Math.abs(shape[i][yi+offsets[i]].z-shape[i][yi+offsets[i]-1].z), Math.abs(shape[i][yi+offsets[i]].x-shape[i][yi+offsets[i]-1].x))-0.5*Math.PI;
			// if (shape[i][yi+offsets[i]].z<shape[i][yi+offsets[i]-1].z) angle = angle - Math.PI;
			var angle = getangle(p, ori);
			drawline(g,[p, p.movedist(1.5,angle)]);
			
		}
		// planey3dline(p1,p2,yval)
		// Intersect last segment with bottom material
		if (ypos){
			var p = planey3dline(	shape[i][yi+offsets[i]-1],
									shape[i][yi+offsets[i]], ypos)
			var p2 = new Point(ori.x+p.x, ori.y-p.z);
		} else {
			var p2 = new Point(ori.x+shape[i][yi+offsets[i]].x, ori.y-shape[i][yi+offsets[i]].z);
		}
		
		
		
		var p1 = points[points.length-1];
		
		var yval = ori.y-materialth;
		var rx = p1.x +(Math.abs(p1.y-yval)*Math.abs(p2.x-p1.x))/Math.abs(p2.y-p1.y)
		var inter = new Point(rx,yval);
		points.push(inter);
		points2.push(inter);
		points2.push(p2);
		if (i < shape.length-1){
			// If the last rib joint wasn't reached, also draw it in cross2
			var last = shape.length-1;
			if (ypos){
				var p = planey3dline(	shape[last][yi+offsets[last]-1],
										shape[last][yi+offsets[last]], ypos)
				p = new Point(ori.x+p.x, ori.y-p.z);
			} else {
				p = new Point(	ori.x+shape[last][yi+offsets[last]].x, 
								ori.y-shape[last][yi+offsets[last]].z);
			}
			points2.push(p);
		}
		// Curved inside 
		if (inside) { 
			var lip = points[points.length-1].move(-supportw) // lower inside point
			points.push(lip);
			var curve = points[0].move(0,supportw) // End of curve
			var h = 0.5*Math.abs(lip.y-curve.y)*(editorstate.bulge-1);
			var w = 0.6*Math.abs(lip.x-curve.x);
			
			var cp1 = lip.move(0,-h);
			var cp2 = curve.move(w);
			curve.bezier(cp1,cp2);
			points.push(curve);
		} 
		// Draw it
		// make a group so the number moves with it
		var g = makegroup(f, name+number);
		var cross = drawshape(g, points, NOFILLTHIN,"", true);
		var cross2 = drawshape(g, points2, NOFILLTHIN,"", true);
		// Create a number text box
		drawtext(g, rz.move(2,10), ""+number)
		// Return actual x,z coordinates for where support touches bottom shape
		return (new Point(rx-ori.x,yval,rz.y-ori.y));
	}
	function markpos(fp, place,number,inside){
		var rfootreach = materialth*0.5;
		var lfootreach = -materialth*0.5;
		var shoulderreach = materialth;
		if (inside) {
			rfootreach = fp.x-supportw;
			lfootreach = -fp.x+supportw;
			shoulderreach = -fp.z-supportw;
		}
		var foot = [borigin.move(fp.x,place),
					borigin.move(fp.x,place-materialth),
					borigin.move(rfootreach,place-materialth),
					borigin.move(rfootreach,place)];
		drawshape(bottomg, foot, NOFILLTHIN,"cross-support-foot-r-"+number, true);
		
		var foot = [borigin.move(-fp.x,place),
					borigin.move(-fp.x,place-materialth),
					borigin.move(lfootreach,place-materialth),
					borigin.move(lfootreach,place)];
		drawshape(bottomg, foot, NOFILLTHIN,"cross-support-foot-l-"+number, true);
		
		var shoulder = [morigin.move(-fp.z,place),
					morigin.move(-fp.z,place-materialth),
					morigin.move(shoulderreach,place-materialth),
					morigin.move(shoulderreach,place)];
		drawshape(midg, shoulder, NOFILLTHIN,"cross-support-shoulder-"+number, true);
		
		drawtext(bottomg, borigin.move(fp.x-10,place-3), ""+number)
		drawtext(midg, morigin.move(-fp.z-10,place-3), ""+number)
	}
	
	///////////////////////////////////////////////////////////////////////
	// First split body at the butt end at three points
	for (var i=1; i<=3; i++){
		// Find correct position in y
		while(shape[0][last_yi+offsets[0]].y < materialth*i){

			last_yi +=1;
		}
		// Make a cross support here
		var fp = makecross(materialth*i, last_yi, "cross-support-butt-",i, origin, false);
		markpos(fp, -materialth*(i-1),i,false);
	}
	var third_yi = last_yi;
	// Split body at regular intervals 
	// Make support at widest_i, and one before that, and one after that at every interval
	// Find (first) widest point (where next x value would be smaller), it might not actually be at widest_i since that refers to outside shape, not mould shape
	var lw = 0;
	while (shape[shape.length-1][last_yi].x > lw){
		lw = shape[shape.length-1][last_yi].x;
		last_yi +=1;
	}
	var widest_yi = last_yi;
	var widest_y = shape[shape.length-1][last_yi].y;
	var fp = makecross(widest_y, widest_yi, "cross-support-widest-",5, origin, true); 
	markpos(fp, -widest_y+materialth,5,true);
	
	// Do one between widest and last of the butts
	var fourth_yi = parseInt(widest_yi-(widest_yi-third_yi)*0.6);
	var fourth_y = shape[shape.length-1][fourth_yi].y;
	// console.log("fourth_yi",fourth_yi)
	var fp = makecross(fourth_y, fourth_yi, "cross-support-",4, origin, true); 
	
	markpos(fp, -fourth_y,4,true);
	// Draw the rest of the cross supports
	var intervals = Math.abs((formlength-widest_y)/wanted_interval);
	var interval = Math.abs((formlength-widest_y)/intervals); // even mm's
	for (var i=1; i<intervals; i++){
		while(shape[0][last_yi+offsets[0]].y < widest_y+interval*i){
			last_yi +=1;
		}
		// Make a cross support here
		var fp = makecross(widest_y+interval*i, last_yi, "cross-support-main-",i+5, origin, true); // .move(i*50.0, -supportw*i-20)
		// Mark its position on bottom and middle
		markpos(fp,-widest_y-interval*i+materialth,i+5,true);
		
		
	}
	
	// Last cross section is the neckblock face, before that is -materialth
	while(shape[0][last_yi+offsets[0]].y < formlength-materialth){
		last_yi +=1;
	}
	var fp = makecross(formlength-materialth, last_yi, "last-support-",i+5, origin.move(0,100), false);
	markpos(fp, -formlength+materialth, i+5,false);
	
	
	while(shape[0][last_yi+offsets[0]].y < formlength){
		last_yi +=1;
	}
	var fp = makecross(formlength, last_yi, "necblock-face-",i+6, origin.move(0,100), false);
	
	// Adaptor piece between form and neckblock for using a 10c form to make a 7c or 6c lute
	if (cps.neckwidth >= 90){
		var fp = makecross(formlength, last_yi, "adaptor-face-",i+6, origin.move(0,200), false);
		while(shape[0][last_yi+offsets[0]].y < formlength+20){
			last_yi +=1;
		}
		var fp = makecross(formlength+20, last_yi, "adaptor-face-",i+7, origin.move(0,200), false);
		// Make a helper for the 6c neckblock
		while(shape[0][last_yi+offsets[0]].z > 27){
			last_yi +=1;
		}
		var fp = makecross(shape[0][last_yi+offsets[0]].y, last_yi, "helper-face-",i+8, origin.move(0,250), false);
		
	}
	
}

function drawfoamcore() {
	// Draws foamcore mould plans
	
	var startheight = 50; // space for end block
	var endheight = 50 ; // space for neckblock
	var blockwidth = 24;
	var plywood = 3.8;
	var jointdepth = 4.0;
	var supports = 2;
	var ribheight = 15.0;
	var formlayer = getelid("formlayer");
	var r = lute3d.inribpaths.form_supports;
	var form3d = {};
	// console.log(r);
	// r = r.concat([lute3d.ribpaths.soundboard_edge]);
	// console.log(r);
	var startheights = []; // Actually list of points
	var endheights = []; // Just heights
	var buttblockshape = []; // Thick end blocks are drawn based on these
	var neckblockshape = [];
	// Quickhand functions
	function makejoint(){
		
		s.push(s[s.length-1].move(0,jointdepth));
		var jp = new Point(s[s.length-1].x, s[s.length-1].y);
		s.push(s[s.length-1].move(-plywood,0));
		s.push(s[s.length-1].move(0,-jointdepth));
		// Return distance from soundboard to joint
		return jp;
	}
	function followrib(endp,distance){
		// Follow rib joint on the inside of the mold
		// Go to endp, then convert line to arc that attempts to follow the rib surface above it.
		// TODO: Find distance from ribjoint surface at this x coordinate
		// s.push(endp);
		var p1 = s[s.length-1];
		// var ny = findy(s[s.length-1].x -dist).move(0,-20);
		s.push(endp);
		var p2 = s[s.length-1];
		// Arc segment method - convert the line that was just made into an arc
		// Find line perpendicular to previous line and crossing it in the middle
		var angle = Math.atan2((p2.x-p1.x),(p2.y-p1.y));
		var midp = p1.movedist(linelength(p1,p2)/2, angle);
		// drawcircle(ribg, midp, 3, HANDLESEGPOINTSTYLE);
		var midp2 = midp.movedist(1000,angle+Math.PI/2);
		// drawcircle(ribg, midp2, 3, HANDLESEGPOINTSTYLE);
		// intersect the ribjoint with line midp,midp2
		var inter=null;
		var k = 1;
		// drawline(ribg,[midp, midp2]);
		while (!inter && k<r[i].length){
			inter = intersectline(r[i][k-1],r[i][k], midp,midp2);
			k++;
		}
		// console.log(i,k,inter);
		
		var targetp;
		if (inter){
			targetp=inter.movedist(-distance,angle+Math.PI/2);
		} else {
			console.log("using midp as targetp", midp);
			targetp=midp;
		}
		// drawcircle(ribg, targetp, 3, HANDLESEGPOINTSTYLE);
		// console.log(p1,targetp,p2);
		s[s.length-1].arcthru(p1,targetp,p2, ribg);
		// return yi, index in Ypoints
		// console.log()
		// return 
	}
	function followrib_loop(endp, repeats){
		// TODO:
		var incr = linelength(endp, s[s.length-1]) / repeats;
		for (var i=0; i<repeats; i++){
			followrib(endp);
		}
	}
	function findy(fx){
		// Find point in s given x coordinate; Might this fail after some points have been appended to s?
		var i=0;
		while (s[i].x < fx && i < s.length){
			i++;
		}
		return s[i];
	}
	// Decide where underside supports are and how many there are
	// var formlength = r[0][r[0].length-1].x;
	var formlength = cps.neckblocky-RIBTHICKNESS;
	var lastsupport = formlength*0.7; // Support near butt end
	var supports = Math.floor(lastsupport / 110);
	// console.log("supports",supports);
	var supportdist = lastsupport/supports;
	var supportlist = []; // Stores support joint locations
	// var buttblock = [];
	// var neckblock = [];
	
	for (var i=0; i < supports+2; i++){ // Prepopulate supportlist
		supportlist.push({yi:0, posns:[], coords:[]});
	}
	var startl = [new Point(-1000,startheight),new Point(1000, startheight)];
	// for each rib, get rib joint support shape
	for (var i=0; i<r.length; i++){
		
		// Determine start point
		var startj=0;
		var comp = 0;
		if (i < r.length-1){ // Except soundboard edge, which is a full shape
			// x: how far along the body, y: height of body at point
			while (r[i][startj].y - (lute3d.inribpaths.compensations[i][startj] || 0) < startheight
			/* && r[i][startj].x < blockwidth*0.3 */){
				// console.log(i, startj, r[i][startj].y, lute3d.inribpaths.compensations[i][startj]);
				startj++
			}
		}
		var ribg = makegroup(formlayer, "ribsupportg-"+i)
		var s = [];
		var j=startj;
		// TODO: Intersect start points for precision at butt block
		// console.log(r[i][j-1].y, r[i][j].y);
		// if (startj>0){
			// var inter = intersectline(startl[0],startl[1],   
				// r[i][j-1].move(0,-lute3d.inribpaths.compensations[i][j-1]), 
				// r[i][j].move(0,-lute3d.inribpaths.compensations[i][j]));
			// if (inter) {s.push(inter); console.log(i, inter);}
		// }
		
		
		// Follow rib support path from buttblock to neckblock
		
		// console.log("j",j, r);
		// Store point for numbering the rib supports later
		var tp,b=0,barli=[];
		while ((r[i][j].x <= formlength ) 
				&& (j < r[i].length) 
				/* && r[i][j].x > 40 */){
			// s.push(r[i][j].move(p1.x*Math.cos(planedata[a].angle)));
			
			// Add rib support top side shape to s[], but limit start height of each rib support to 40mm, except last rib support = soundboard edge should have the complete shape
			if (!(r[i][j].y < 40 && i < r.length-1)) s.push(r[i][j]);
			
			if (r[i][j].yi == lute3d.widest_i) tp = r[i][j].y;
			j++;
			// If edge support and matches soundboard bar location, draw a line
			if (i==r.length-1 && r[i][j].x > barlist[b].pos){ 
				barli.push([r[i][j],r[i][j].move(0,-20)]);
				b++;
			}
		}
		// if the last one fell short, intersect vertical line with ribjoint segment
		// TODO:
		var necki = intersectline(	new Point(cps.neckblocky-RIBTHICKNESS,0),
									new Point(cps.neckblocky-RIBTHICKNESS,100000),
									r[i][j-1],r[i][j]);
		if (necki) s.push(necki);
		startheights.push(s[0]);
		// Figure out endheight: Should be below each necki
		var endp = s[s.length-1].move(0,-3);
		s.push(endp)
		endheights.push(endp);
		// Do neckblock area
		if (i == r.length-1) {
			s.push(endp.move(0, -endp.y));
			s.push(endp.move(-blockwidth, -endp.y));
		}
		s.push(endp.move(-blockwidth,0)); // left by blockwidth
		var comp = 0;
		var yi = findy(s[s.length-1].x).yi;
		var njp = makejoint();
		if (lute3d.inribpaths.compensations[i]){
			// console.log(i, lute3d.inribpaths.compensations[i][yi]);
			comp = lute3d.inribpaths.compensations[i][yi] || 0;
		} else {
			comp = 0;
		}
		supportlist[0].posns[i] = njp.y - comp;
		supportlist[0].coords[i] = njp;
		supportlist[0].yi = yi;
		// startheights.push(new Point(0,njp.y - comp ));
		
		// console.log(r);
		// Make underside with joints
		for (var sup=1; sup<=supports; sup++){
			var ny = findy(s[s.length-1].x -supportdist);
			
			followrib(ny.move(0,-20),20);
			var jp = makejoint();
			// Store joint points in arrays for making cross supports later
			// Compensate y coordinate for rib support tilt
			if (lute3d.inribpaths.compensations[i]){
				// console.log(i, lute3d.inribpaths.compensations[i][ny.yi]);
				comp = lute3d.inribpaths.compensations[i][ny.yi] || 0;
			} else {
				comp =0;
			}
			
			supportlist[sup].posns[i] = jp.y - comp;
			supportlist[sup].coords[i] = jp;
			supportlist[sup].yi = ny.yi;
		}

		
		// Startblock area
		// For the last rib support (soundboard edge) find the point below the previous startpoint for a nicely shaped startblock.
		if (i == r.length-1) {
			// var yi = findy(s[s.length-1].x).yi;
			// var points = lute3d.plane(yi, i-1);
			// var adj = (startheights[i-1].y+jointdepth)*Math.cos(lute3d.planedata[i-1].angle);
			// console.log(points);
			// startheights[i] = new Point(0, points.p1.x + adj);
			startheights[i] = startheights[i-1];
		}
		var eh = startheights[i].y;
		// var eh = startheights[i].y > 40 ? startheights[i].y : 40; // Limit butt block shape
		var e = new Point(blockwidth+plywood+3, eh);
		followrib(e,21); 
		s.push(e.move(-3,0));
		var yi = findy(s[s.length-1].x).yi;
		var jp = makejoint();
		if (lute3d.inribpaths.compensations[i]){
			// console.log(i, lute3d.inribpaths.compensations[i][ny.yi]);
			comp = lute3d.inribpaths.compensations[i][yi] || 0;
		} else {
			comp =0;
		}
		supportlist[supportlist.length-1].posns[i] = jp.y - comp;
		supportlist[supportlist.length-1].coords[i] = jp;
		supportlist[supportlist.length-1].yi = yi;
		// endheights.push(jp.y - comp);
		if (i == r.length-1) {
			s.push(new Point(blockwidth,0));
			s.push(new Point(0,0));
		}
		
	
		// Draw the rib support
		var ribsup = drawshape(ribg, s, "", "ribsupport-"+i,true);
		// Color the rib support for debugging
		if (i>0 && i < r.length-1) {
			var gre = Math.round(255-(i/r.length)*255).toString(16);
			var blu = Math.round((i/r.length)*255).toString(16);
			// console.log(gre, blu);
			ribsup.setAttribute("style",  "stroke:#00"+gre+blu+";stroke-width:0.4; fill:none;");
		}
		
		// if debug and last ribsupport, also draw on the frontview
		if (i==r.length-1){
			// var ns = [];
			// for (var j=0;j<s.length ;j++){
				// ns.push(s[j].addpoint(FRONTVIEWORIGIN));
			// }
			var ribsup2 = drawshape(getelid("debuglayer"), s, REDSTYLE, "ribsupportdebug-"+i,true);
			var tr = "translate("+FRONTVIEWORIGIN.x+" "+(FRONTVIEWORIGIN.y-RIBTHICKNESS)+") rotate (-90) ";
			ribsup2.setAttribute("transform", tr);
		}
		tp = new Point(lute3d.inribpaths.Ypoints[lute3d.widest_i], tp-5);
		// console.log("textpos: ", lute3d.widest_i);
		var te="";
		if (i==0) te = " (center)";
		if (i==r.length-1) te = " (edge)";
		drawtext(ribg, tp, i+te);
		
		
		// Add soundboard bar positions to last rib support
		if(i==r.length-1){
			for (var b=0; b< barli.length-1; b++){
				drawline(ribg, barli[b]);
				if (barlist[b].type=="rosette") drawtext(ribg, barli[b][0].move(0,-8), "R");
			}
		}
		// Add joint numbering to every rib
		
		for (var a=0; a< supportlist.length; a++){
			drawtext(ribg, supportlist[a].coords[i].move(-4.5,9), a);
		}
		
		// var sca = " scale(1,-1)";
		var tra = " translate(10 "+ (10+i*90) +")";
		ribg.setAttribute("transform",tra);
		// console.log(ribsup);
		// Number rib supports
	}
	// Draw end and start cross supports
	// var startg = makegroup(formlayer, "butt-support");
	function jointhole(pos,angle,rev){
		// Make a joint shape at an angle
		var p2 = pos.movedist(plywood/2,angle-Math.PI/2);
		var p1 = p2.movedist(jointdepth,angle);
		var p3 = pos.movedist(plywood/2,angle+Math.PI/2);
		var p4 = p3.movedist(jointdepth,angle);
		if (!rev) return [p1,p2,p3,p4];
		return [p4,p3,p2,p1];
	}
	function support(yi,posns,iivari,follow, last){
		var lpoints = [];
		var rpoints = [];
		var posnsr = posns;
		var supg = makegroup(formlayer, "supportg-"+iivari);
		posnsr.reverse();
		var posns = posns;
		// console.log(posns);
		var midp,s;
		if (follow) s = Math.floor(posns.length/2); 
		// console.log("posns",posns);
		for (var i=0; i< posns.length-1; i++){
			// Calculate point on soundboard with lute3d.planedata[i] and startheights[i].x and lute3d.plane
			var points = lute3d.inribpaths.plane(lute3d.inribpaths.planedata,yi,i);
			// var points = lute3d.plane(yi,i);
			
			
			var angle = Math.abs(getangle(points.p1, points.p2) || 0.0);
			// console.log("angle",angle,"points",points.p1, points.p2);
			lpoints = lpoints.concat(jointhole(points.p1.scale(-1,1).movedist(posns[posns.length-1-i],-angle), -angle,true));
			rpoints = rpoints.concat(jointhole(points.p1.movedist(posns[posns.length-1-i],angle), angle));
			
			// Draw helper debuggery lines from soundboard to shell
			drawline(supg,[points.p1,points.p1.movedist(posns[posns.length-1-i],angle)],OCTSTYLE,"debglh-"+iivari+"-"+i);
			if (follow && i==s){ // Save point for drawing a nice underside later
				midp = points.p1.movedist(posns[posns.length-1-i]-24,angle);
			}
			// drawline(startg, [,]);
		}
		// Manually add soundboard edge joints
		if (last) {
			// buttblock
			// console.log("last");
			rpoints.push(new Point(rpoints[rpoints.length-1].x,plywood));
			lpoints.push(new Point(lpoints[lpoints.length-1].x,plywood));	
		} else {
			rpoints.push(new Point(posns[0]+jointdepth,plywood));
			lpoints.push(new Point(-posns[0]-jointdepth,plywood));
		}
		rpoints.push(new Point(posns[0],plywood));
		lpoints.push(new Point(-posns[0],plywood));
		rpoints.push(new Point(posns[0],0));
		lpoints.push(new Point(-posns[0],0));
		
		lpoints.reverse();
		rpoints = lpoints.concat(rpoints);
		// Do round underside
		if (follow) {
			// start and end point
			var p1 = new Point(posns[0]-24,0);
			var p5 = new Point(-posns[0]+24,0);
			// point in the middle
			var p3 = new Point(0, posns[posns.length-1]-24);
			// points at about 45deg
			
			var p2 = midp;
			var p4 = midp.scale(-1,1);
			p3.arcthru(p1,p2,p3);
			p5.arcthru(p3,p4,p5);
			rpoints.push(p1);
			rpoints.push(p3);
			rpoints.push(p5);
		}
		drawshape(supg, rpoints);
		drawtext(supg, new Point(-3,posns[posns.length-1]) ,iivari);
		return supg;
	}
	function block(posns,yi,nam){
		// end blocks of inch thick pine
		var lpoints = [];
		var rpoints = [];
		var riblines = [];
		var supg = makegroup(formlayer, "formblock-"+nam);
		var midp,s,p;
		
		for (var i=0; i< posns.length-1; i++){
			var points = lute3d.inribpaths.plane(lute3d.inribpaths.planedata,yi,i);
			// eangle, epoints: The very final rib points to hit
			var epoints = lute3d.inribpaths.plane(lute3d.inribpaths.planedata,0,i);
			var angle = Math.abs(getangle(points.p1, points.p2) || 0.0);
			var eangle = Math.abs(getangle(epoints.p1, epoints.p2) || 0.0);
			
			p = points.p1.scale(-1,1).movedist(posns[posns.length-1-i]-plywood ,-angle);
			

			if (nam=="butt") {riblines.push([epoints.p1.scale(-1,1),p]);}
			else {riblines.push([points.p1,p]);}
			// Riblines don't (and shouldn't) match debuglines drawn on last plywood cross support, since these ones go to the very end and the plywood is 24mm from the end.
			
			lpoints.push(p);
			// Flip for other side
			p = p.scale(-1,1);
			rpoints.push(p);
			
			if (nam=="butt") {riblines.push([epoints.p1,p]);}
			else {riblines.push([points.p1,p]);}

		}
		lpoints.push(new Point(-p.x, plywood)); // final points close to soundboard
		rpoints.push(new Point(p.x, plywood));
		lpoints.reverse();
		rpoints = lpoints.concat(rpoints);
		drawshape(supg, rpoints);
		// Draw rib lines
		if (nam=="butt"){
			for (var i=0; i< riblines.length; i++){
				drawline(supg,riblines[i]);
			}
		}
		
		return supg;
	}
	for (var i=0; i< supportlist.length; i++){
		// Draw cross supports to the right of the rib supports neatly spaced out
		// console.log("supportlist[i].yi", supportlist[i].yi);
		var follow = false, last = false;
		if (i != 0 && i != supportlist.length-1) follow = true;
		if (i == supportlist.length-1) last = true;
		var supg = support(supportlist[i].yi,supportlist[i].posns,i,follow,last);
		// var startsupport = drawshape(startg, ssshape);
		var sca = " scale(1,-1)";
		var tra = " translate("+(formlength+120)+" "+ (i*150) +")";
		supg.setAttribute("transform",tra);
	}
	
	i--;
	// console.log(startheights);
	var supg = block(supportlist[supportlist.length-1].posns,supportlist[supportlist.length-1].yi, "butt");
	var sca = " scale(1,-1)";
	var tra = " translate("+(formlength+120)+" "+ (i*150) +")";
	supg.setAttribute("transform",tra);
	i++;
	
	
	var supg = block(supportlist[0].posns,supportlist[0].yi, "neck");
	var sca = " scale(1,-1)";
	var tra = " translate("+(formlength+120)+" "+ (0*150) +")";
	supg.setAttribute("transform",tra);
	// console.log("supportlist",supportlist); 
	// supportlist: joint depth needs to be added to y values
	var layertr = " translate("+ DRAWINGWIDTH +")";
	formlayer.setAttribute("transform", layertr)
}

function draw_rib_templates (){
	// Flatten calculated ribs to templates
	// Add flipped copy of center rib as the first in r
	var center_left = [];
	for (var i=0; i<lute3d.ribpaths.threedee[0].length; i++){
		// center_left[i] = center_left[i].flipsign("x");
		center_left.push(new Point(-lute3d.ribpaths.threedee[0][i].x,
									lute3d.ribpaths.threedee[0][i].y,
									lute3d.ribpaths.threedee[0][i].z));
	}
	var r = [center_left].concat(lute3d.ribpaths.threedee);

	var offsets = lute3d.ribpaths.offsets;
	var flatribs = getelid("flatribs-layer");
	var widest_y = lute3d.ribpaths.Ypoints[lute3d.widest_i];
	// console.log("flattening ribs, r:", r);
	// TODO: Hooks at tips caused by missing y coordinates / points, but also some other reasons
	var debugthis=false;
	var i=0;
	var j = 0;
	function de(thing){ // debuggery function
		if (debugthis && j<10){ // || j > r.length-10
			console.log(thing);
		}
	}

	for (i=1; i<r.length; i++){
		var left = r[i-1];
		var right = r[i]
		var wl1, wl2; // Mark widest_i with a line on the flattened rib
		// var smallestx=10000; // For finding width of a flattened rib for neat display
		// var biggestx=0;
		
		// var ribg = makegroup(flatribs, "flatribg-"+i);
		
		// Draw first two points of each rib as seen from behind using x & z coordinates. This might introduce a tiny error, but could be countered by running the 3D calculation and adjusting the second point.
		// TODO: --> Find linelengths, angles, lp2, rp1,2 get calculated from lp1
		var ori = new Point(0,0);
		
		var lp1 = new Point(left[0].x, left[0].z);
		var rp1 = new Point(right[0].x, right[0].z);
		
		// Synchronize Y-coordinates on left and right; Skip some points probably
		var l_j = 0;
		var r_j = 0;
		if (left[1].y != right[1].y){
			// console.log("First points dont match", i);
			if (left[1].y <= right[1].y){
				// console.log("dong");
				// find the first left point with the same y coordinate
				while (left[1+l_j].y < right[1].y && l_j < 20){
					
					l_j++;
				}
			} else {
				// find the first right point with the same y coordinate
				while (right[1+r_j].y < left[1].y && r_j < 20){
					r_j++;
				}
			}
		}
		// console.log("l_j:",l_j, "r_j:",r_j, left[1+l_j].y, right[1+r_j].y);
		
		var lp2 = new Point(left[1+l_j].x, Math.abs(left[1+l_j].z));
		var rp2 = new Point(right[1+r_j].x, Math.abs(right[1+r_j].z));
		
		var leftpoints = [lp1, lp2]; // Flattened points		
		var rightpoints = [rp1, rp2];
		
		// console.log(i, lp1,lp2,rp1,rp2);
		var Lwidest, Rwidest;
		// Flatten ribs
		for (j=2; j<right.length && j<left.length; j++){ // Until either one runs out

			de("doing "+j+"th while for rib "+i);
			var Lp,Rp;
			// Find new left point
			var Ll = linelength(left[j-1+l_j], left[j+l_j]);
			var Rl = linelength(right[j-1+r_j], left[j+l_j]);
			var cL = new Circle(leftpoints[j-1], Ll);
			var cR = new Circle(rightpoints[j-1], Rl);
			var nL = intersect_circle(cL,cR); // Next left point coordinates, choose higher
			// de(j+ " nL "+nL[0].x+" "+nL[0].y);
			if (nL[0].y > nL[1].y){
				Lp = nL[0]; 
			} else {
				Lp = nL[1]; 
			}
			// Find new right point
			var Ll = linelength(left[j-1+l_j], right[j+r_j]);
			var Rl = linelength(right[j-1+r_j], right[j+r_j]);
			var cL = new Circle(leftpoints[j-1], Ll);
			var cR = new Circle(rightpoints[j-1], Rl);
			var nR = intersect_circle(cL,cR); // Next left point coordinates, choose higher
			// de(j+" nR "+ nR[0].x+" "+nR[0].y);
			if (nR[0].y > nR[1].y){
				Rp = nR[0]; 
			} else {
				Rp = nR[1]; 
			}
			leftpoints.push(Lp)
			rightpoints.push(Rp)
			// Find widest_i location so it can be marked on the rib templates
			if (left[j+l_j].y == widest_y) Lwidest = Lp;
			if (right[j+r_j].y == widest_y) Rwidest = Rp;
		}
		
		// Rotate and translate each ribgroup for nice viewing
		var firstp = leftpoints[0];
		var lastp = getlast(leftpoints)
		var traby = linelength(firstp,lastp)+100;
		// var angle = Math.abs(getangle(firstp,lastp)|| 0.0) ;
		var angle = Math.atan2((lastp.y-firstp.y), (lastp.x-firstp.x))
		var deg = angle / 0.01745329252; // rad to deg
		// var rot = " rotate("+deg+" "+(firstp.x) +" "+(firstp.y) +")";
		var rot = " rotate("+90+" "+(firstp.x) +" "+(firstp.y) +")";
		var tra = " translate(0 "+ -(r.length-i)*60 +")"
		
		// Draw rib, flip rightpoints around
		rightpoints.reverse();
		leftpoints=leftpoints.concat(rightpoints);

		// Color the rib support for debugging
		// var gre = Math.round(254-(i/r.length)*255).toString(16);
		// var blu = Math.round((i/r.length)*255).toString(16);
		// var styl ="stroke:#00"+gre+blu+";stroke-width:0.4; fill:none;";
		var styl ="stroke:#000000;stroke-width:0.4; fill:none;";

		// Add rib number as text to group
		var ribulig = makegroup(flatribs, "flatribg-"+i);
		drawtext(ribulig, firstp.move(0, 10), i==1?"C":i-1, "","flatribootext-"+i)
		
		
		// ribulig.setAttribute("transform",tra ); // Move group
		// ribulioo.setAttribute("transform",rot); // Rotate rib shape
		// Translate&rotate every point
		for (var p=0; p<leftpoints.length; p++){
			leftpoints[p] = new Point(leftpoints[p].x, -leftpoints[p].y);
		}
		// Draw rib template
		var ribulioo = drawshape(ribulig, leftpoints, styl,"flatrib-"+i, true);
		// Draw line on widest point of lute on each rib template
		var ribulil = drawline(ribulig, [Lwidest.scale(1,-1),Rwidest.scale(1,-1)], NOFILLTHIN,"flatribw-"+i, true);
		
		// Last point is rightpoints[0] and requires special treatment because it can be the same as leftpoints[0] (??)
		// var l = linelength(firstp, leftpoints[leftpoints.length-1]);
		// var a = (getangle(firstp,leftpoints[leftpoints.length-1]) || - Math.PI/2);
		// leftpoints[leftpoints.length-1] = firstp.movedist(-l, a-angle);
		// console.log(l,a);
		// Translate line between widest points of rib
		// var l = linelength(firstp, wl1);
		// var a = getangle(firstp, wl1);
		// wl1 = firstp.movedist(l, a-angle);
		// var l = linelength(firstp, wl2);
		// var a = getangle(firstp, wl2);
		// wl2 = firstp.movedist(l, a-angle);
		
		
		// TODO: translating and rotating each point produces weird errors
/* 
		var ribulig = makegroup(flatribs, "flatribg-"+i);
		var ribuli = drawshape(ribulig, leftpoints, NOFILLTHIN,"flatrib-"+i, true);
		var ribulil = drawline(ribulig, [wl1,wl2], NOFILLTHIN,"flatribw-"+i, true);
		// Add number new Point(biggestwidth/2, 0)
		var haf = linelength(wl1,wl2)/2;
		var t = drawtext(ribulig, wl1.move(haf-5,-10), (i-1 || "C"), "", "flatribt-"+i);
		// negate rotation, and also then negate translation
		// t.setAttribute("transform"," rotate(-"+deg+")");
		// console.log("Rib",i,"width:", biggestwidth);
		// Apply transformation
		// ribulig.setAttribute("transform",tra+rot);
		ribulig.setAttribute("transform",tra);
		 */
	}
	// Move flat ribs North so it's not on top of the drawing
	var layertr = " translate(0 -"+ traby +")";
	flatribs.setAttribute("transform", layertr)
}

