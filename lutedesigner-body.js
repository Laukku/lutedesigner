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
// Methods for calculating the body.

// TODO: quick sideview rib drawing by flattening middle rib shape

var accuracy = 2;
var lastribadd = 2; // Make last rib wider by this much
var positionlist = []; // Where to get edge and middle path height, more accuracy at the start and end
// var lute3d ={}; // Data for creating a 3D render of the body and perhaps the whole lute
// Convert edge and middle shapes in to points, every 5mm or so
// Only calculate half of body, since the body is symmetrical

// TODO: Make cross supports wider to reach the rib surface

function drawribs(crosslayer){ // on the cross section and side view

	// Get points along paths for side and middle
	var sidepoints = getpoints(currentbody.side,null, false); // Last parameter is debug
	// var debugside = [];
	var midpoints = getpoints(currentbody.middle,sidepoints.Y);
	lute3d.sidepoints = sidepoints;
	lute3d.midpoints = midpoints;
	// console.log("midpoints",midpoints);
	// for (var i=0; i<midpoints.X.length; i++){
		// debugside.push(new Point(midpoints.X[i], midpoints.Y[i]).scale(1,1).addpoint(SIDEVIEWORIGIN));
	// }
	
	// drawshape(crosslayer, debugside, REDSTYLE,"debugside", true);
	
	var Ypoints = flipsign(sidepoints.Y);
	var sidepoints = flipsign(sidepoints.X);

	var midpoints = flipsign(midpoints.X);
	// Find 3D points for ribs (only one half of the form though)
	
	var widest_i = findmax(sidepoints);
	// console.log("widest_i: ", widest_i);
	widest_i = findmax(sidepoints);

	lute3d.widest_i = widest_i;
	var widest = circumference(Ypoints,sidepoints,midpoints, widest_i, 0.1);
	
	// Draw it
	// var points = [CROSSVIEWORIGIN];
	// for (var i =0; i<widest.Zpoints.length; i++){
		// points.push(new Point(CROSSVIEWORIGIN.x-widest.Xpoints[i], CROSSVIEWORIGIN.y-widest.Zpoints[i]));
	// }
	// drawshape(getelid("formlayer"),  points, REDSTYLE,"cross-section-round2", true);
	
	var ribs = getribangles(widest);
	lute3d.ribs = ribs;
	// console.log("ribs",ribs);
	
	// var points = [CROSSVIEWORIGIN];
	// for (var i =0; i<ribs.endpoints.length; i++){
		// points.push(new Point(CROSSVIEWORIGIN.x-ribs.endpoints[i].x, CROSSVIEWORIGIN.y-ribs.endpoints[i].y));
	// }
	// drawshape(getelid("formlayer"),  points, REDSTYLE,"cross-section-endpoints", true);
	
	if (editorstate.drawingpurpose.startsWith("technical")){
		// Draw cross section at CROSSVIEWORIGIN
		var crossg = makegroup(crosslayer, "cross-section-half");
		
		var crosspoints = [];
		var crosspoints2 = [];
		for (var i=0; i<ribs.endpoints.length; i++){
			crosspoints.push(CROSSVIEWORIGIN.minuspoint(ribs.endpoints[i]));
			crosspoints2.push(CROSSVIEWORIGIN.minuspoint(ribs.endpoints[i].scale(-1,1)));
			// Draw lines from center to shell
			if (i < ribs.optpoints.length ){
			/* drawline(crossg, [CROSSVIEWORIGIN.minuspoint(ribs.optpoints[i]),
								  CROSSVIEWORIGIN.minuspoint(ribs.endpoints[i])]);
			drawline(crossg, [CROSSVIEWORIGIN.minuspoint(ribs.optpoints[i].scale(-1,1)),
								CROSSVIEWORIGIN.minuspoint(ribs.endpoints[i].scale(-1,1))]); */
			}
		}
		crosspoints.reverse();
		crosspoints = crosspoints.concat(crosspoints2);
		// Draw a semicircle for reference drawarc (c, p1, p2, rx,ry, xrot, largearc, sweep, style, id)
		var rx = linelength(crosspoints[0],crosspoints[crosspoints.length-1])/2;
		var semic = drawarc(crossg, crosspoints[crosspoints.length-1],crosspoints[0],rx,rx,0,0,0,GUIDESTYLE);
		// console.log(crosspoints[0],crosspoints[crosspoints.length-1],rx,semic);
		// Draw cross section shape
		var crossshell = drawshape(crosslayer, crosspoints, THINSTYLE,"cross-section", true);
		addelbefore(crossg,crossshell);
	}
	// Draw rib joints on the sideview
	var t0 = performance.now();
	var ribpaths = calculateribjoints_plane(Ypoints,sidepoints,midpoints, ribs, widest_i);
	var t1 = performance.now();
	console.log("It took " + (t1 - t0).toFixed(0) + " ms to calculate ribjoints.")

	lute3d.ribpaths = ribpaths;
	
	// Draw from threedee at widest_i
	var points = [CROSSVIEWORIGIN];
	for (var i =0; i<ribpaths.threedee.length; i++){
		points.push(new Point(CROSSVIEWORIGIN.x-ribpaths.threedee[i][widest_i].x, CROSSVIEWORIGIN.y-ribpaths.threedee[i][widest_i].z));
	}
	// drawshape(getelid("formlayer"),  points, GREENSTYLE,"cross-section-threedee", true);
	
	// Draw ribs as series of lines or curves, jumping over points
	var ribsg = makegroup(getelid("sideview"), "ribjoints-side");
	for (var i=0; i< ribpaths.sideview.length; i++){
		drawshape(ribsg, ribpaths.sideview[i], NOFILLTHIN,"ribside-"+i, false);
	}
	addelafter(getelid("soundboard-side"),ribsg);
	// Original middle gets hidden if drawing rib sides succeeds
	var ribsg = makegroup(getelid("sideview"), "ribjoints-side");
	for (var i=1; i< ribpaths.sideview.length; i++){
		drawshape(ribsg, ribpaths.sideview[i], NOFILLTHIN,"ribside-"+i, false);
	}
	addelafter(getelid("soundboard-side"),ribsg);
	// Remove outside side path
	delel(currentbody.middle);
	// console.log(ribpaths);
	
	
	
	if (editorstate.drawingpurpose.startsWith("technical")){
		// Draw endclasp
		var endclasp = draw_endclasp ();
		// Draw ribs on cross section
		var skip_every = 4; // Start skipping y indexes after true start of ribs has been found
		var doskip=0;
		var backpaths = [];
		var backpathsl = [];
		var frontpaths = [];
		var mo = ribpaths.offsets[findmax(ribpaths.offsets)];
		// Debug draw rib paths on cross section 
		for (var i=0; i<ribpaths.threedee.length-1; i++){
			var mid_offset = widest_i+ribpaths.offsets[i]-mo;
			var path = [];
			var pathl = [];
			var path2 = []; // After widest_i, to be drawn gray or not at all
			for (var yi=0; yi<ribpaths.threedee[i].length; yi+=1+doskip){
				if (yi < mid_offset){
					if (ribpaths.threedee[i][yi].z >= lute3d.ribs.ribstartpoints[i].y){
						
						path.push(new Point(ribpaths.threedee[i][yi].x, ribpaths.threedee[i][yi].z).scale(1,-1).addpoint(CROSSVIEWORIGIN));
						pathl.push(new Point(ribpaths.threedee[i][yi].x, ribpaths.threedee[i][yi].z).scale(-1,-1).addpoint(CROSSVIEWORIGIN));
						// if (path.length==0) doskip = skip_every;
					}
					
				} else {
					path2.push(new Point(ribpaths.threedee[i][yi].x, ribpaths.threedee[i][yi].z).scale(1,-1).addpoint(CROSSVIEWORIGIN));
				}
				
				
			}
			if (yi > mid_offset){ // Did not hit widest point, do it now
				path.push(new Point(ribpaths.threedee[i][mid_offset].x, ribpaths.threedee[i][mid_offset].z).scale(1,-1).addpoint(CROSSVIEWORIGIN));
				pathl.push(new Point(ribpaths.threedee[i][mid_offset].x, ribpaths.threedee[i][mid_offset].z).scale(-1,-1).addpoint(CROSSVIEWORIGIN));
			}
			backpaths.push(path);
			backpathsl.push(pathl);
			frontpaths.push(path2);
			// TODO: Rib joint lines appear to be too low half way around the form, and the middle one too high
			// Maybe middle rib joint uses center rather than its real location for calculations
			// The effect is greatest with large bulge number
			// With bulge 2.0 mostly ok but centermost ribjoints above cross-section
		}
		// for (var i=0; i<frontpaths.length;i++){
			// drawshape(crossg, frontpaths[i], GRAYSTYLE, "real-rib-front-"+i,false);
		// }
		// var sixty = CROSSVIEWORIGIN.y - 60.0;
		// var thirty = CROSSVIEWORIGIN.y - 30.0;
		for (var i=0; i<backpaths.length;i++){ // for each ribline path
			var p = backpaths[i];
			var pl = backpathsl[i];
			var gray = [p[0]];
			var grayl = [p[0].minuspoint(CROSSVIEWORIGIN).scale(-1,1).addpoint(CROSSVIEWORIGIN)];
			var black = [];
			var blackl = [];
			// intersect endclasp with each ribline, draw half with gray and half with black
			var inter_found = false;
			for (var j=1; j<p.length; j++){ // for each segment in ribline path
				// Don't bother intersecting if ribline segment is above 60 mm
				// p[j-1] < sixty && p[j] > thirty

				var line = [p[j-1], p[j]];
				
				if (inter_found){
					// If intersects, part of ribline should be above the endclasp, and should be painted black
					
					black.push(p[j]);
					blackl.push(p[j].minuspoint(CROSSVIEWORIGIN).scale(-1,1).addpoint(CROSSVIEWORIGIN));
				} else { // Before intersection is found, draw as gray
					
					var inter = pathline_intersect (endclasp,line,false);
					if (inter !== false){
						
						// console.log(inter);
						// drawcircle(crossg,inter,1,REDSTYLE);
						// drawline(crossg, line, REDSTYLE);
						
						inter_found = true;
						black.push(inter);
						blackl.push(inter.minuspoint(CROSSVIEWORIGIN).scale(-1,1).addpoint(CROSSVIEWORIGIN));
						gray.push(inter);
						grayl.push(inter.minuspoint(CROSSVIEWORIGIN).scale(-1,1).addpoint(CROSSVIEWORIGIN));
					} else {
						gray.push(p[j]);
						grayl.push(p[j].minuspoint(CROSSVIEWORIGIN).scale(-1,1).addpoint(CROSSVIEWORIGIN));
					}
					
				}
			}
			// console.log(gray);
			// console.log(black);
			drawshape(crossg, gray, GRAYSTYLE, "real-rib-back-r-gray-"+i,false);
			drawshape(crossg, grayl, GRAYSTYLE, "real-rib-back-l-gray-"+i,false);
			drawshape(crossg, black, NOFILLTHIN, "real-rib-back-r-black-"+i,false);
			drawshape(crossg, blackl, NOFILLTHIN, "real-rib-back-l-black-"+i,false);
			// addelbefore(endclasp, drawshape(crossg, pl, NOFILLTHIN, "real-rib-back-l-"+i,false));
		}
		
	}
	// TODO: console.log body form coordinates at widest point as calculated by whatever draws cross-section and ribpaths.threedee
	// console.log("widest_i: ", findmax(flipsign(getpoints(currentbody.side,null, false).X)) );
	
}

function draw_endclasp (){
	// console.log("drawing endclasp");
	// Intersect body to get end clasp shape
	
	
	// TODO: Move this calculation (deciding corner position) to where the rib angles are decided, so that it will be possible to make non-converging rib layouts. 
	// TODO: derive 3D model by intersecting with theoretical body shape, not ribs
	
	var g = getelid("cross-section-half");
	var shape = lute3d.ribpaths.threedee;
	var offsets = lute3d.ribpaths.offsets; 
	var soundboard = lute3d.ribpaths.soundboard_edge;
	var mo = offsets[findmax(offsets)];
	var clasph = 45;
	var endh = 35;
	var claspback = [new Point(0, -clasph).addpoint(CROSSVIEWORIGIN)];
	var claspbackl = [];
	var flatribs = getelid("flatribs-layer");
	var sideview = getelid("sideview");
	
	var clasp3D = []; // unflattened for 3d view, expanded by 1mm along surface normal
	var cornerrib;
	
	if (lute3d.ribs.cornerrib){
		cornerrib = lute3d.ribs.cornerrib;
			
		var zj = 0;
		// console.log(i,zj);
		while(shape[cornerrib][zj].z <= clasph  &&  zj <lute3d.widest_i 
		&& shape[cornerrib][zj].x < cps.width*0.5 ){
			
			zj++;
		}
		var p1 = new Point(shape[cornerrib][zj].x, shape[cornerrib][zj].z);
		var p2 = new Point(shape[cornerrib][zj-1].x, shape[cornerrib][zj-1].z);
		var ix = p2.x+((p2.y-clasph)*(p1.x-p2.x))/(p2.y-p1.y);
		
		
	} else {
		// while intersection with z=45 is less than 0.5*(width/2)
		for (var i=0; i<shape.length-2; i++){
			var zj = 0;
			// console.log(i,zj);
			while(shape[i][zj].z <= clasph  &&  zj <lute3d.widest_i 
			&& shape[i][zj].x < cps.width*0.3 ){
				
				zj++;
			}
			// Intersect segment to find exact x position at z=45
			var p1 = new Point(shape[i][zj].x, shape[i][zj].z);
			if (shape[i][zj-1] === undefined) break; // Sometimes this is undefined and will stop execution, but we can just use the last saved intersection just fine
			var p2 = new Point(shape[i][zj-1].x, shape[i][zj-1].z);
			var ix = p2.x+((p2.y-clasph)*(p1.x-p2.x))/(p2.y-p1.y);
			
			
			
		}	
		
	}
	// Corner top point
	claspback.push(new Point(ix, -clasph).addpoint(CROSSVIEWORIGIN));
	claspbackl.push(new Point(-ix, -clasph).addpoint(CROSSVIEWORIGIN)
			.relbezier(-2,4.5, 0,3));
			
	// flatclasp.push(new Point(ix, -clasph));
	// Corner small round bit
	claspback.push(getlast(claspback).move(7,5).relbezier(-7,-2,-5,-0.5));
	claspbackl.push(getlast(claspbackl).move(-7,5));
	
	// Last point on cross section view
	claspback.push(new Point(cps.width,-23).addpoint(CROSSVIEWORIGIN));
	getlast(claspback).relbezier(-30,-15,-5,-9);
	// var g = getlast(claspback);
	// getlast(claspbackl).bezier(30,-15,5,-5);
	claspbackl.push(new Point(-cps.width,-23).addpoint(CROSSVIEWORIGIN));
	
	
	// Finally close shape at soundboard edge
	claspback.push(new Point(cps.width+0.5,0).addpoint(CROSSVIEWORIGIN));
	claspbackl.push(new Point(-cps.width-0.5,0).addpoint(CROSSVIEWORIGIN));

	// Add left side to endclasp
	claspbackl.reverse();
	claspback = claspbackl.concat(claspback);
	var endclasp = drawshape(g, claspback, COVERSTYLE,"endclasp-back", true);
	
	///////////////////////////////////////////////////////////////////////////
	// Do endclasp flattening only if requested
	if (editorstate.drawingpurpose.startsWith("technical") 
		&& editorstate.drawingpurpose != "technical") {
	// flatclasp.push(getlast(flatclasp).move(7,5).relbezier(-7,-2,-5,-0.5));
	
	// Find rest of endclasp by intersecting a plane with the lute shape
	// Find where each ribline intersects the plane
	var inters = [];
	var bottoms = [];
	var end = lute3d.ribpaths.Ypoints[lute3d.widest_i]*0.85-30; // end of clasp, almost
	
	// refine end coordinate to hit a Ypoint
	for (var i=0; i< lute3d.widest_i; i++){
		if (lute3d.ribpaths.Ypoints[i] > end){
			end = lute3d.ribpaths.Ypoints[i];
			break;
		}
	}
	// console.log("end",end);
	var endh = 27;
	var c1H = new Point(0,clasph);
	var c1L = new Point(0,clasph-4);
	var c2H = new Point(end, clasph-1);
	var c2L = new Point(end, endh);
	for (var r=0; r<shape.length; r++){
		// console.log("r=",r);
		for (var i=1; i<=lute3d.widest_i; i++){
			// console.log("i=",i);
			var p1 = new Point(shape[r][i-1].y, shape[r][i-1].z);
			var p2 = new Point(shape[r][i].y, shape[r][i].z);
			// find y,z coordinates
			var inter;
			if (r <= cornerrib){
				inter = intersectline(c1H,c2H,	p1,p2);
			} else {
				inter = intersectline(c1L,c2L,	p1,p2);
			}
			
			if (inter){
				// Find x coordinate
				
				var xp = (inter.x-shape[r][i-1].y)*(shape[r][i].x-shape[r][i-1].x)/(shape[r][i].y-shape[r][i-1].y) + shape[r][i-1].x;
				
				inters.push(new Point(xp, inter.x, inter.y));
				
				// X location at this Y on side shape
				var ii = 1;
				// Find suitable segment of soundboard edge to intersect
				if (xp < cps.width*0.7){
					while(soundboard[ii].x <= xp){
						ii++;
					}
				} else {
					while(soundboard[ii].y <= inter.x){
						ii++;
					}
				}
				
				
				// Intersect to be more accurate
				var yp = (xp-soundboard[ii-1].x)*(soundboard[ii].y-soundboard[ii-1].y)/(soundboard[ii].x-soundboard[ii-1].x) + soundboard[ii-1].y;
				
				bottoms.push(new Point(xp,yp,0));
				// console.log(ii, xp, yp);
			}
		}
	}
	// TODO: Add points between riblines
	// console.log(inters);
	// console.log(bottoms);
	// Remove intersection after cornerrib if it is too close
	if (inters[cornerrib+1].x <= inters[cornerrib].x+7){
		inters.splice(cornerrib+1, 1);
		bottoms.splice(cornerrib+1, 1);
	}
	
	// Draw for debug 
	for (var i=0; i<inters.length; i++){
		// drawcircle(getelid("crosslayer"), new Point(inters[i].x,-inters[i].z).addpoint(CROSSVIEWORIGIN), 1, GREENSTYLE, "endclasp-inter-cross-"+i);
		// drawcircle(getelid("sideview"), new Point(-inters[i].z,-inters[i].y).addpoint(SIDEVIEWORIGIN), 1, GREENSTYLE, "endclasp-inter-side-"+i);
		// if (i > cornerrib+1){
			// claspback.push(new Point(inters[i].x,-inters[i].z).addpoint(CROSSVIEWORIGIN));
			// claspbackl.push(new Point(-inters[i].x,-inters[i].z).addpoint(CROSSVIEWORIGIN));
		// }
	}
	
	
	for (var i=0; i<bottoms.length; i++){
		// drawcircle(getelid("crosslayer"), new Point(bottoms[i].x,-bottoms[i].z).addpoint(CROSSVIEWORIGIN), 1, BLUESTYLE, "endclasp-inter-cross-bot-"+i);
		
		// drawcircle(getelid("sideview"), new Point(-bottoms[i].z,-bottoms[i].y).addpoint(SIDEVIEWORIGIN), 1, BLUESTYLE, "endclasp-inter-side-bot-"+i);
		
	}
	
	// Start flattening the endclasp
	
	// Add start point which is current first point but with x=0
	inters.unshift(new Point(0, inters[0].y, inters[0].z));
	bottoms.unshift(new Point(0, bottoms[0].y, bottoms[0].z));
	
	// If any points are beyond start of endclasp end fancyness, remove
	for (var i=inters.length-1; i>0; i--){
		if (inters[i].y >= end){
			inters.pop();
			bottoms.pop();
		}
	}
	
	// Finally calculate 2D points from 3D points to create flattened endclasp template
	var tp,bp;
	var flatclasp = [new Point(0, linelength(bottoms[0], inters[0]))];
	var flatbottom = [new Point(0,0)]; // the soundboard edge of the endclasp
	for (var i=1; i<inters.length; i++){
		
		if (inters[i].y <= end ){
		// Distance from top point and bottom point to next top point
		var Tl = linelength(inters[i-1], inters[i]);
		var Bl = linelength(bottoms[i-1], inters[i]);
		var Tc = new Circle(flatclasp[i-1], Tl);
		var Bc = new Circle(flatbottom[i-1], Bl);
		var nT = intersect_circle(Tc,Bc); // Next top point coordinates, choose right one
		
		if (nT[0].x > nT[1].x){
			Tp = nT[0]; 
		} else {
			Tp = nT[1]; 
		}
		flatclasp.push(Tp);
		
		// Distances to bottom next point
		var Tl = linelength(inters[i-1], bottoms[i]);
		var Bl = linelength(bottoms[i-1], bottoms[i]);
		var Tc = new Circle(flatclasp[i-1], Tl);
		var Bc = new Circle(flatbottom[i-1], Bl);
		var nB = intersect_circle(Tc,Bc); // Next top point coordinates, choose right one
		
		if (nB[0].x > nB[1].x){
			Tp = nB[0]; 
		} else {
			Tp = nB[1]; 
		}
		flatbottom.push(Tp);
		}
	}	
	
	// Add round bit after cornerrib, add a point 
	var bez = flatclasp[cornerrib+1].move(7,-5.5).relbezier(-7,2,-5,0.5);
	flatclasp.splice(cornerrib+2,0, bez);
	// After the true flat shape has been found, remove intermediate points to get straigth lines
	flatclasp.splice(1,cornerrib); // just the top part
	flatclasp[0].y = flatclasp[1].y; // Make line horizontal
	
	// Add fancy end to to the endclasp
	var endp = new Point(end,endh);
	var lastp = new Point(getlast(inters).y, getlast(inters).z);
	// Distance from last point to end point
	var dE = linelength(lastp, endp);
	// Angle from flattened last two points
	var aE = getangle(flatclasp[flatclasp.length-2], getlast(flatclasp));
	var Ef = getlast(flatclasp).movedist(-dE, aE);
	flatclasp.push(Ef);
	var ep = Ef.move(-20*Math.sin(aE), 14*Math.sin(aE));
	var cp1 = ep.move(27*Math.sin(aE), -7*Math.sin(aE));
	var cp2 = ep.move(25*Math.sin(aE), 8*Math.sin(aE));
	ep = ep.bezier(cp1,cp2)
	flatclasp.push(ep);
	// console.log(ep);
	// Last endclasp point touching soundboard
	var fp = ep.move(-10*Math.sin(aE), 11*Math.sin(aE));
	flatclasp.push(fp);
	
	// Draw flat endclasp template
	flatbottom.reverse();
	flatclasp = flatbottom.concat(flatclasp);
	for (var i=0; i<flatclasp.length; i++){
		flatclasp[i] = flatclasp[i].scale(1,-1);
	}
	// console.log(flatclasp);
	var flatg = makegroup(flatribs,"endclasp-flat-template-group");
	var endclasp2 = drawshape(flatg, flatclasp, THINSTYLE,"endclasp-flat", true);
	for (var i=0; i<flatclasp.length; i++){
		flatclasp[i] = flatclasp[i].scale(-1,1);
	}
	var endclasp3 = drawshape(flatg, flatclasp, THINSTYLE,"endclasp-flat-left", true);
	// console.log("here ends");
	}
	return endclasp;
}



function neckjoint_3D (points,ribs) {
	// Find neck joint shape based on ribjoints that have already been calculated
	// console.log(points);
	// TODO: write neck angle
	
	// points contains rib joint points for all ribjoints:
	// Array [ Array[108], Array[108], Array[108], Array[106] ]
	// in which Array[ ] = {x,y,z}
	var p = editorstate.bulge; // bulging of circle editorstate.bulge
	var nbo = NECKBLOCKORIGIN.move(0,-500); //-Ypoints[Ypoints.length-1]);
	var crosslayer = getelid("crosslayer");
	var frontview = getelid("frontview");
	var neckblock = makegroup(crosslayer, "neckblock-group");
	var jointangle = cps.neckjoint_angle;
	var jointlength = cps.neckjoint_length;
	var jointpoint = cps.neckjoint_no_origin.move(0,-RIBTHICKNESS); // x,y --> y,z Change of coordinate space
	var jointend = cps.neckjoint_end_no_origin.move(0,-RIBTHICKNESS);
	// Find first points[i] whose y is over/in the neckjoint area
	
	// console.log(start_i, points[0][start_i].y, jointpoint.y);
	var neckblock3d = []; // Save neckblock shape for later use
	
	var j2 = jointpoint.movedist(200,jointangle);
	// console.log(jointpoint, j2);
	var jointpoints = [];
	var jointpoints_draw = [];
	var jointpoints_drawl = [];
	// for ribline,
	for (var i=0; i < points.length; i++){
		// Find segment that intersects joint plane
		var start_yi=0;
		var yi=points[i].length-1;
		// Start from the end
		while (start_yi==0 && yi>0 ){
			if (points[i][yi].y <= jointpoint.y){ 
				start_yi = yi;
			}
			yi--;
		} 
		// console.log("rib",i);
		for (var yi=start_yi; yi < points[i].length-1; yi++){
			// intersect lines in z,y
			// console.log("yi",yi, points[i][yi]);
			var inter1 = intersectline(jointpoint, j2,
									  {x:points[i][yi].z, y:points[i][yi].y},
									  {x:points[i][yi+1].z, y:points[i][yi+1].y});
			
			if (inter1){
				// console.log("plane",inter1);
				// intersect in x,y
				var inter2 = intersectline({x:-10, y:inter1.y},
										   {x:200, y:inter1.y+0.0000001},
										   {x:points[i][yi].x, y:points[i][yi].y},
										   {x:points[i][yi+1].x, y:points[i][yi+1].y});
				if (inter2){
					// Save intersection point if found
					// console.log("point",inter2);
					jointpoints.push({x:inter2.x , y:inter2.y, z:inter1.x});
					// Calculate distance from jointpoint to intersection
					var dist = linelength(jointpoint, inter1);
					
					jointpoints_draw.push(new Point(inter2.x,dist).scale(1,-1).addpoint(NECKBLOCKORIGIN));
					jointpoints_drawl.push(new Point(inter2.x,dist).scale(-1,-1).addpoint(NECKBLOCKORIGIN));
					
					break;
				}
			}
		}
	}
	lute3d.neckblock = {};
	lute3d.neckblock.jointpoints = jointpoints;
	// console.log(jointpoints);
	// Draw neckblock joint face
	// Draw tiny lines showing each ribjoint
	jointpoints_drawl.reverse();
	jointpoints_draw = jointpoints_drawl.concat(jointpoints_draw);
	
	var neckjg = makegroup(neckblock, "neckjoint-group");
	var neckj = drawshape(neckjg,jointpoints_draw,"","neckjoint");
	// Draw tiny lines at each rib joint
	for (var i = 1; i<jointpoints_draw.length-1; i++){
		var angle = getangle(NECKBLOCKORIGIN, jointpoints_draw[i]);
		var p = jointpoints_draw[i].movedist(3, angle);
		drawline(neckjg, [jointpoints_draw[i],p]);
	}
	// Find bottom / top surface of neckblock
	var bottom = [new Point(jointpoints[jointpoints.length-1].x,
							jointpoints[jointpoints.length-1].y)];
	var bottoml = [];
	// First point: jointpoints_draw[jointpoints_draw.length-1]
	// Loop backwards in sidepoints until we go over the neckblock back edge
	var yi = start_yi;
	while (points[points.length-1][yi].y >= cps.neckblocky-RIBTHICKNESS){
		bottom.push(new Point(points[points.length-1][yi].x,
							  points[points.length-1][yi].y));
		yi--; // Will end up below cps.neckblocky
	}
	// console.log("cps.neckblocky", cps.neckblocky);
	// console.log("bottom", bottom);
	// Get neck block back shape by intersecting points at cps.neckblocky
	var p1 = new Point(0, cps.neckblocky-RIBTHICKNESS); // z,y
	var p2 = new Point(200, cps.neckblocky-RIBTHICKNESS); // z,y
	var backshape = [];
	var bottompoints = [];
	var neckblockside = [];
	for (var j=0; j < points.length; j++){
		yi = points[j].length-1;
		while (points[j][yi].y >= cps.neckblocky-RIBTHICKNESS){
			yi--; // Will end up below cps.neckblocky
		}
		
		// console.log({x:points[j][yi].z, y:points[j][yi].y});
		var inter1 = intersectline(p1,p2,
								  {x:points[j][yi].z, y:points[j][yi].y},
								  {x:points[j][yi+1].z, y:points[j][yi+1].y});
		if (inter1){
			// console.log("plane",inter1);
			// intersect in x,y
			var inter2 = intersectline({x:0, y:inter1.y},
									   {x:200, y:inter1.y},
									   {x:points[j][yi].x, y:points[j][yi].y},
									   {x:points[j][yi+1].x, y:points[j][yi+1].y});
			if (inter2){
				// Save intersection point if found
				// console.log("point",inter2);
				bottompoints.push({x:inter2.x , y:inter2.y, z:inter1.x});
				// backshape.push(new Point(inter2.x, inter1.x));
				backshape.push(new Point(inter2.x,inter1.x));
				// lute3d.ribpaths.form_supports_last.push(new Point(inter2.x,inter2.y));
				//.scale(1,-1).addpoint(NECKBLOCKORIGIN));
				if (j == points.length-1){
					// Add last point to bottom shape
					bottom.push(new Point(inter2.x,cps.neckblocky-RIBTHICKNESS));
					// console.log("Add last point to bottom shape",bottom[bottom.length-1].y);
					// What? logging bottom gives last y value as 14, logging bottom[bottom.length-1].y gives 415
				}
				// For neckblock side view, gather points along center rib from neckblock start to neckjoint end
				else if (j==0){
					yi++;
					neckblockside.push(new Point(cps.neckblocky-RIBTHICKNESS,0)); // y,z --> x,y
					neckblockside.push(new Point(cps.neckblocky-RIBTHICKNESS,inter1.x)); // y,z --> x,y
					while (points[j][yi].y < jointpoints[0].y){
						neckblockside.push(new Point(points[j][yi].y, points[j][yi].z));
						yi++; // Will end up below jointendy
					}
					neckblockside.push(new Point(jointpoints[0].y, jointpoints[0].z));
					neckblockside.push(new Point(jointpoint.y, jointpoint.x));
				}
			}
		} else {
			// Did not find an intersection with bottom layer yet, so this layer can be remembered for later use, neckblock3d
			
		}
		
	}
	lute3d.neckblock.bottompoints = bottompoints;
	lute3d.neckblock.allpoints = neckblock3d;
	// Make full bottom shape first before drawing it two ways
	for (var i=0; i<bottom.length;i++){
		bottoml.push(bottom[i].scale(-1,-1));
		bottom[i] = bottom[i].scale(1,-1);
	}
	bottoml.reverse();
	bottom = bottom.concat(bottoml);
	
	// Draw neckblock bottom shape on frontview and crosslayer
	var bf = [];
	var bt = [];
	for (var i=0; i<bottom.length;i++){
		bf.push(bottom[i].addpoint(FRONTVIEWORIGIN).move(0,-RIBTHICKNESS));
		bt.push(bottom[i].addpoint(NECKBLOCKORIGIN).move(0,-bottom[0].y));
	}
	drawshape(frontview,bf,THINSTYLE,"neckblock-bottom");
	drawshape(neckblock,bt,THINSTYLE,"neckblock-bottom-template");
	
	var bsmove = cps.neckblocky-RIBTHICKNESS - jointpoints[jointpoints.length-1].y;
	// Draw neckblock inside shape
	var backshapel = [];
	var backshapeh = backshape[0].y;
	for (var i=0; i<backshape.length;i++){
		backshapel.push(backshape[i].scale(-1,1).move(0,-bsmove).addpoint(NECKBLOCKORIGIN));
		backshape[i] = backshape[i].move(0,-bsmove).addpoint(NECKBLOCKORIGIN);
	}
	backshapel.reverse();
	backshape = backshapel.concat(backshape);
	var backg = makegroup(neckblock, "neckblock-backside-group");

	var backs = drawshape(backg,backshape,"","neckblock-backside");
	// Draw tiny lines at each rib joint
	for (var i = 1; i<backshape.length-1; i++){
		var angle = getangle(backshape[i],NECKBLOCKORIGIN.move(0, -bsmove)) - Math.PI;
		var p = backshape[i].movedist(3, angle);
		drawline(backg, [backshape[i],p]);
	}
	// Draw centerline on neckblock shapes
	// console.log(ribs);
	drawline(neckblock, [{x:NECKBLOCKORIGIN.x, 
						   y:jointpoints_drawl[jointpoints_drawl.length-1].y},
						  {x:NECKBLOCKORIGIN.x, 
						   y:backshapel[backshapel.length-1].y}]);
	// Draw side view of neckblock in the side view of the lute
	// Has distance from body start. Rotate 90deg and mirror
	var nbs = [];
	for (var i = 0; i<neckblockside.length; i++){
		nbs[i] = new Point(-neckblockside[i].y, -neckblockside[i].x).addpoint(SIDEVIEWORIGIN).move(0,-RIBTHICKNESS);
		 
	}
	// console.log("nbs",nbs);
	drawshape(getelid("sideview"), nbs,BEHINDSTYLE,"neckblock-side");
	
	// Draw neck block side template
	var sideo = NECKBLOCKORIGIN.move(-cps.neckblocky-RIBTHICKNESS,backshapeh+30)
	for (var i = 0; i<neckblockside.length; i++){
		neckblockside[i] = neckblockside[i].addpoint(sideo);
	}
	drawshape(crosslayer, neckblockside,null,"neckblock-side-template");
	
}

function pathoffset(path,offset){
	// var offset = editorstate.offset; // Shrink by
	var accur = 0.1; // for calculating normals, how far to move along path for sampling position
	// var path = currentbody.side;
	path = path.cloneNode(true);
	convertToAbsolute(path);
	// console.log("pathoffset", path);
	var newpath = creel("path", path.id+"-inside", "", ["d",""], NAMESPACE);
	newpath.setAttribute("style",OCTSTYLE);
	addel(getelid("sideview"),newpath);
	var seglist = path.pathSegList;
	var newseglist = newpath.pathSegList;
	var segs = seglist.numberOfItems;
	var displaced = [];
	var curlen = 0;
	// Find coordinates for each node and control point by rebuilding path and using the very limited built-in functionality of the browser
	// Nodes are of course stored as coordinates in the svg path, but this way we can get their absolute coordinates and also distance along path from start.
	for (var i=0; i<segs; i++){
		
		var seg = seglist.getItem(i);
		newseglist.appendItem(seg);
		curlen = newpath.getTotalLength();
		// Calculate normal angle for this node
		var p1 = newpath.getPointAtLength(curlen-accur);
		var p2 = newpath.getPointAtLength(curlen); // curlen+accur if you want to be exact, but then newseglist.appendItem(seglist[i]) has to happen after this 
		var h = p1.y-p2.y;
		var w = p1.x-p2.x;
		var angle = Math.atan(h/w) -Math.PI/2;
		if (isNaN(angle)) angle =  -Math.PI/2; // First point
		if (w<0) angle = angle -Math.PI;
		// console.log(h,w,angle);
		// Calculate displacement for this node
		var xd =  offset * Math.cos(angle);
		var yd =  offset * Math.sin(angle);
		var nc = {x:xd, y:yd};
		var cp1 = new Point (0, 0);
		var cp2 = new Point (0, 0);
		// Find control point lengths and angles, adjust length, save displacement vectors
		if (i>0 && seg.x2) { // If curve
			// Get absolute coordinates - the path was converted to absolute above
			var prevseg = seglist.getItem(i-1);
			cp1 = new Point(seg.x1,seg.y1);
			cp2 = new Point(seg.x2,seg.y2);
			var node1 = new Point(prevseg.x,prevseg.y);
			var node2 = new Point(seg.x,seg.y);
			var nnode1 = node1.addpoint(displaced[i-1].coords); 
			var nnode2 = node2.addpoint(nc); 
			
			// Find original vs. new segment width and height
			var segw = Math.abs(node1.x-node2.x);
			var segh = Math.abs(node1.y-node2.y);
			var neww = Math.abs(nnode1.x-nnode2.x);
			var newh = Math.abs(nnode1.y-nnode2.y);
			// Find width and height percentages
			var wp = neww/segw;
			var hp = newh/segh;
			// var fl = getelid("formlayer");
			// drawshape(fl,[node1, {x:node2.x,y:node1.y}, node2,
								 // {x:node1.x,y:node2.y}],HANDLESEGPOINTSTYLE,null, z=true)
			// drawshape(fl,[nnode1, {x:nnode2.x,y:nnode1.y}, nnode2,
								 // {x:nnode1.x,y:nnode2.y}],HANDLEPOINTSTYLE,null, z=true)
			// drawline(fl, [node1,cp1]);
			// drawline(fl, [node2,cp2]);
			// drawline(fl, [node1,nnode1]);
			// Define control points relative to node2
			cp1 = cp1.minuspoint(node1).scale(wp,hp).addpoint(nnode1);
			cp2 = cp2.minuspoint(node1).scale(wp,hp).addpoint(nnode1);
			// drawline(fl, [nnode1,cp1]);
			// drawline(fl, [nnode2,cp2]);
			// console.log("w,h%:", i, cp2);
			// Shorten control point vectors by percentages
			
		}
		
		// Save new point displacement data in list
		displaced.push({"coords":nc, "cp1":cp1,"cp2":cp2});
	}
	// console.log(newseglist);
	// console.log(displaced);
	// Rebuild new path again with changed coordinates
	for (var i=0; i<segs; i++){
		var newseg = newseglist.getItem(i);
		newseg.x += displaced[i].coords.x;
		newseg.y += displaced[i].coords.y;
		if (i>0 && newseg.x1){
		// With last node
		newseg.x1 = displaced[i].cp1.x;
		newseg.y1 = displaced[i].cp1.y;
		// With last and this node
		newseg.x2 = displaced[i].cp2.x ;
		newseg.y2 = displaced[i].cp2.y;
		}
		
	}
	// drawshape(getelid("formlayer"), displaced, OCTSTYLE,"", false);
	return newpath;
}

function hyper_inter (X,Y, w,h, P, m1, s) {
	// Approximate hyperellipse-line intersection given a worse approximation
	// linestart s must be normalized to 0...1 by linestarts[i]/width
	// Find points on hyperellipse vertically and horizontally from x, f(x) and inverse hyperellipse
	var y_top = h*(1 - (X/w)**P)**(1/P); // top secant point y
	var x_right = w*(1 - (Y/h)**P)**(1/P); // right secant point x, inverse function of hyperellipse 
	// var top = new Point(point.x, y_top);
	// var right = new Point(x_right, point.y);
	var m2 = (Y - y_top) / (x_right - X); // slope of secant
	var x = (Y - x_right*m2 + m1*s) / (m1 - m2); // intersection x of rib line and secant
	// var y = (x - x_right)*m2 + Y; // Output y from secant line function
	// return new Point(x,y);
	return x; // Calculate y from rib line 
}

function intersect_shell_once(w,h, s, M, P, accur){
	// Calculates one rib intersection with the lute shell at a single y-point
	// s must be in range 0...1
	
	// calculate intersection X coordinate of line and ellipse to start close to final point
	var X = (s*w**2*M**2 + w*h*Math.sqrt(w**2*M**2 - M**2*s**2 + h**2)) / (w**2*M**2 + h**2);
	var Y = h * Math.sqrt(1-(X/w)**2);

	var iters = 0;
	var oldX = 0;
	var oldY = h;
	// console.log("shell", s, w,h, M, P, X,Y);
	// Iterate until difference between X1 and X2 is small enough
	while (Math.abs(X-oldX) >= accur && iters < 20){
		oldX = X;
		oldY = Y;
		X = hyper_inter (oldX, oldY, w,h, P, M, s);
		Y = (X - s)*M; 
		iters++; // Prevent infinite loops in case of stupid
		
		// console.log( iters, oldX, oldY, X,Y);
	}
	
	return new Point(X, Y);
}

function intersect_shell(width, height, linestarts, lineends, bulge){
	// Calculates all rib intersections with the lute shell at a single y-point
	var accur = 0.001; // accuracy of cross section calculation
	var al = linestarts.length;
	var P = bulge; // bulging of circle editorstate.bulge
	var outputs = [];
	
	for (var a=0; a<al; a++){
		var s = linestarts[a].x;
		var M = (lineends[a].y - linestarts[a].y)/(lineends[a].x - linestarts[a].x);
		var newp = intersect_shell_once(width,height,s,M,P,accur);
		
		outputs.push(
				{"x": newp.x,
				 "z": newp.y});
		
	}
	
	// console.log(width, height, linestarts, bulge, outputs);
	return outputs;
}

function calculateribjoints_plane(Ypoints,sidepoints,midpoints, ribs, widest_i) {
	// Find 3D points for ribs using the plane intersect method (only one half of the form though)
	// console.log(Ypoints,sidepoints,midpoints);
	// return array of arrays of 3d points
	var p = editorstate.bulge; // bulging of circle editorstate.bulge
	// Calculate point based on cross section function, which is a flattened and bulged circle function.
	var yl = Ypoints.length;
	var al = ribs.angles.length;
	var accur = 0.001; // accuracy of cross section calculation
	// Calculate start and end points for ribjoints
	var riblines = []; // These are for the neck end of the body, and end in 0,0
	var center = new Point(0,0);
	var output_draw = []; // [[point,point,point...], [...], ...]
	var output_real = []; // [[point,point,point...], [...], ...] // threedee
	var output_supports = [];
	var compensations = [];
	var linestarts = [];
	var lineends = [];
	// Calculate actual first point y-positions based on optpoints intersecting edge
	for (var i=0; i<al; i++){
		// Get intersect plane function values for each rib joint

		linestarts.push(ribs.optpoints[i]);
		lineends.push(ribs.endpoints[i]);
		output_draw.push([new Point(SIDEVIEWORIGIN.x, 
									SIDEVIEWORIGIN.y)]);
		var starty = 0;
		var x = ribs.optpoints[i].x;
		// Check which segment in sidepoints is intersected by line along x
		for (var j=1; j<widest_i; j++){
			if (sidepoints[j] > x){
				break;
			}
		}
		// intersect line from j-1 to j with line along y axis at x
		starty = (x - sidepoints[j-1])*((Ypoints[j]-Ypoints[j-1])/(sidepoints[j]-sidepoints[j-1])) + Ypoints[j-1]
		// Save ribjoint start point
		output_real.push([	new Point(x,starty,0) ]);
		output_supports.push( [ new Point(0.0,0.0)  ] );
		compensations.push( [] );
	}
	
	// Find intersections at widest point => Z_w, X_w
	// console.log(widest_i);
	// Old method: intersect_shell(width, height, linestarts, lineends)
	var points_widest = intersect_shell(sidepoints[widest_i], midpoints[widest_i], linestarts, lineends, p);
	var points = [CROSSVIEWORIGIN];
	for (var i =0; i<points_widest.length; i++){
		points.push(new Point(CROSSVIEWORIGIN.x-points_widest[i].x, CROSSVIEWORIGIN.y-points_widest[i].z));
	}
	// drawshape(getelid("formlayer"),  points, REDSTYLE,"", true);
	// points_widest produces ok shape
	// console.log("Ribs object:", ribs);
	// console.log("Points at widest", points_widest);
	var planedata = [];
	var k;
	var i;
	for (i=0; i<al; i++){ // For each rib joint
		// calculate 3d plane function values for each rib joint
		// x = body length - k*y , where k is some constant value k=w/l
		// x = w-(w/l)*y // w= rib joint start distance from 0,0,0 along x axis
		k = ribs.optpoints[i].x / Ypoints[Ypoints.length-1];
		var X_aw = ribs.optpoints[i].x - k * Ypoints[widest_i];
		var X_bw = points_widest[i].x - X_aw;
		var angle = Math.atan(points_widest[i].z / X_bw);
		var m = points_widest[i].z / X_bw;
		var s = ribs.optpoints[i].x / sidepoints[widest_i]; // 
		planedata.push({k:k, w:ribs.optpoints[i].x, angle:angle, s:s, m:m});
		// TODO: Calculate where ribjoint hits z=0 first, since 
	}
	// planedata.push({k:k, w:ribs.optpoints[i-1].x, angle:0.0});
	// console.log("planedata", planedata);
	var planefunction = function(pldata,yi, ribi){
		if (ribi >= pldata.length) return {p1:new Point(0,0),p2: new Point(500,0)};
		// return point on soundboard and point beyond shell
		// yi = index along y axis, ribi = rib index
		var p1 = new Point(pldata[ribi].w - pldata[ribi].k * lute3d.ribpaths.Ypoints[yi], 0); // where y is actually z
		var p2 = new Point(p1.x + 1000*Math.cos(pldata[ribi].angle), 
				  1000*Math.sin(pldata[ribi].angle));
		return {p1:p1,p2:p2};
	}
	 
	// console.log("Planedata:",planedata);
	
	for (var i=1; i<yl; i++){
		// At every Y location, calculate cross section
		
		var width = sidepoints[i]; // is [i] always available?
		var height = midpoints[i];
		// var b = height/width;

		
		// bulge less towards neck, calculate a new p here
		// bulge should start going smaller from widest_i
		if (i > widest_i){
			var p = 2+(editorstate.bulge-2)*(1-(i-widest_i)/(yl-widest_i));
		} else {
			var p = editorstate.bulge; // max bulge before widest_i
		}
		
		var inter,p1,M;
		
		// for each rib at this y
		for (var a = 0; a<al; a++){
			// calculate M, s 

			p1 = new Point(planedata[a].w - planedata[a].k * Ypoints[i], 0);
			M = planedata[a].m; // ribjoint angle
			
			if ((width > 10 && height > 10) || i > widest_i){
				inter = intersect_shell_once(width,height, p1.x, M, p, accur);
			} 
			
			
			// Then also find intersection with previous ribs or center
			
			if (inter && i<40 && inter.x <= output_real[a][output_real[a].length-1].x ){
				// console.log(a,i, inter);
				inter = null;
			}
			
			if (inter){
				
				output_real[a].push(new Point(inter.x, Ypoints[i], inter.y));
				// sideview
				output_draw[a].push(new Point(SIDEVIEWORIGIN.x-inter.y, SIDEVIEWORIGIN.y-Ypoints[i]));
				// Supports 
				var d = Math.sqrt((inter.y)**2 + (inter.x-p1.x)**2) + p1.x*Math.cos(planedata[a].angle);
				// var d = Math.sqrt((inter.y)**2 + (inter.x-p1.x)**2) ;
				var compensation = p1.x*Math.cos(planedata[a].angle);
				
				
				// TODO: Add support point only if it is on the correct side of the z axis
				if (inter.x > 0 && inter.y > 0){
					var supp = new Point(Ypoints[i], d);
					supp["yi"] = i;
					output_supports[a].push(supp);
				}
				
				compensations[a][i] = compensation; // 
				compensations[a].push(compensation);
				
			} 
			
			// if (i == widest_i) console.log(accur);
			
			// console.log();
		} // End while
		
	}
	for (var i=0; i<al; i++){
		// If all rib paths don't terminate at the same point, add it
		if (output_real[i][output_real[i].length-1].y != Ypoints[Ypoints.length-1]){
			output_real[i].push(new Point(0.0, Ypoints[Ypoints.length-1], 0.0));
		}
	}

	// Add end points for each rib, create soundboard edge points
	var edge = [];
	var lastrib = []; // Add 3D points for the edge of the soundboard
	var lastrib_sup = []; // Add 3D points for the edge of the soundboard
	var start_of_last_x = output_real[output_real.length-1][0].x;
	var start_of_last_y = output_real[output_real.length-1][0].y;

	edge.push(new Point(0.0,0.0,0.0));
	lastrib.push(new Point(start_of_last_x, start_of_last_y, 0.0));

	for (var i=0; i<sidepoints.length; i++){
		// edge.push({"x": sidepoints[i],
					// "y": Ypoints[i],
					// "z": 0.0});
		edge.push(new Point(sidepoints[i],Ypoints[i],0.0));		
		var supp = new Point(Ypoints[i], sidepoints[i])
		supp["yi"] = i;
		lastrib_sup.push(supp);
		if (sidepoints[i] > start_of_last_x){
			// lastrib.push({"x": sidepoints[i],
						  // "y": Ypoints[i],
						  // "z": 0.0});
			lastrib.push(new Point(sidepoints[i], Ypoints[i], 0.0));
			
		}
	}
	var lastrib_y = lastrib[lastrib.length-1].y;
	// console.log("lastrib_y",lastrib_y, Ypoints[Ypoints.length-1]);
	// Search in Ypoints for lastrib_y index
	var i = Ypoints.length-1;
	while ( Ypoints[i] > lastrib_y ){
		i--;
	}
	i++;
	// console.log("at Ypoints", i, Ypoints[i]);
	while (Ypoints[i] <= Ypoints[Ypoints.length-1]){
		// console.log("yo", i);
		lastrib.push(new Point(sidepoints[i], Ypoints[i], 0.0));
		
		i++;
	}
	output_real.push(lastrib);
	output_supports.push(lastrib_sup);
	// Add final 0,length,0 point to every ribjoint array
	for (var i=0; i<output_draw.length; i++){
		output_draw[i].push(new Point(	SIDEVIEWORIGIN.x, 
										SIDEVIEWORIGIN.y-Ypoints[Ypoints.length-1]));
	}
	

	// Synchronize ribpaths based on y coordinates
	// For each rib joint, find rib joint y coordinate that is Ypoints[widest_i] 
	var offsets = [];
	for (var i=0; i<output_real.length; i++){
		for (var j=0; j<output_real[i].length; j++){
			if (output_real[i][j].y == Ypoints[widest_i]) break;
		}
		offsets.push(j - widest_i);
	}

	var maxoffset = Math.abs(offsets[findmin(offsets)]);

	for (var i=0; i<offsets.length; i++){
		offsets[i] = offsets[i]+maxoffset+1;
	}

	// Sanitize output_real so ribs don't intersect under endclasp
	if (editorstate.drawingpurpose.startsWith("technical")){
	
	// For each rib
	for (var i=1; i< output_real.length; i++){
		// Intersect with each previous rib
		var p = i-1; // Previous rib index to be intersected
		var inter = false;
		var inter_y = 0;
		while (p >= 0){
			var j = 1; // segment of this rib i
			// only if start of rib is less than previous can they intersect
			while (j < 20 && !inter){
				// intersect each segment of this rib with each segment of previous rib
				var k = 1; // segment in previous rib
				while (k < 20 && !inter){
						// Use coordinates x (lute width) and z (lute depth)
						var p11 = new Point(output_real[i][j].x, output_real[i][j].z);
						var p12 = new Point(output_real[i][j-1].x, output_real[i][j-1].z);
						var p21 = new Point(output_real[p][k].x, output_real[p][k].z);
						var p22 = new Point(output_real[p][k-1].x, output_real[p][k-1].z);
						
						inter = intersectline(p11,p12, p21,p22);
						inter_y = output_real[i][j].y;
						// inter_y = 0;
					k++;
				}
				j++;
			}
			p--;
		}
		if (inter) {
			drawcircle(getelid("crosslayer"), CROSSVIEWORIGIN.minuspoint(inter), 1, REDSTYLE, "rib-inters-"+i+"-"+j+"-"+k);
			
			// Delete points from i that have x<inter.x and/or z<inter.y
			var jr = 0;
			var removed;
			while (output_real[i].x < inter.x || output_real[i].z < inter.y  || jr < 20){
				removed = output_real[i].shift();
				jr++;
			}
			
			// console.log(new Point(inter.x, removed.y, inter.y));
			// TODO: successfully removing points from threedee means offsets becomes unreliable. Maybe add null values as padding?
			// or reverse order and start from tip?
			// Or simplify start area so that each ribline has a startpoint and the next point is always synchronized, and each ribline has the same number of points?
			output_real[i].unshift(new Point(inter.x, inter_y, inter.y));
		}
	}
	}

	return {"sideview":output_draw, "threedee":output_real,"soundboard_edge":edge, Ypoints:Ypoints, offsets:offsets, "form_supports":output_supports, "compensations":compensations,"plane":planefunction, "planedata":planedata};
}

function circumference(Ypoints, side, middle, at,accur) { // at = index in coordlist
	// Returns circumference of half of body at given X coordinate, approximated by breaking the cross section curve into line segments
	// Also returns points X,Z along the curve
	var width = side[at],
		height = middle[at],
		x=0,
		circumference=0;
	var Zpoints = [];// Array of Z points along the X-axis at the widest point
	var Xpoints = []; // Records where the curve was sampled, used for drawing the curve
	var distances = [0]; // Records distances between this and last point
	cps.depth = height;
	var p = editorstate.bulge; // bulging of circle editorstate.bulge
	var last_accur = accur;
	// console.log(width, height);
	while (x <= width) {
		// Put new Z height in Zpoints
		var g = -(1/(width*width)) * (x*x) +1;
		var f = (Math.abs((1-g)*width + (g*height))**p - Math.abs(x)**p)**(1/p);
		Zpoints.push(f);
		Xpoints.push(x);
		// Calculate distance traveled
		if (Zpoints.length > 1){
			var i = Zpoints.length-1;
			var dist = Math.sqrt((Zpoints[i]-Zpoints[i-1])**2+
								 (Xpoints[i]-Xpoints[i-1])**2);
			circumference += dist;
			distances.push(dist);
		}
		if (x < 1.0+accur ){
			x += accur;
		} else {
			// Vary x interval based on slope of curve
			var i = Zpoints.length-1;
			var angle = Math.abs(Math.atan((Zpoints[i-1]-Zpoints[i])
									/(last_accur)));

			last_accur = accur * Math.cos(angle)
			x += last_accur;
		}
	}
	Zpoints.push(0); // Add final point at lute edge
	Xpoints.push(width);
	var i = Zpoints.length-1; // And then calculate last segment length
	circumference += Math.sqrt((Zpoints[i]-Zpoints[i-1])**2+
							   (Xpoints[i]-Xpoints[i-1])**2);
	// Draw it
	// var points = [CROSSVIEWORIGIN];
	// for (var i =0; i<Zpoints.length; i++){
		// points.push(new Point(CROSSVIEWORIGIN.x-Xpoints[i], CROSSVIEWORIGIN.y-Zpoints[i]));
	// }
	// drawshape(getelid("formlayer"),  points, GREENSTYLE,"", true);
	// console.log(Xpoints.length, Zpoints.length, circumference);
	
	
	return {"Xpoints": Xpoints, "Zpoints": Zpoints, "width": width,
		"distances": distances, "circumference": circumference};
	
} 

function getribangles(widest){
	// Get angles of ribjoints based on circumference at the widest point of the body, and number of ribs
	// Find where the endclasp corner should be
	// while intersection with z=45 is less than 0.3*(width/2)
	var crosslayer = getelid("crosslayer");
	var ribwidth = (widest.circumference-lastribadd) / (editorstate.numberofribs/2);
	// console.log(ribwidth);
	var ribdists = [ribwidth/2];
	var fullribs = Math.floor(editorstate.numberofribs/2);
	var cornerrib = false; // Only used by draw_endclasp if set
	for (var i=1; i<fullribs; i++){
		ribdists.push(ribdists[i-1]+ribwidth);
	}
	
	// console.log("widest",widest);
	// console.log(widest.circumference-ribdists[ribdists.length-1]-ribwidth);
	var rib = 0;
	var i = 1;
	var traveled = 0;
	var angles = [];
	var endpoints = [];
	while (rib <= fullribs && traveled < widest.circumference){
		// Travel along the cross-section
		traveled += widest.distances[i];
		
		if (traveled > ribdists[rib]){
			
			// TODO: Calculate intersection with line segment.. although if accur is set to 0.1 in circumference(), this is accurate enough
			endpoints.push(new Point(widest.Xpoints[i], widest.Zpoints[i]));
			// Calculate angle
			var angle = Math.atan(widest.Xpoints[i]/ widest.Zpoints[i]);
			angles.push(angle);
			rib++;
			// Why dis 1.7 from what is drawn in circumference ?? ??
			// drawcircle(getelid("crosslayer"), endpoints[endpoints.length-1].scale(-1,-1).addpoint(CROSSVIEWORIGIN), 1,BLUESTYLE,"nc1-"+i);
		}
		i++;
		
	}
	endpoints.push(new Point(widest.Xpoints[widest.Xpoints.length-1], 
							 widest.Zpoints[widest.Zpoints.length-1]));
	// console.log(angles);
	// console.log(endpoints);
	var minlist = [];
	var maxlist = [];
	var avglist = [];
	var ribstartpoints = [];
	// Find optimal rib layout based on 90deg angles from shell. return point on X-axis where ribs intersect.
	// These will be only used for the back end of the ribs, the neck end will always converge at 0,0
	// console.log(widest);
	var start = new Point(0,0);//new Point(-10000,0);
	var end = new Point(10000, 0.0000000002);//start.move(10000, 0.0000000002);
	for (var i=0; i<angles.length; i++){
		if (i==0){
			var angle1= 0;
		} else {
			var angle1 = getangle(endpoints[i],endpoints[i-1])+Math.PI/2;
		}
		// angle1: 90deg to prev rib surface, 
		// angle2: 90deg to next rib surface
		// console.log(angle1);
		var angle2 = getangle(endpoints[i],endpoints[i+1])+Math.PI/2;
		var avgangle = (angle1+angle2)/2.0;
		var minp = endpoints[i].movedist(-1000, angle2);
		var maxp = endpoints[i].movedist(-1000, angle1);
		var avgp = endpoints[i].movedist(-1000, avgangle);
		// drawline(getelid("crosslayer"), [minp.scale(-1,-1).addpoint(CROSSVIEWORIGIN), endpoints[i].scale(-1,-1).addpoint(CROSSVIEWORIGIN)]);
		// drawline(getelid("crosslayer"), [maxp.scale(-1,-1).addpoint(CROSSVIEWORIGIN), endpoints[i].scale(-1,-1).addpoint(CROSSVIEWORIGIN)]);
		

		minp = intersectline(minp,endpoints[i],  start,end);
		maxp = intersectline(maxp,endpoints[i],  start,end);
		avgp = intersectline(avgp,endpoints[i],  start,end);
		minlist.push(minp || new Point(0,0));
		maxlist.push(maxp || new Point(0,0));
		avglist.push(avgp || new Point(0,0));
		
	}
	
	var start = minlist[Point.findmax(minlist,"x","min")].x;
	var end =   maxlist[Point.findmax(maxlist,"x","max")].x;
	var len = Math.abs(end-start);
	var div = len / minlist.length;
	var startx = start > div/2 ? start: div/2;
	var optpoints = [];
	// Line of endclasp top
	var start = new Point(-10,45);//new Point(-10000,0);
	var end = start.move(10000, 0.0000000002);//start.move(10000,
	var cornerrib = 0;
	var cornermin = 0.4*widest.width;
	var cornermax = 0.45*widest.width;
	
	// Refine ribline placement depending on user choice
	
	/* if (editorstate.ribspacing == "above"){ 
		// Disabled, stuff under endclasp does not work
		// Hoffmann type bodies with really deep bodies.
		// Aim all ribs to 0.5*width below center
		// console.log("widest", widest);
		var targetp = new Point(0, cps.depth-cps.width);
		// console.log("Proposing point ", targetp);
		var neg = new Point(-100000,0);
		var pos = new Point(100000,0);
		for (var i=0; i<maxlist.length; i++){
			var inter = intersectline(neg,pos,	targetp, endpoints[i], true);
			optpoints.push(inter);
			// console.log(targetp, endpoints[i]);
			// console.log(i,": Proposing point ", inter);
			ribstartpoints.push(targetp);
		}
		
	}else */  
	if (editorstate.ribspacing == "evenclasp" || editorstate.ribspacing == "theorbo"){ 
		
		// space ribs respecting min, max
		var cornerx;
		for (var i=0; i<maxlist.length; i++){
			var np = (div*(i) + startx) * editorstate.ribspread;
			if (np < minlist[i].x) np = minlist[i].x;
			if (np > maxlist[i].x) np = maxlist[i].x;
			optpoints.push(new Point(np,0));
			
			// Find corner rib
			var cp = 45*(endpoints[i].x-np)/endpoints[i].y + np;
			if (cp <= cornermax){
				cornerrib = i;
				cornerx = cp;
			}
		}
		// console.log("cornerrib:",cornerrib);
		var ediv = (cornerx / (cornerrib + 0.5))*1.1;
		// Space ribs before corner rib evenly at endclasp height
		for (var i=0; i<=cornerrib; i++){
			drawline(getelid("crosslayer"), [CROSSVIEWORIGIN.minuspoint(new Point(ediv*(i+0.5),45)), CROSSVIEWORIGIN.minuspoint(endpoints[i])],GREENSTYLE);
			var p = ediv*(i+0.5)*0.95; // 0.95 is a decent approximation of where the ribline actually ends up being at. TODO: affect central ribs more and corner rib not at all.
			var cp = p - 45*(endpoints[i].x-p)/(endpoints[i].y-45) ;
			
			optpoints[i].x = cp;
		}
		// Next rib after corner rib should be between corner and next one
		if (optpoints[cornerrib+2]){ // if 11 or 9 ribs, this does not exist necessarily
			optpoints[cornerrib+1].x = (optpoints[cornerrib].x + optpoints[cornerrib+2].x) / 2;
		}
		
		
		// Evenly space the remaining ribs
		// var remaining = optpoints.length-cornerrib;
		// var rdiv = 
		// for (var i=cornerrib; i<optpoints.length; i++){
			// var p = ediv*(i+0.5);
			// var cp = p - 45*(endpoints[i].x-p)/(endpoints[i].y-45) ;
			
			// optpoints[i].x = cp;
		// }
		for (var i=0; i<maxlist.length; i++){
			
			if (optpoints[i].x < minlist[i].x) {
				drawcircle(crosslayer , CROSSVIEWORIGIN.minuspoint(optpoints[i]), 2, REDSTYLE);
			}
			if (optpoints[i].x > maxlist[i].x) {
				drawcircle(crosslayer , CROSSVIEWORIGIN.minuspoint(optpoints[i]), 2, GREENSTYLE);
			}
			
		}
		
	} else { // ribspacing == "even" and others
		
		for (var i=0; i<maxlist.length; i++){

			optpoints.push(new Point((div*(i)+startx)*editorstate.ribspread,0));
			var ip;
			ip = intersectline(optpoints[i],endpoints[i],  start,end);
			if (ip.x <= cornermax){
				cornerrib = i;
			}
		}
	} 
	// Remove extras?
	if (optpoints.length > endpoints.length) optpoints.pop();
	

	var i=0;
	while (ribstartpoints.length < endpoints.length){
		ribstartpoints.push(optpoints[i]);
		i++;
		// why
	}
	
	return {"angles":angles, "endpoints":endpoints, "optpoints":optpoints, "minlist":minlist, "maxlist":maxlist, "cornerrib":cornerrib, ribstartpoints: ribstartpoints };
}


function getpoints(path,yposlist,debug){
	// Calculate points along svg path. yposlist is an array of y-coordinates. If yposlist is not specified, it will be created and returned. 
	// pathline_intersect() gives a single intersection between two path segments
	// Used for bar lengths and calculating the 3D shape of the body
	if (path.pathSegList.numberOfItems == 0){console.log("getpoints: Empty pathSegList, does path exist?", path);return;}
	// debug=true;
	if (!yposlist){
		if (debug) console.log("no yposlist supplied");
		var yposlist = [0];
		var reuse = false;
	} else {
		if (debug) console.log("yposlist supplied");
		var reuse = true;
		var posi = 0; // index in yposlist to use, incremented in loop
	}

	var xposlist = []; // This is the output
	var px=[], py=[]; // Control points rearranged for segmemt intersection calculator
	var bbox = path.getBBox();
	var height = bbox.height;
	// var seglist = path.pathSegList; // Go negative from here
	
	var seglist = path.pathSegList;
	
	var pos = yposlist[0]; // Go negative from here
	var endy = pos-height;
	if (debug) console.log("height pos", bbox,pos, endy);
	var startx = 10; // debug line coordinate, nothing to worry about
	var endx = startx - bbox.width - 50;
	var curseg = 0; 

	var seg0 = seglist.getItem(0);

	var abspos = new Point(seg0.x, seg0.y);
	// console.log("abspos",abspos);
	var segstart = new Point(0,0);
	var lx = [endx,startx];
	var ly = [];
	var lastinterx = 0;
	var LTRS = "MCLHVZSQTA";
	var segends=[0];
	var ab = ["filler"];
	var ac = 0.1; // Variable accuracy begins at this value

	var lenseglist = seglist.numberOfItems;
	if (debug) console.log("lenseglist",lenseglist, seglist._list.length);
	for (var i=1; i<lenseglist;i++){
		var seg = seglist.getItem(i);
		// Calculate "absolute" coordinates for each segment (relative to 0,0)
		if (LTRS.indexOf(seg.pathSegTypeAsLetter) > 0){
			// Path segment is absolute already
			if (debug) console.log("absolute segment",i);
			segends.push(seg.y - seg0.y);
			if (debug) console.log("segend",seg.y);
			ab.push({px: 
						[segstart.x,
						 seg.x1 - seg0.x,
						 seg.x2 - seg0.x,
						 seg.x - seg0.x],
					 py:
						[segstart.y,
						 seg.y1 - seg0.y,
						 seg.y2 - seg0.y,
						 seg.y - seg0.y]
					 });
			segstart = new Point(seg.x - seg0.x, 
								 seg.y - seg0.y);
		} else {
			// Path segment is relative
			if (debug) console.log("relative segment",i);
			segends.push(segends[i-1]+seg.y);
			ab.push({px: 
						[segstart.x, 
						 segstart.x + seg.x1,
						 segstart.x + seg.x2,
						 segstart.x + seg.x],
					 py:
						[segstart.y,
						 segstart.y + seg.y1,
						 segstart.y + seg.y2,
						 segstart.y + seg.y]
					 });
			segstart = segstart.move(seg.x, seg.y);
		}
		
	}
	if (debug) console.log("segends",segends);
	if (debug) console.log("ab",ab);
	function whichseg (yp){
		for (var i=0; i<segends.length;i++){
			if (yp > segends[i]){
				return i;
			}
		}
		// return 1;
	}
	var shouldbe = whichseg(pos);
	// if (debug) shouldbe = 1;
	var lenseglist = seglist.numberOfItems;
	if (debug) console.log("pos", pos, endy,shouldbe );
	while (pos >= endy && shouldbe < lenseglist){
		// if (debug) console.log("pos",pos,"seg", shouldbe);
		// intersect horizontal line with current segment
		ly = [pos,pos]; // Always a horizontal line of standard length
		if (debug) drawline(getelid("formlayer"),
					[abspos.move(endx, pos),abspos.move(startx, pos)]);
		// Try to get intersection
		// if (debug) console.log(ab[shouldbe]);
		// TODO: For arc segments, use different intersecting method
		
		/* if (seg.pathSegTypeAsLetter == "a" || seg.pathSegTypeAsLetter == "A"){
			if (debug) console.log("pathline A");
			var inter = arc_intersect(ab[shouldbe].px,ab[shouldbe].py,lx,ly, seg);
		} else if (seg.pathSegTypeAsLetter == "l"){
			// TODO: use existing line intersect function
		} else { // Bezier segment
			// var inter = computeIntersections(px,py,lx,ly, true);
			var inter = computeIntersections(ab[shouldbe].px,ab[shouldbe].py,lx,ly);
		} */
		
		var inter = computeIntersections(ab[shouldbe].px,ab[shouldbe].py,lx,ly);
		if (isNaN(inter.x) || inter.x > 0.0){
			if (debug) console.log("NaN", pos, shouldbe);
			xposlist.push(0.0);
		} else {
			xposlist.push(inter.x);
		}
		
		if (debug) drawcircle(getelid("formlayer"), abspos.addpoint(inter), 1,"","inters-"+path.id+pos.toFixed(1));

		if (reuse) { // Reuse given yposlist. get next position.
			if (debug) console.log("Did position", posi, shouldbe, yposlist[posi].toFixed(0), inter.x.toFixed(0));
			posi++;
			pos = yposlist[posi];
		} else {
			// calculate y interval to next intersection based on previous intersection distance to the one before that (start tiny, then wide, then go medium towards end)
			if (xposlist.length <= 2 ){
				pos -= ac;
			} else {
				// Vary y interval based on slope of curve
				var i = xposlist.length-1;
				var angle = -Math.abs(Math.atan((xposlist[i-1]-xposlist[i-0])
										       /(yposlist[i-1]-yposlist[i-0])));
				pos = pos - accuracy * Math.cos(angle);
				// console.log("pos",accuracy * Math.cos(angle), pos);
				if (pos < endy){
					pos=endy;
				}
			}
			yposlist.push(pos);
		}
		shouldbe = whichseg(pos);
		if (debug) console.log("shouldbe", shouldbe);
	}
	// if last ypos is NaN or same as previous, remove them
	while(yposlist[yposlist.length-1] == yposlist[yposlist.length-2] || isNaN(yposlist[yposlist.length-1])){
		yposlist.pop();
	}
	while (xposlist.length > yposlist.length){ 
		// If this results in an xposlist that's too long, shorten it
		xposlist.pop();
	}
	if (xposlist.length < yposlist.length){
		xposlist.push(0.0); // Make lists the same length and end at 0,height
	}
	
	// xposlist.push(0.0); // Make lists the same length and end at 0,height
	return {X:xposlist, Y:yposlist};
}























