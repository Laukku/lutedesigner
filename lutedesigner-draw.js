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
// High level drawing functions for lutes
// - Lute calculations
// - Functions for drawing the lute in SVG


///////////////////////////////////////////////////////////////////////////////
// Lute calculations
///////////////////////////////////////////////////////////////////////////////

function drawtest_circle(f){
	console.log("Begin drawtest");
	var r = 50;
	var d = 30;
	var p0 = new Point(0,0);
	var north = p0.move(0,-r);
	var south = p0.move(0,r);
	var east = p0.move(r);
	var west = p0.move(-r);
	
	var ne = p0.move(d,-d);
	var se = p0.move(d,d);
	var sw = p0.move(-d,d);
	var nw = p0.move(-d,-d);
	var ar = [north,ne,east,se,south,sw,west,nw];
	// drawshape(getelid("frontview"),[startp,cp1],GREENSTYLE);
	drawcircle(getelid("frontview"), p0, 2, BLUESTYLE);
	
	for (var i=0; i< ar.length; i++){
		drawcircle(getelid("frontview"), ar[i], 1, BLUESTYLE);
		var a = normangle(p0,ar[i])-Math.PI*8;
		var np = p0.moveangle(r*((i+1)/10), a);
		drawshape(getelid("frontview"),[p0,np],GREENSTYLE);
		console.log(i,a,np);
	}

}
function drawtest(){
	// Draw cross-section as a bezier curve
	// Finding body 3d shape based on this might be faster than using line segments?
	console.log("Begin drawtest");
	var p0 = CROSSVIEWORIGIN;
	var cr = getelid("crosslayer");
	var d3 = lute3d.ribpaths.threedee;
	var o = lute3d.ribpaths.offsets;
	var w = getlast(lute3d.ribs.endpoints).x;
	var h = cps.depth;
	// Perfect circle quadrant as a bezier command, radius 100:
	// m 0,0 c 0,-55.228474		44.77152,-100	100,-100
	var cpl = 0.55228474; // cplength*radius if 90deg circle segment
	var cpa = 0.3212368916123159; // percentage of angle
	var hc = editorstate.bulge-1.0; // A decent match except for absurd values of bulge, like > 2.6
	// should be affected by h? h/w?
	var wc = 1.0;
	var p1 = p0.move(-w);
	var cp1 = p1.move(0,-h*cpl*hc);
	var p2 = p0.move(0,-h);
	var cp2 = p1.move(w*(1-cpl*wc), -h);

	var d = [p1, p2.bezier(cp1,cp2)];
	drawshape(cr,d,GREENSTYLE,"cross-section-bezier",false);
	
	// Semicircle radius 50
	// m 0,0 c 0,-27.614237 22.385759,-50 50,-50 c 27.61423,3e-6 50,22.385763 50,50
	
	// Flattened to 40 on y axis
	// m 0,0 c 0,-22.09139 22.385759,-40 50,-40 c 27.61423,2e-6 50,17.90861 50,40
	
	
	
}



function calcfrets(mensur,temp, number_of_frets){
	//15
	var temp = 0; // Only equal in this version
	var temps = [];
	temps[0] = ["none",5612.5,10910,15910.5,20630,25084.5,29289.5,33258,37004,40539.5,43877,47027,50000];
	var number_of_frets = number_of_frets ? number_of_frets : 12;
	var fretlist = [];
	for (var i=0;i<=number_of_frets;i++){
		// console.log(i);
		// Write resulting fret positions
		if (i <= 12){
			v = Math.floor((mensur * temps[temp][i]) /1000)/100;
			if (isNaN(v)) {v = " ";}
			fretlist.push(v);
		} else {
			v = Math.floor((mensur * temps[temp][i-12]) /1000)/200+fretlist[12];
			if (isNaN(v)) {v = " ";}
			fretlist.push(v);
		}
	}
	return fretlist;
}

function calculatestrings(){
	// Calculate string spacings at the nuts and bridge
	var e = editorstate;
	var uppernutwidth=0;
	// TODO: upper nut, many nuts?
	// return an array, [fingerboard, nut1, nut2, nut3] one for nut, one for bridge
	var bridge = [[]];
	var nuts = [[]];
	
	var bridgepositions = [];
	var nutpositions = [];
	var basspositions = [];
	var bridgefirstbass = 0;
	// Number of courses per each nut, are they single
	var s = [{courses:e.fingerboardcourses,
			  single:e.singlestrings}]; 
	var bnut = 1;
	// Find the bass string groups/nuts from editorstate
	while (e["courses_" + bnut] && bnut < editorstate.numbernuts){
		var singles = e["singles_" + bnut] === true ? true: false;
		s.push({courses : e["courses_" + bnut],
				single: singles});
		bnut++;
	}
	// console.log(s);
	// Do fingerboard courses first
	for (var i=0; i<parseInt(e.fingerboardcourses); i++){
		if (i>0){
			var prevb = getlast(bridge[0]);
			var prevn = getlast(nuts[0]);
			if (i <= e.chanterelles) {
				prevb += Math.abs(e.distchanterellesbridge-e.distcoursesbridge);
				prevn += Math.abs(e.distchanterellesnut-e.distcoursesnut);
			}
			if (i < e.chanterelles || e.singlestrings){
				// if single string
				bridge[0].push(prevb + e.distcoursesbridge);
				nuts[0].push(prevn + e.distcoursesnut);
				// console.log("chanterelle",i);
			} else {
				// Double strings
				bridge[0].push(prevb+e.distcoursesbridge);
				bridge[0].push(prevb+e.distcoursesbridge+e.diststringsbridge);
				if (i > 6){
					nuts[0].push(prevn+e.distbasscoursesshortnut);
					nuts[0].push(prevn+e.distbasscoursesshortnut+e.diststringsnut);
				} else {
					nuts[0].push(prevn+e.distcoursesnut);
					nuts[0].push(prevn+e.distcoursesnut+e.diststringsnut);
				}
				
			}
		} else { // First string i=0
			if (i < parseInt(e.chanterelles) || e.singlestrings){
				// if single string
				bridge[0].push(0);
				nuts[0].push(0);
				// console.log("chanterelle first",i);
			} else {
				bridge[0].push(0);
				bridge[0].push(e.diststringsbridge);
				nuts[0].push(0);
				nuts[0].push(e.diststringsnut);
				// console.log("double first",i);
			}
		}
	
	}
	var bridgelastfingerboardcourse = getlast(bridge[0]);
	// Do all bass nuts
	for (var b=1; b < s.length; b++){	
		// nut distances should not be relative to fingerboard courses, but the first bass course on each nut
		nuts.push([]);
		bridge.push([]);
		for (var i=0; i<s[b].courses; i++){
			
			
			if (i == 0){ // First of this set
				var prevb = getlast(bridge[b-1]); // Get previous string positions from previous set
				var prevn = 0; // nuts start from 0 since they are not right next to each other
				bridge[b].push(prevb + e.distbasscoursesbridge);
				nuts[b].push(prevn);
				if (!s[b].single){
					bridge[b].push(prevb + e.distbasscoursesbridge + e.diststringsbridge);
					nuts[b].push(prevn + e.diststringsnut);
				}
				
			} else { // other courses
				var prevb = getlast(bridge[b]);
				var prevn = getlast(nuts[b]);
				bridge[b].push(prevb + e.distbasscoursesbridge);
				nuts[b].push(prevn + e.distbasscoursesnut);
				if (!s[b].single){
					bridge[b].push(prevb + e.distbasscoursesbridge + e.diststringsbridge);
					nuts[b].push(prevn + e.distbasscoursesnut + e.diststringsnut);
				}
			}
			
			
		}
		
	}
	// console.log({"bridgewidth" : getlast(getlast(bridge)),
			// "nuts" : nuts, 
			// "bridge" : bridge});
	return {"bridgewidth" : getlast(getlast(bridge)),
			"nuts" : nuts, 
			"bridge" : bridge};
}

///////////////////////////////////////////////////////////////////////////////
// High level drawing functions
///////////////////////////////////////////////////////////////////////////////
function decidesize(drawing, frontview,sideview){
	// Gather information about the instrument to be drawn and set origins and drawing dimensions accordingly

	var zeropoint = new Point(300,300);
	// Get body element from the svg or create it, and redraw it
	// if (!currentbody.trebleside == undefined){
		// Not first time, paths already exist
		// var side = currentbody.side;
		// addel(frontview,side);
		// var trebleside = currentbody.trebleside;
		// addel(frontview,trebleside);
		// var middle = currentbody.middle; 
		// addel(frontview,middle);
		
	// } else {// First time with this body
		// Set currentbody depending on body construction method
		var name = editorstate.bodyshapefromlist || "venere";
		if (getelid("bodyshapefrom").value == "fromlist"){
			// Use neckC historical model
			
			var edge = bodylist[name].side;
			var mid = bodylist[name].middle;
		} else { // Classical construction
			var edge = makeclassicalpreset();
			var mid = makeclassicalpreset();
			
		}
		// apply body scaling
		
		var side = copyelement(frontview, edge, zeropoint,THINSTYLE); 
		scalepath(side, editorstate.bodyscale);
		var trebleside = mirrorpath(frontview,side); // Mirror path d coordinates, maintain first point, return new path
		// console.log("mid",mid);
		var middle = copyelement(sideview, mid, zeropoint,THINSTYLE); 
		scalepath(middle, editorstate.bodyscale);
		// console.log("middle",middle);
		currentbody = {"side":side,"trebleside":trebleside,"middle":middle};
		// Delete handles
		editable_paths = {};
		// var handles = getelid("handlelayer");
		// delchildren(handles);
		cps.height = side.getBBox().height;
		cps.width = side.getBBox().width;
		// console.log("side", side);
	// }

	DRAWINGHEIGHT = editorstate.mensur+160;
	var m=1;
	while (editorstate["mensur_"+m] && m < parseInt(editorstate.numbernuts)){
		DRAWINGHEIGHT = getmensur(m)+250;
		m++;
	}
	
	// TODO: make DRAWINGWIDTH wider if form is drawn
	DRAWINGWIDTH = 100+cps.width*4
	// DRAWINGWIDTH = 750;

	FRONTVIEWORIGIN = new Point(80+cps.width,DRAWINGHEIGHT-20);
	if (editorstate.drawingpurpose == "concept"){
		SIDEVIEWORIGIN = FRONTVIEWORIGIN.move(cps.width*2+30);
	} else {
		SIDEVIEWORIGIN = FRONTVIEWORIGIN.move(cps.width*3+20);
	}
	
	if (parseInt(editorstate.numbernuts) > 1){
		INFOBOXORIGIN = new Point(FRONTVIEWORIGIN.x+70,10);
		CROSSVIEWORIGIN = new Point(FRONTVIEWORIGIN.x+cps.width+70,170+cps.width);
	} else {
		CROSSVIEWORIGIN = new Point(FRONTVIEWORIGIN.x+cps.width+100,70+cps.width);
		INFOBOXORIGIN = new Point(10,10);
	}
	DETACHEDORIGIN = new Point(70,150);
	NECKBLOCKORIGIN = CROSSVIEWORIGIN.move(0,60);
	FORMORIGIN = new Point(SIDEVIEWORIGIN.x+20, 10);
	
	// Put side and middle in their proper places
	// console.log("before movepath in decidesize",middle);
	// console.log("before movepath in decidesize",middle.pathSegList);
	movepath(middle,SIDEVIEWORIGIN);
	// console.log("after movepath in decidesize",middle);
	movepath(trebleside,FRONTVIEWORIGIN);
	movepath(side,FRONTVIEWORIGIN);
	// Move classical construction debug layer on top of frontview if it exists
	var debl = getelid("construction-debug");
	if (debl !== null){
		move(debl, FRONTVIEWORIGIN);
	}
	// Add existing lute frontview for comparison
	if (editorstate.presetoverlay){
		var comparison = bodylist[name].side;
		var sidecompar = copyelement(frontview, comparison, zeropoint,REDSTYLE); 
		movepath(sidecompar,FRONTVIEWORIGIN);
	}
	
	// Does this need to be enabled the first time the editor is run?:
	// drawing.setAttribute("viewBox","0 0 "+DRAWINGWIDTH+" "+DRAWINGHEIGHT);
	// For drawing coordinates next to mouse cursor
	pt = drawing.createSVGPoint();
	zpt = drawing.createSVGPoint();
	// TODO: Get uunits (mm) to px scale for drawing text in a legible size
	// svg element height vs DRAWINGHEIGHT
	drawing.onmousemove = mousecoords;
	drawing.onmousedown = mousecoords;
	drawing.onmouseup = mousecoords;
	// Adjust viewbox to current zoom level
	// console.log(zoom_data);
	if (!drawing.getAttribute("viewBox")) {
		drawing.setAttribute("viewBox","0 0 "+DRAWINGWIDTH+" "+DRAWINGHEIGHT);
	}
	
}
function makeclassicalpreset(){
	// Classical construction
	// Create editable paths made up of circle segments to be used as the body front view in the editor
	
	// TODO: Body size depends on string length, but should also be separable from it -> Option for how many frets on neck. editorstate.fretsonneck
	
	// TODO: Different presets Zwolle, Frei, Archlute...
	// HistoricalLuteConstruction007.png, 033
	
	// Zwolle: bridge at 1/6 of body length, rosette halfway between bridge and end of body, 
	// Mersenne: Divide body by 8. Neck length is 5/8 or from butt end to middle of rosette.
	
	
	// Note that calculations are made first with the centerline on the X axis of a regular Cartesian coordinate system where up is +y, right is +x, as opposed to svg coordinates. The bottom touches the origin.
	console.log("Making a renaissance body");
	// integer ratios from the golden age of numerology
	var debugl = makegroup(getelid("frontview"), "construction-debug"); // This group will be moved to its correct position later
	var debugname ="cl-debug-";
	function debugcircle (p, name){
		// name is required
		if (p){
			drawcircle(debugl, new Point(-p.y, -p.x) /* FRONTVIEWORIGIN.move(-p.y, -p.x).move(27,-49) */, 2, REDSTYLE, name?debugname+name:"");
		}
	}
	function debugline(p1,p2, name){
		// name is required
		drawline (debugl,[new Point(-p1.y, -p1.x), new Point(-p2.y, -p2.x)], BLUESTYLE, name?debugname+name:"");
	}
	
	// Full length of instrument divided in 9, or string length divided in 8
	var mensur = parseFloat(editorstate.constructionmensur) || parseFloat(editorstate.mensur) || 600;
	var unit = mensur/8.0;
	var total_length = mensur + unit; // 9 units
	var eighth = unit*6.0; // 8th fret from p1
	var bottomr = unit*parseFloat(editorstate.constructionbottom) || 9.0*unit; // TODO: Make adjustable, 5--inf
	var sider = unit*parseFloat(editorstate.constructionside) || 6.0*unit; // TODO: make adjustable, 5--7
	var smallr = unit*parseFloat(editorstate.constructionsmall) || unit * 5/4.0; // TODO: make adjustable, 1--2
	var shoulderr = unit*parseFloat(editorstate.constructionshoulder) || 0.0; 
	var shoulderl = unit*parseFloat(editorstate.constructionshoulderlength) || 0.0; // actually reduction
	// var helperc = 5.0*unit; // circle centered on this division is used to find center of side circle
	var bodywidth = unit*parseFloat(editorstate.constructionwidth) || 4.0*unit;
	var bodylength = unit*parseFloat(editorstate.constructionlength) || 6.5*unit;
	var wedge = parseFloat(editorstate.constructionwedge) || 0.0; // wedge angle in degrees
	var doshoulder = false;
	if (shoulderr > 0.0 && shoulderl > 0.0){
		doshoulder = true;
	}
	
	// Circle centers:

	// Side long segment with radius sider: End at (0, 6.5), find center: Where circle with this point as center intersects y= width/2 - sider
	var y = bodywidth/2 - sider;
	var x = bodylength - Math.sqrt(sider**2-y**2);
	var widestp = new Point(x, bodywidth/2); // Not really
	var sidec = new Point(x, y); 
	
	var bottomc = new Point(bottomr, 0.0); // radius of bottom circle determines its center position
	console.log("side circle center:", sidec);
	
	// Calculate center of small circle. Its center is where side and bottom arcs reduced by small arc radius intersect.
	var siderr = sider-smallr; // These are used to calculate center of small circle
	var bottomrr = bottomr-smallr;
	var sidecircles = new Circle(sidec, siderr); 
	var bottomcircles = new Circle(bottomc, bottomrr);
	var smallc = intersect_circle_above(sidecircles,bottomcircles);
	console.log(bottomcircles,sidecircles);
	var smallcircle = new Circle(smallc, smallr);
	var sidecircle = new Circle(sidec, sider); 
	var bottomcircle = new Circle(bottomc, bottomr);	
	
	if (doshoulder) {
		// Find shoulder arc termination point and center, and redefine side arc endpoint
		var shoulderp = new Point(bodylength-shoulderl, 0);
		var sideshoulderr = sider - shoulderr;
		var sideshouldercircle = new Circle(sidec, sideshoulderr);
		var shouldercircle = new Circle(shoulderp, shoulderr);
		var shoulderc = intersect_circle(sideshouldercircle, shouldercircle);
		// circle intersection, but alter so that one circle is above the other
		// var d = Math.sqrt((sidec.x-shoulderp.x)**2 + (sidec.y-shoulderp.y)**2);
		// TODO: Choose higher shoulder intersection
		if (shoulderc[0].y > shoulderc[1].y){
			shoulderc = shoulderc[0];
		} else {
			shoulderc = shoulderc[1];
		}
		debugcircle(shoulderc, "shoulderc");
		debugcircle(shoulderp, "shoulderp");
		console.log("shoulder circles:", sideshouldercircle, shouldercircle);
		console.log("shoulder arc center:", shoulderc);
		console.log("small", smallc);
		var shouldercircle = new Circle(shoulderc, shoulderr);
		// Intersection of side and shoulder circles
		// var shoulderstart = intersect_circle(sidecircle, shouldercircle);
		// line from sidec through shoulderc intersects side arc
		var m = (shoulderc.y-sidec.y) / (shouldercircle.x-sidec.x);
		var k = (-m*shoulderc.x + shoulderc.y - sidec.y);
		var a = m**2+1; // abc of quadratic formula
		var b = 2*k*m - 2*sidec.x;
		var c = k**2 - sider**2 + sidec.x**2;
		var x2 = (-b + Math.sqrt(b**2 - 4*a*c)) / (2*a);
		var y2 = m*x2 - m*shoulderc.x + shoulderc.y;
		var shoulderstart = new Point(x2,y2); // side arc ends here, shoulder starts
		
		console.log("shoulder arc start:", shoulderstart);
		debugcircle(shoulderstart, "shoulderstart0");
	}
	
	
	
	
	// debugcircle(shoulderstart[1], "shoulderstart1");
	// Calculate intersection of bottom and small circle
	// TODO: It is possible that rounding errors will cause these circles to not actually touch by just a little bit, so maybe use lines instead?

	// bottom circle end point: Where line from bottomc through smallc intersects bottom circle. Create line function.
	var m = (smallc.y-bottomc.y) / (smallc.x-bottomc.x);
	var k = (-m*smallc.x + smallc.y - bottomc.y);
	var a = m**2+1; // abc of quadratic formula
	var b = 2*k*m - 2*bottomc.x;
	var c = k**2 - bottomr**2 + bottomc.x**2;
	var x2 = (-b - Math.sqrt(b**2 - 4*a*c)) / (2*a);
	var y2 = m*x2 - m*smallc.x + smallc.y;
	var ibs = new Point(x2,y2);
	// debugcircle(ibs2);
	// var ibs = intersect_circle_above(bottomcircle,smallcircle);
	// Get intersection of line from sidec thru  with side circle
	var m = (smallc.y-sidec.y) / (smallc.x-sidec.x);
	var k = (-m*smallc.x + smallc.y - sidec.y);
	var a = m**2+1; // abc of quadratic formula
	var b = 2*k*m - 2*sidec.x;
	var c = k**2 - sider**2 + sidec.x**2;
	var x3 = (-b - Math.sqrt(b**2 - 4*a*c)) / (2*a);
	var y3 = m*x3 - m*smallc.x + smallc.y;
	var iss = new Point(x3,y3);
	// var iss = intersect_circle_above(sidecircle,smallcircle);
	// debugcircle(ibs);
	
	console.log("ibs", ibs);
	// console.log("iss2", iss2);
	console.log("iss", iss);
	// Calculate where side circle intersects X axis; Should be around (6.5, 0) or just right of 8th fret. Use higher x coordinate from two possibilities
	var x4 = sidec.x + Math.sqrt(sider**2-(0-sidec.y)**2);
	var endp = new Point(x4, 0);
	
	
	// insert wedge between sides to get a wider body, rotate all numbers except first. Use bottomc point as rotation origin.
	/* for (var i=1; i< body.length; i++){
		// Calculate distance from bottomc to each point	
		var d = Math.sqrt((bottomc.x-body[i].x)**2+()**2);
		// Make array? Do after converting to svg coordinates?

	} */
	function rotp(center, point, deg){
		// Rotate a point around a center point by angle 
		// Calculate distance from center to point
		var d = Math.sqrt((center.x-point.x)**2 + (center.y-point.y)**2);
		// Find current angle to point
		var angle = Math.asin((point.y-center.y) / d);
		angle += deg*radtodeg; // 0.01745329252
		// Find new coordinates
		var yd = center.y + d*Math.sin(angle);
		var xd = center.x - d*Math.cos(angle);
		return new Point(xd,yd);
		
	}
	// body2 is a non wedge rotated version of the body for debug purposes
	var p1 = new Point(0.0,0.0);//FRONTVIEWORIGIN; // bottom of body
	var body2 = [p1];
	var p2 = new Point(-ibs.y, -ibs.x); // where bottom meets small circle
	body2 = body2.concat(arctobezier(p1,p2,bottomr,true));
	var p3 = new Point(-iss.y, -iss.x); //where small circle meets side
	body2 = body2.concat(arctobezier(p2,p3,smallr,true));
	if (doshoulder){
		var p4 = new Point(-shoulderstart.y, -shoulderstart.x); // where side meets shoulder
		body2 = body2.concat(arctobezier(p3,p4,sider,true));
		var p5 = new Point(-shoulderp.y, -shoulderp.x); // where shoulder meets centerline; endpoint
		body2 = body2.concat(arctobezier(p4,p5,shoulderr,true));
	} else {
		var p4 = new Point(-endp.y, -endp.x); // where side meets centerline; endpoint
		body2 = body2.concat(arctobezier(p3,p4,sider,true));
	}
	drawcircle(getelid("frontview"), new Point(-bottomc.y, -bottomc.x), 2, REDSTYLE, "hello");
	
	// point to rotate around: bottomc. needs to be translated into svg coordinates too.
	// var rp = new Point(-bottomc.y, -bottomc.x);
	
	ibs = rotp(bottomc, ibs, wedge);
	iss = rotp(bottomc, iss, wedge);
	sidep = rotp(bottomc, sidec, wedge);
	smallc = rotp(bottomc, smallc, wedge);
	var wedgep = rotp(bottomc, new Point(0,0), wedge)
	// center point for bottom arc is bottomc
	if (doshoulder){
		shoulderstart = rotp(bottomc, shoulderstart, wedge);
		shoulderp = rotp(bottomc, shoulderp, wedge); // TODO : Maybe find newshoulderp like endp below
	} else {
		// For bottom radiuses less than 6.5 units, a new end point must be calculated because it will go over the centerline otherwise and rotp() doesn't handle that case correctly
		var x4 = sidep.x + Math.sqrt(sider**2-(0-sidep.y)**2);
		endp = new Point(x4, 0);
	}
	
	// Create svg curves in svg coordinates
	var p1 = new Point(0.0,0.0);//FRONTVIEWORIGIN; // bottom of body
	var body = [p1];
	var p2 = new Point(-ibs.y, -ibs.x); // where bottom meets small circle
	body = body.concat(arctobezier(p1,p2,bottomr,true,true));
	var p3 = new Point(-iss.y, -iss.x); //where small circle meets side
	body = body.concat(arctobezier(p2,p3,smallr,true,true));
	if (doshoulder){
		var p4 = new Point(-shoulderstart.y, -shoulderstart.x); // where side meets shoulder
		body = body.concat(arctobezier(p3,p4,sider,true));
		var p5 = new Point(-shoulderp.y, -shoulderp.x); // where shoulder meets centerline; endpoint
		body = body.concat(arctobezier(p4,p5,shoulderr,true));		
	} else {
		var p4 = new Point(-endp.y, -endp.x); // where side meets centerline; endpoint
		body = body.concat(arctobezier(p3,p4,sider,true));
	}
	
	// arctobezier = function (p1,p2,radius_or_center, clockwise, largearc)
	// how to draw arc when its end is not known yet
	
	// Do debug points and lines
	debugcircle(new Point(sidep.x, widestp.y), "widestp");
	debugcircle(wedgep, "wedgep");
	debugcircle(iss, "iss");
	debugcircle(ibs, "ibs");
	debugcircle(bottomc, "bottomc");
	debugcircle(smallc, "smallcenter");
	debugcircle(sidep, "sidecenter");
	debugcircle(new Point(0,0), "zeropoint");
	
	debugline(bottomc,ibs, "bottomctoibs");
	debugline(bottomc,wedgep, "bottomctowedgep");
	debugline(sidep,iss, "sidectoside");

	var el2 = drawshape(getelid("frontview"),body2,GREENSTYLE,"side2",false);
	var el = drawshape(getelid("frontview"),body,THINSTYLE,"side",false);
	makerelative(el);
	
	// TODO: side circle seems to be altered slightly by shoulder, perhaps because shoulderstart is calculated a little bit outside of side arc
	// TODO: Editable register_editable()
	// TODO: Make circle segments editable
	// TODO: Allow a preset body shape to be under/overlaid on classical construction
	return el;
}
function drawfront(frontview,bars){
	
	var bx=FRONTVIEWORIGIN.x;
	var by=FRONTVIEWORIGIN.y;
	// console.log(bodylist["venere"]);
	// var currentbody = [] // side, mirrored, middle, cross
	// If this is the first time the current lute is drawn, currentbody is empty
	
	
	// var edge = getelid("venere-edge");
	// Draw bars
	
	var div = cps.height/editorstate.divisions;
	var sma = (div*2)/3;
	barlist[0] = {type:"bridge",pos:sma*2};
	barlist[1] = {type:"normal",pos:div*2,thickness:4.5,height:12};
	barlist[2] = {type:"normal",pos:div*3,thickness:4.5,height:12};
	barlist[3] = {type:"normal",pos:div*4,thickness:4.8,height:20};
	barlist[4] = {type:"rosette",pos:div*5,thickness:3.0,height:12};
	barlist[5] = {type:"normal",pos:div*6,thickness:4.5,height:17};
	
	// Draw the other side of the body
	
	
	// Draw string band and neck
	var neckjointy = drawneck(frontview);

	// Calculate neckblock lower edge at neckjointy-14
	cps.neckblocky = by-neckjointy-14;
	
	var dist = Math.abs(cps.neckblocky-barlist[5].pos)/3;
	barlist[6] = {"type":"normal","pos":div*6+dist,thickness:4.0,height:14};
	barlist[7] = {"type":"normal","pos":div*6+dist*2,thickness:4.0,height:12};
	barlist[8] = {"type":"neckblock","pos":cps.neckblocky};
	barlist[9] = {"type":"bassbar","pos":sma};
	// Small rosette bars
	barlist[10] = {type:"rosette-small",pos:div*4.5,thickness:3.0,height:9};
	barlist[11] = {type:"rosette-small",pos:div*5.5,thickness:3.0,height:9};
	drawbars(bars,cps.width+100);

	// Draw rosette circle
	var rosettebar = getelid("bar-rosette");
	var rosettew = rosettebar.getBBox().width; 
	var rosettey = rosettebar.getBBox().y;
	// If large body, draw triple rosette instead
	if (editorstate.rosettelist == "triple" ){//rosettew > 300){
		
		var radius = editorstate.rosettescale*(rosettew / 9.0)*0.01;
		var rosetteg = makegroup(frontview, "rosettegroup");
		var rosette1 = drawcircle(rosetteg, {x:bx-radius, y:rosettey}, radius-2, THINSTYLE);
		var rosette2 = drawcircle(rosetteg, {x:bx+radius, y:rosettey}, radius-2, THINSTYLE);
		var rosette3 = drawcircle(rosetteg, {x:bx, y:rosettey-radius*1.5-2}, radius*0.8, THINSTYLE);
		rosettew = (editorstate.rosettescale*(rosettew / 9.0)*0.01)*4;
	} else {
		rosettew = editorstate.rosettescale*(rosettew/6.0)*0.01;
		var rosette = drawcircle(frontview, {x:bx, y:rosettey}, rosettew, THINSTYLE);
		rosette.id = "rosette-circle";
		addelafter(getelid("neck"), rosette);
		rosettew = rosettew*2;
	}
	cps.rosettewidth = rosettew;
	cps.rosettepos = new Point(FRONTVIEWORIGIN.x,rosettey);
	// Draw body centerline
	if (editorstate.drawingpurpose.startsWith("technical")){
		drawline(frontview, [{x:FRONTVIEWORIGIN.x, y:BORDERWIDTH},
							{x:FRONTVIEWORIGIN.x, y:DRAWINGHEIGHT}], 
							GUIDESTYLE,"centerline");
		
	}
	
	if (!editorstate.drawingpurpose.startsWith("technical")){
		bars.style= "display:none";
		
	}
	register_editable(currentbody.middle,currentbody.side,currentbody.trebleside);
}
function drawside(sideview){
	// Draw lute side view
	var bx=SIDEVIEWORIGIN.x;
	var by=cps.bridgey;
	var neckthick = 28;
	
	// Draw soundboard side view with 3mm dip in the middle beginning at barlist[0]
	var start = new Point(bx, currentbody.middle.pathSegList.getItem(0).y+1);
	var bridge = new Point(bx, FRONTVIEWORIGIN.y-barlist[0].pos);
	var rosette = new Point(bx-3, FRONTVIEWORIGIN.y-barlist[4].pos);
	var end = new Point(bx, cps.neckjointy);
	var handlel = Math.abs(bridge.y-end.y)/6;
	
	// Define soundboard sideview path
	var sbpath = [
		start, 
		bridge,
		rosette.bezier(bridge.move(0,-handlel), rosette.move(0,handlel)),
		end.bezier(rosette.move(0,-handlel), end.move(0,handlel)),
		// Same backwards to create top side
		end.move(1.8),
		rosette.move(1.5).bezier(end.move(1.5,handlel), rosette.move(1.5,-handlel)),
		bridge.move(1.5).bezier(rosette.move(1.5,handlel), bridge.move(1.5,-handlel)),
		start.move(1.5)
		]
	var sbtop = drawshape(sideview, sbpath, "","soundboard-side", true);
	
	
	// Intersect middle with neck height
	var tneck = [{x:bx-neckthick, y:by-editorstate.mensur}, 
				 {x:bx-neckthick+0.00000001, y:by}];
	// console.log("drawside", tneck);
	var inter = pathline_intersect(currentbody.middle, tneck)
	if (isNaN(inter.x) || isNaN(inter.y) ) { // No intersection, draw 90 joint
		var neckmid = new Point(bx-neckthick,cps.neckjointy);
	} else { //  Found intersection
		var neckmid = inter;
	}
	cps.neckmid = neckmid; // Save neck intersection for later use
	// Draw bridge sideview
	var brp = new Point(bx+1.5, by);
	var bridge = drawshape(sideview, 
		   [brp,
			brp.move(8,0),
			brp.move(8,8),
			brp.move(1.5,16),
			brp.move(0,16)],
			null,"bridgeside", false);
	// Find height 3.5mm at neck joint
	var neckp = new Point(bx,cps.neckjointy); // neck joint / corner of neck touching soundboard
	// Save for prosperity
	cps.neckjoint_angle = getangle(neckp,neckmid);
	cps.neckjoint_length = linelength(neckp,neckmid);
	cps.neckjoint_no_origin = neckp.minuspoint(SIDEVIEWORIGIN).scale(1,-1);
	cps.neckjoint_end_no_origin = neckmid.minuspoint(SIDEVIEWORIGIN).scale(1,-1);
	
	var stringstart = brp.move(5.5);
	var strmidp = neckp.move(1.7+3.5);
	var angletomidp = getangle(stringstart, strmidp);
	var stringend = stringstart.movedist(-editorstate.mensur, angletomidp);
	// Draw strings sideview
	// var stringend = new Point(bx+3.5, by-editorstate.mensur);
	var strings = drawline (sideview, [stringstart, stringend], NOFILLTHIN,"strings_side");
	// Draw fingerboard top surface
	var fbend = stringend.move(-0.9)
	drawline(sideview, [neckp.move(1.8), fbend],"", "fingerboard-side");
	
	// Draw neck shape
	
	var neckep = fbend.move(-2, -4.5); // Neck end point that never gets drawn
	var neckangle = getangle(neckp, neckep);
	cps.neckangle = neckangle;
	var nutstart = neckep.move(-1.5,-0.2);
	var nuttip = stringend.move(0.2);
	var nutcorner = fbend.move(-3.5);
	
	
	// Draw neck side
	var neckside = drawshape(sideview, 
		   [neckp, // Neck joint soundboard
			neckmid, // Neck joint middle rib
			neckep.move(-21,0), // a point hidden by the pegbox
			nutstart.move(0,0.2),
			nutcorner,
			nutcorner.move(2)], // neck end point
			COVERSTYLE,"neckside", true);
	
	// Draw nut side
	var nutpath = [
		nutstart,
		nuttip.bezier(nutstart.move(2), nuttip.move(0,-3)),
		nutcorner
	]
	var nut = drawshape(sideview, nutpath, COVERSTYLE, "nut-side", true);
	
	// TODO: Loop draw other nuts and strings
	
	
	
	// Add endclasp on top of body sideview
	var e = new Point(SIDEVIEWORIGIN.x, SIDEVIEWORIGIN.y);
	// Scale depending on end.y or side height
	var m = new Point(SIDEVIEWORIGIN.x-0.5, by-40);
	// Intersect middle with neck height
	var templ = [{x:e.x-45, y:0}, 
				 {x:e.x-45, y:DRAWINGHEIGHT}];
	// console.log("drawside templ ",templ);
	var ip = pathline_intersect(currentbody.middle, templ);
	// console.log("drawside templ ip",ip);
	// TODO: Find intersection with ~4th rib and match that point with end clasp point
	var cu = ip.move(5,-7)
	var endclasp = drawshape(sideview, 
		   [e.move(0,1),
			ip.move(0,1).bezier(e.move(-10,1), ip.move(10,2.5)),
			ip.move(0,-4),
			cu.bezier(ip.move(1,-4),cu.move(-1,3)),
			m.move(-27,30), //.relbezier(-6,40,-8,40), // TODO: move a bit so nice
			m.move(-13,10).relbezier(-7,27,8,25),	m],
			COVERSTYLE,"endclasp-side", true);
	
}

function drawpegbox(frontview,sideview,detached){
	// Draw pegbox front and side
	var side = new Point(SIDEVIEWORIGIN.x-5, cps.bridgey-editorstate.mensur-4.5);
	var front = new Point(FRONTVIEWORIGIN.x, FRONTVIEWORIGIN.y);
	
	var n = 1;
	while (editorstate["mensur_"+n] && n < parseInt(editorstate.numbernuts)){
		// Draw bass string on sideview

		var bx=SIDEVIEWORIGIN.x;
		var by=cps.bridgey;
		var bo = new Point(SIDEVIEWORIGIN.x+7, cps.bridgey);
		var stringend = new Point(bo.x, cps.bassnuts[n-1].y);
		var stringb = drawline (sideview,[bo,stringend], "","bass_strings_side_"+n);
		n++;
	}
	
	if (editorstate.pegboxstyle == "renaissance" || editorstate.pegboxstyle ==  "chanterelle" || editorstate.pegboxstyle == "bassrider"){
		// console.log(editorstate.pegboxstyle);
		// Regular renaissance pegbox
		var wideblocklength = 18;
		var endblocklength = 12;
		var spacing = 11.5;
		var wideblockheight = 20;
		var endblockheight = 16;
		// Calculate
		var pangle_deg = 8;
		var pangle = pangle_deg * 0.01745329252; // Convert 8 deg to radians. Pegbox angle.
		
		if (editorstate.singlestrings){
			var doubl = 1;
		} else {
			var doubl = 2;
		}
		
		var plength = wideblocklength+endblocklength+spacing*((editorstate.fingerboardcourses*doubl-editorstate.chanterelles)+0.5);
		var pegholes = editorstate.fingerboardcourses*doubl-editorstate.chanterelles;
		// Decide if there should be a chanterelle rider
		if (editorstate.pegboxstyle=="chanterelle" || editorstate.pegboxstyle=="bassrider" ){
			plength-=spacing;
			pegholes-=1;
		}
		
		var p1 = {x:plength*Math.cos(pangle), y:plength*Math.sin(pangle)};
		var p2 = {x:endblockheight*Math.sin(pangle), y:endblockheight*Math.cos(pangle)};
		
		var toplength = Math.sqrt(Math.abs( ((side.x-p1.x+p2.x)-(side.x))**2 +
										   ((side.y+wideblockheight- p1.y-p2.y)-(side.y) )**2 ));
		
		// Draw side view
		var widetop = side;
		var widebottom = side.move(0,wideblockheight);
		var endbottom = widebottom.minuspoint(p1);
		var endtop = endbottom.move(p2.x, -p2.y);
		
		var pegboxside = drawshape(sideview, 
		   [widetop,widebottom,	endbottom,endtop],
			COVERSTYLE,"pegboxside", true);
		// Pegbox bottom
		var pegboxbot = drawline(sideview, 
			[widebottom.move(0,-2),
			endbottom.movedist(2,pangle-Math.PI)],
			NOFILLTHIN,"pegbox-side-bottom");	
		// Wider end block
		var w1 = widebottom.move(0,-2).movedist(wideblocklength, -pangle-Math.PI/2);
		var wendb = drawshape(sideview, 
			[w1, 
			w1.movedist(wideblockheight/2.0, -pangle-Math.PI),
			widetop],
			GUIDESTYLE,"pegbox-side-wendb",false);	
		// Endy McEndBlockerson
		
		var endb = drawline(sideview, 
			[endtop.movedist(-endblocklength,-pangle-Math.PI/2), 
			endbottom.movedist(2,-pangle-Math.PI).movedist(-endblocklength,-pangle-Math.PI/2)],
			GUIDESTYLE,"pegbox-side-endb",false);	
		// Draw peg holes on the side of the pegbox
		// Half of top surface angle and bottom surface angle
		var pegrowa = (getangle(widebottom,endbottom)+getangle(widetop,endtop))/2.0;
		var ph1 = widebottom.movedist(wideblocklength+spacing/2.0,-pangle-Math.PI/2).movedist(-wideblockheight/2, pangle);
		var radius = 3;
		for (var i=0; i< pegholes; i++){
			if (i%2==0){radius=3.5} else {radius=2.5}
			drawcircle(sideview, ph1.movedist(-spacing*i, pegrowa),radius, 
							THINSTYLE,"peg-hole-"+i);
		}
		
		
		// Draw top view on the lute frontview
		
		var nutangle = cps.nutangle;
		// var nutangle = -1.569707751868157;
		var neckmid = new Point(cps.neckmid.x, cps.neckmid.y);
		var p = p1.y*0.9;
		
		var midp = {x:p*Math.cos(nutangle), y:p*Math.sin(nutangle)};
		var lp = {x:midp.x-10*Math.sin(nutangle), y:midp.y+10*Math.cos(nutangle)};
		var rp = {x:midp.x+10*Math.sin(nutangle), y:midp.y-10*Math.cos(nutangle)};

		var pegboxfront = drawshape(frontview, 
		   [cps.ext1,
		   {x:cps.nutmid.x-rp.x, y:cps.nutmid.y+rp.y},
			{x:cps.nutmid.x-lp.x, y:cps.nutmid.y+lp.y},
			cps.ext2],
			THINSTYLE,"pegboxfront", false);
		addelbefore(getelid("neck"),pegboxfront);

		
		if (editorstate.drawingpurpose != "concept"){

		// Draw detached top view of pegbox
		var edgew = plength-toplength;
		// console.log(edgew,toplength,plength);
		var pw = Math.sqrt((cps.ext1.x-cps.ext2.x)**2-(cps.ext1.y-cps.ext2.y)**2); // distance from extx1,y to extx2,y?
		// console.log(pw); // Width of pegbox wider end
		var dor = new Point(DETACHEDORIGIN.x, DETACHEDORIGIN.y);
		var tr1 = new Point(dor.x-pw/2, dor.y+edgew);
		var tr2 = new Point(dor.x-11, dor.y+toplength);
		var tri1 = new Point(dor.x-pw/2+10, dor.y+edgew);
		var tri2 = new Point(dor.x-11+6, dor.y+toplength);
		
		var ba1 = new Point(dor.x+pw/2, dor.y+edgew); 
		var ba2 = new Point(dor.x+11, dor.y+toplength);
		var bai1 = new Point(dor.x+pw/2-10, dor.y+edgew); 
		var bai2 = new Point(dor.x+11-6, dor.y+toplength);
		// This is the glue joint of the pegbox as viewed from above
		var tr1e = new Point(tr1.x, dor.y);
		var ba1e = new Point(ba1.x, dor.y);
		var trie = new Point(tri1.x, dor.y);
		var baie = new Point(bai1.x, dor.y);
		drawshape(detached,[tr1,tr1e,ba1e,ba1],
				THINSTYLE,"pegbox-detached-joint", false);
		// Little edges lines on the glue joint
		drawline(detached, [tri1,trie],"","pegbox-jlinet");
		drawline(detached, [bai1,baie],"","pegbox-jlineb");
		// The pegbox proper
		drawshape(detached,[tr1,tr2,ba2,ba1],
				THINSTYLE,"pegbox-detached", true);
		drawshape(detached,[tr1,tr2,tri2,tri1],
				THINSTYLE,"pegbox-treble-side", true);
		drawshape(detached,[ba1,ba2,bai2,bai1],
				THINSTYLE,"pegbox-bass-side", true);
		// Intersect all the things!
		// intersect top block bottomline to get lower corners
		// var tri = {"x":tr.x, "y":tr.y, "x2":tr.x2, "y2":tr.y2};
		var inter1 = intersectline( {x:tr1.x+10, y:tr1.y}, 
									{x:tr2.x+6, y:tr2.y},
									{x:20, y:dor.y+18}, 
									{x:300, y:dor.y+18.000000000001});
		var inter2 = intersectline( {x:tr1.x+10, y:tr1.y}, 
									{x:tr2.x+6, y:tr2.y},
									{x:20, y:dor.y+plength-endblocklength}, 
									{x:300, y:dor.y+plength-endblocklength-0.000000000001});
		// drawline(detached, 20, dor.y+18, 300, dor.y+18,"","pegbox-inside-treble");
		var bassup = {x:dor.x+(dor.x-inter1.x), y:inter1.y};
		var basslo = {x:dor.x+(dor.x-inter2.x),y: inter2.y};
		
		drawshape(detached, [tri1,inter1,bassup,bai1],
				THINSTYLE,"pegbox-upper-block", true);
		drawshape(detached,[inter2,tri2,bai2,basslo],
				THINSTYLE,"pegbox-lower-block", true);
		
		for (var i = 0; i<pegholes; i++){
			var pos = wideblocklength+2+0.5*spacing+spacing*i;
			// intersect with one edge
			// console.log(tr1,tr2);
			var ip = intersectline(tr1, tr2, 
								{x:20, y:dor.y+pos}, 
								{x:300, y:dor.y+pos+0.00000000001});
			var thin = {"x":ip.x, "y":ip.y};
			var thick = {"x":dor.x+(dor.x-ip.x), "y":ip.y};
			if (i%2==0){
				thick.x = thick.x+10;
				
			} else {
				thin.x = thin.x-10;
			}
			
			var pegline = drawline(detached, [thin,thick],"","pegbox-pegcenterline-"+i);
		}
		}
		// Draw the chanterelle rider
		if (	editorstate.pegboxstyle=="chanterelle" 
			||	editorstate.pegboxstyle=="bassrider"){
			// Top not drawn on concept drawings
			if (editorstate.drawingpurpose != "concept"){
			var topcha = creel("path", "chanterelle-rider-top", "", ["d",chanterelle_top,"style",NOFILLTHIN], NAMESPACE);
			addel(detached, topcha);
			var topp1 = DETACHEDORIGIN.move(-pw/2-0.3).movedist(8, getangle(tr1,tr2))
			movepath(topcha, topp1);
			topcha.setAttribute("transform", 
			"rotate("+(getangle(tri1,tri2)/-0.01745329252)+" "+topp1.x+" "+topp1.y+")");
			}
			// Side
			
			var sicha = creel("path", "chanterelle-rider-side", "", ["d",chanterelle_side,"style",NOFILLTHIN], NAMESPACE);
			// addel(sideview, sicha);
			addelbefore(getelid("pegboxside"), sicha);
			movepath(sicha, side.move(-8,-1));
			sicha.setAttribute("transform", 
			"rotate("+pangle_deg+" "+side.x+" "+side.y+")");
		}
		// Draw bass rider
		if (editorstate.pegboxstyle=="bassrider"){
			var theorbosvgdoc = getelid("svg-theorbos").getSVGDocument();
			var briderfront = theorbosvgdoc.getElementById("bassrider-front").cloneNode(true);
			var bridertop = theorbosvgdoc.getElementById("bassrider-top").cloneNode(true);
			var briderside = theorbosvgdoc.getElementById("bassrider-side").cloneNode(true);
			
			
			// Top not drawn on concept drawings
			if (editorstate.drawingpurpose != "concept"){
				var pos = DETACHEDORIGIN.move(pw/2 +2.6,-10);
				var t = "translate("+pos.x+" "+pos.y+") rotate("+0.8+" "+(0) +" "+(0) +")";
				bridertop.setAttribute("transform",t);
				addel(detached, bridertop);
				// TODO: Rotate top view depending on pegbox side angle
			}
			
			var pos = side.move(12,-58.5);
			var t = "translate("+pos.x+" "+pos.y+") rotate("+(-1.6)+" "+(0) +" "+(0) +")";
			briderside.setAttribute("transform",t);
			addel(sideview, briderside);
			// console.log(cps.bassnuts[0]);
			var pos = cps.bassnuts[0].move(8,2);
			var t = "translate("+pos.x+" "+pos.y+") rotate("+(0)+" "+(0) +" "+(0) +")";
			briderfront.setAttribute("transform",t);
			addelbefore(getelid("stringgroup"), briderfront);
			// TODO: front view size or angle doesn't match, sometimes looks weird
			
		}
	} else if (editorstate.pegboxstyle == "theorbo" && editorstate.mensur_1){
			// TODO: Also change pegboxstyle in the editor if basscourses necessitates it
			function translate_around(outp, centerp,rotp,angle){
				var a = Math.atan2((centerp.y-rotp.y), (centerp.x-rotp.x))-Math.PI*0.5;
				// var a = Math.atan((centerp.y-rotp.y)/(centerp.x-rotp.x))+Math.PI*0.5;
				var d = Math.sqrt((centerp.y-rotp.y)**2+(centerp.x-rotp.x)**2);
				return outp.movedist(-d,a+angle);
			}

			var lastnut = cps.bassnuts[parseInt(editorstate.numbernuts)-2];
			// Draw extension front
			var ext1 = cps.ext1;
			var ext2 = cps.ext2;
			
			var extangle = Math.atan((cps.nutmid.x-lastnut.x)/(cps.nutmid.y-lastnut.y));
			// console.log("extangle",extangle);
			// extangle = Math.abs(extangle);
			// console.log("extangle2",extangle);
			var extlen = 80 + (cps.nutmid.y-lastnut.y) / Math.cos(extangle);
			// console.log(extlen);
			var midp = cps.nutmid.movedist(-extlen,extangle);
			var ext3 = midp.movedist(13, extangle+Math.PI/2);
			var ext4 = midp.movedist(13, extangle-Math.PI/2);
			// console.log("front extangle",extangle);
			
			// Draw front view extension head
			// var headgfront = makegroup(frontview, "theorbohead-rotate-front");
			var headgfront = theorbohead_front.cloneNode(true);
			var headgpaths = headgfront.getElementsByTagName("path");
			
			// Get coordinates of bassnut line start and end points in non-translated space, for correctly positioning the upper pegbox
			// Only works if svg is saved with absolute paths (Inkscape > Preferences > Input/Output > SVG output > Path string format: Absolute)
			var bspos = headgpaths["bass-nut-top"].pathSegList.getItem(1);
			var bnpos1 = new Point(bspos.x,bspos.y);
			var bspos = headgpaths["bass-nut-top"].pathSegList.getItem(2);
			var bnpos2 = new Point(bspos.x,bspos.y);
			
			
			// console.log("front bnpos",bnpos1,bnpos2)
			var deg = -extangle / 0.01745329252; // rad to deg
			var t = "translate("+(lastnut.x-bnpos1.x)+" "+(lastnut.y-bnpos1.y)+") rotate("+deg+" "+(bnpos1.x) +" "+(bnpos1.y) +")";
			headgfront.setAttribute("transform",t);
			// Draw extension front outline 
			var bspos = headgfront.children.item("extension-front-end").pathSegList.getItem(0);
			var extend1 = new Point(bspos.x,bspos.y);
			// console.log(extend1);
			
			extend1 = translate_around(lastnut,bnpos1,extend1,extangle);
			// console.log(extend1);
			var bspos = headgfront.children.item("extension-front-end").pathSegList.getItem(1);
			var extend2 = new Point(bspos.x,bspos.y);
			// console.log(extend2);
			extend2 = translate_around(lastnut,bnpos1,extend2,extangle);
			// console.log(extend2);
			// drawcircle(null, extend2,3, GREENSTYLE);
			// TODO : something fucky with translate_around
			// console.log("front extends",extend1,extend2)
			var extension = drawshape(frontview, [ext1,extend1,extend2,ext2],
							THINSTYLE,"extension", false);
			// Reorder extension elements
			addelbefore(getelid("stringgroup"), headgfront);
			addelbefore(getelid("neck"), extension);
			// var extm = drawline(frontview, [cps.nutmid,midp], THINSTYLE, "extmiddle");
			

			// Draw pegbox inside on the extension frontview
			// Follow extension side angles
			var exttangle = Math.atan((ext3.x-ext1.x)/(ext3.y-ext1.y));
			var extbangle = Math.atan((ext4.x-ext2.x)/(ext4.y-ext2.y));
			var spacing = 14;
			if (editorstate.singlestrings){
				var plength = 30+10+spacing*(editorstate.fingerboardcourses-1);
			} else {
				var plength = 30+10+spacing*(editorstate.fingerboardcourses*2-editorstate.chanterelles-1);
			}
			var t = ext1.movedist(8,cps.nutangle);
			var t2 = t.movedist(-plength,exttangle);
			var b = ext2.movedist(-20,cps.nutangle);
			var b2 = b.movedist(-plength-100,extbangle);
			var b22 = t2.movedist(plength,extbangle-Math.PI/2);
		
			// Intersect lines to find correct b2
			var inter = intersectline(t2, b22,	  b, b2);
			
			var pegboxfront = drawshape(frontview,[t,t2,inter,b],
							THINSTYLE,"extension-lower-pegbox", false);
			addelbefore(getelid("neck"), pegboxfront);

			//////////////////////////////////////////////////////
			// Draw extension side view
			//////////////////////////////////////////////////////
			function translate_around2(outp, centerp,rotp,angle){
				// var a = Math.atan2((centerp.y-rotp.y), (centerp.x-rotp.x))-Math.PI*0.5;
				var a = Math.atan((centerp.y-rotp.y)/(centerp.x-rotp.x))+Math.PI*0.5;
				var d = Math.sqrt((centerp.y-rotp.y)**2+(centerp.x-rotp.x)**2);
				return outp.movedist(d,-a-angle);
			}
			// Place head on drawing
			var exg = makegroup(sideview, "ext-side");
			heady = lastnut.y-100;
			// TODO: extension pegbox shapes should have a path named  and  and they should be used to locate and rotate the extension correctly
			// extension-end-shape
			// bass-nut-sideview-shape
			// bass-nut-bottom
			// bass-nut-top
			
			// Get extension angle (sideview)
			var extsideangle = Math.atan(50/(heady-side.y));
			var extbacksideangle = Math.atan(45/(heady-side.y));
			
			// Draw bass string - not drawn here anymore but only calculated
			var bx=SIDEVIEWORIGIN.x;
			var by=cps.bridgey;
			var bo = new Point(SIDEVIEWORIGIN.x+7, cps.bridgey);
			var stringend = new Point(bo.x, lastnut.y);
			// var stringb = drawline (sideview,[bo,stringend], "","bass_strings_side");
			
			// Draw extension head
			var headg = theorbohead.cloneNode(true);
			// Find named paths in theorbohead for positioning
			addel(sideview, headg);
			var headgpaths = headg.getElementsByTagName("path");
			
			var bspos = headgpaths["bass-nut-sideview-shape"].pathSegList.getItem(0);
			var bassnutpos = new Point(bspos.x,bspos.y);
			
			// Rotate head by angle
			// Figure out head angle; pegbox should lay flat on line from extension start to extension end
			
			// var s = editorstate["mensur_"+(editorstate.numbernuts-1)]-editorstate.mensur-4.5; // from nut to bassnut
			var s = getmensur(editorstate.numbernuts-1)-editorstate.mensur-4.5; // from nut to bassnut
			var dst = Math.abs(side.x-stringend.x)-Math.abs((stringend.y-side.y)*(bo.x-stringend.x))/(stringend.y-bo.y); // From bass strings over nut to startpoint of extension
			var e = Math.sqrt((s**2)+(dst**2)); 
			var f = Math.sqrt((e**2)-(bassnutpos.x**2));// sqrt returns NaN for negative numbers
			// Angles
			var aed = Math.acos(dst/e);
			var afe = Math.acos(f/e);
			var adC = Math.PI-afe-aed;
			extsideangle = -(0.5*Math.PI-adC);
			// console.log("side extsideangle",extsideangle);
			
			var deg = extsideangle / 0.01745329252; // rad to deg
			
			var t = "translate("+(stringend.x-bassnutpos.x)+" "+(stringend.y-bassnutpos.y)+") rotate("+(deg)+" "+(bassnutpos.x) +" "+(bassnutpos.y) +")";
			headg.setAttribute("transform",t);
			// Now that the head has been placed, find the final coordinates of the end shape of the extension
			var extend = headgpaths["extension-end-shape"].pathSegList.getItem(2);
			var extendpos = new Point(extend.x,extend.y);

			var extstart = headgpaths["extension-end-shape"].pathSegList.getItem(1);
			var extstartpos = new Point(extstart.x,extstart.y);

			
			var exttip = translate_around2(stringend,bassnutpos,extstartpos,extsideangle);
			var exttip2 = translate_around2(stringend,bassnutpos,extendpos,extsideangle);
			var extc1 = translate_around2(stringend,bassnutpos,new Point(extend.x1,extend.y1),extsideangle);
			var extc2 = translate_around2(stringend,bassnutpos,new Point(extend.x2,extend.y2),extsideangle);
			// console.log("side extendpos",extendpos,extstartpos);
			var extbackstart = side.move(-25,-10)
			var extbacksideangle = -getangle(extbackstart,exttip2);
			
			
			
			// But also make some adjustment so the hinge doesn't intersect the lower pegs
			// Find hinge center by intersecting extension backside
			
			// Draw folded sideview extension	
			if (editorstate.foldable){
				var extlen = cps.neckmid.y-heady;
				var haf = extlen/2; // This is where the hinge is located
				var hy = cps.neckmid.y-haf;
				// Limit hinge position by pegbox cutaway size
				var limitedy = side.y-plength-90;
				if (limitedy < hy){hy=limitedy;}
				// console.log(hy);
				var hinge = intersectline(new Point(0, hy), 
										new Point(DRAWINGWIDTH, hy+0.0000000001),  
										exttip2,
										extbackstart);
				// Find hinge joint shape points
				var p1 = hinge.movedist(-5,extbacksideangle);
				var p2 = p1.movedist(14, -extsideangle+Math.PI/2);
				var pa = p1.movedist(55,-extbacksideangle);
				var pb = p2.movedist(55,-extsideangle);
				var p3 = p2.movedist(70,-extsideangle);	
				var p4 = p3.movedist(100,-extsideangle+Math.PI/2);
				var p4 = intersectline(p3, p4,   side, exttip);
			
				var d = ["M", side.x, side.y];
				d = d.concat(["L", p4.x, p4.y]); // Going CCW
				d = d.concat(["L", p3.x, p3.y]); // Doing hinge joint shape
				d = d.concat(["L", p2.x, p2.y]); 
				d = d.concat(["L", p1.x, p1.y]); 
				d = d.concat(["L", side.x-25, side.y-10]); // Start off curve 
				d = d.concat(["C", side.x-22.5, side.y+10, side.x-20, side.y+20, side.x-16, side.y+30]);
				d = d.concat(["L", side.x, side.y+40]); // joint angled face
				d = d.concat(["z"]); // Close path
				d = d.join(" ");
				var extside = creel("path", "ext-side-pegbox", "", ["d",d], NAMESPACE);
				extside.setAttribute("style",COVERSTYLE);
				addel(exg, extside);	
				
				var d = ["M",exttip.x, exttip.y];
				d = d.concat(["C", extc1.x,extc1.y,extc2.x,extc2.y,exttip2.x,exttip2.y]); // Curve at the head
				d = d.concat(["L", pa.x, pa.y]);
				d = d.concat(["L", pb.x, pb.y]);
				d = d.concat(["L", p3.x, p3.y]);
				d = d.concat(["L", p4.x, p4.y]); 
				d = d.concat(["z"]); // Close path
				d = d.join(" ");
				var extside2 = creel("path", "ext-side-extension", "", ["d",d], NAMESPACE);
				extside2.setAttribute("style",COVERSTYLE);
				addel(exg, extside2);	
				
				// Copy extension long part and rotate
				var extg = makegroup(sideview, "extension-rotate");
				addel(extg,extside2.cloneNode(true));// Add to extension rotate group
				var deg = -177.5; // rad to deg
				var t = "rotate("+deg+" "+hinge.x +" "+hinge.y +")";
				// console.log(t);
				extg.setAttribute("transform",t);
				// Mark instrument folded length on the drawing
				var foldedlength = SIDEVIEWORIGIN.y - (hinge.y-64);
				// marklength(sideview,
					// [{x:SIDEVIEWORIGIN.x+30,
					  // y:SIDEVIEWORIGIN.y},
					 // {x:SIDEVIEWORIGIN.x+30, 
					  // y:hinge.y-64}],       "right");
				var inner ="Folded length: "+((foldedlength/10).toFixed(0))+" cm";
				var point = hinge.move(-100,-70);
				
				// Add head to extension rotate group
				addel(extg,headg.cloneNode(true));
				// addel(extg,bassnut.cloneNode(true));
				// Draw hinge tube
				var hingetube = drawcircle(extg, hinge,5, null,"hinge-tube");
				addel(exg, extg);
				drawtext(exg, point, inner,"","folded-length-info")
				
			} else { // Draw extension sideview without hinge
				// Group for extension side
				// extension_tip.x,.y
				// Draw outline of extension
				var d = ["M", side.x, side.y, "L", exttip.x, exttip.y];
				d = d.concat(["C", extc1.x,extc1.y,extc2.x,extc2.y,exttip2.x,exttip2.y]); // Curve at the head
				d = d.concat(["L", side.x-25, side.y-10]); // Start off curve 
				d = d.concat(["C", side.x-23.5, side.y+10, side.x-20, side.y+20, side.x-15.5, side.y+30]);
				d = d.concat(["L", side.x, side.y+40]); // joint angled face
				d = d.concat(["z"]); // Close path
				d = d.join(" ");
				var extside = creel("path", "ext-side-outline", "", ["d",d], NAMESPACE);
				extside.setAttribute("style",COVERSTYLE);
				addel(exg, extside);	
				// Draw edge of extension, which has a rounded bottomside
				
				
				// drawcircle(sideview, side, 1,BLUESTYLE,"nc1-");
			}
			var extline = [	exttip2.move(0.5),
								side.move(-22,-15),
								side.move(0,40).
									bezier(	side.move(-20,15),
											side.move(-10,30))];
			drawshape(exg, extline, NOFILLTHIN,"ext-side-edgeline", false);
			// addelafter();

			

			///////////////////////////////////////////
			// Draw peg centerlines on the extension frontview, maybe even pegs
			// Also draw peg holes on the sideview
			
			if (editorstate.singlestrings){
				var pegs = editorstate.fingerboardcourses;
			} else {
				var pegs = editorstate.fingerboardcourses*2-editorstate.chanterelles;
			}
			
			for (var i = 0; i<pegs; i++){
				var pos = 25+spacing*i;
				// intersect with one edge.
				// console.log(extangle);
				// Draw based on extension middle line
				var mp = cps.nutmid.movedist(-pos, extangle);
				// var mp = {x: cps.neckmid.x-pos*Math.sin(extangle),
						  // y: cps.neckmid.y-pos*Math.cos(extangle) };
				// var b = mp.movedist();
				var b = {x: mp.x+200*Math.cos(extangle),
						 y: mp.y-200*Math.sin(extangle) };
				var t = {x: mp.x-200*Math.cos(extangle),
						 y: mp.y+200*Math.sin(extangle) };
				// drawline(frontview, [b,t],"","pegbox-pegcenterline-"+i);
				var ib = intersectline(t, b, ext2,{x:ext4.x,y:heady+0.00000000001});
				var it = intersectline(t, b, ext1,{x:ext3.x,y:ext3.y+0.00000000001});
				// Should intersect lines not points
				// console.log(ib,it);
				var neckC = {x: 10*Math.cos(extangle),
						 y: 10*Math.sin(extangle) };

				if (i%2==0){
					ib.x = ib.x-neckC.x;
					ib.y = ib.y+neckC.y;
					var radius = 3.5;
				} else {
					it.x = it.x+neckC.x;
					it.y = it.y-neckC.y;
					var radius = 2;
				}
				drawline(frontview, [ib,it],"","pegbox-pegcenterline-"+i);
				
				// Draw circles on the sideview of the extension
				var displace = 11+pos*Math.sin(-extsideangle);
				var cpos = side.move(-displace, -pos)
				drawcircle(sideview, cpos, radius, THINSTYLE,"peg-hole-"+i)
				// var pegline = drawline(frontview, thin.x,thin.y,thick.x,thick.y,"","pegbox-pegcenterline-"+i);
				if (i >= 6 && i <= 9) {
					// Store strap pin position for later use by planmaker
					cps.neckstrap = cpos.movedist(13, extsideangle-Math.PI/2);
					cps.neckstrapangle = (extsideangle+Math.PI/2) / radtodeg;
				}
			}
			if (editorstate.drawingpurpose.startsWith("technical")){
				// Draw lower pegbox inside on the sideview
				var i2 = side.move(-19,-12);
				var i3 = i2.movedist(-pos,-extbacksideangle);
				var i4 = i3.movedist(-17,-extbacksideangle-Math.PI/2);
				var inshape = [side, i2, i3, i4];
				// drawcircle(sideview, side, 2);
				drawshape(sideview, inshape, BEHINDSTYLE, "lower-pegbox-inside", false);
			}
			
		}
}
function drawbars(bars,w){
	// Draw soundboard bars based on barlist
	var edge = currentbody.side;
	
	var bardistances = [];
	var bl = [];
	for (var i=0; i<barlist.length; i++){ // 9th one is bass bar
		if (i !=9) {
			bardistances.push(-barlist[i].pos);
			bl.push(barlist[i]);
		}
	}
	
	// var t0 = performance.now();
	var intersections = getpoints(edge, bardistances,false).X;
	// var t1 = performance.now();
	// console.log("It took " + (t1 - t0).toFixed(0) + " ms to calculate bar intersections.")
	// console.log("bardistances",bardistances);
	// console.log("intersections",intersections);
	
	for (var i=1; i<intersections.length; i++){
		var leftx = FRONTVIEWORIGIN.x + intersections[i];
		var rightx = FRONTVIEWORIGIN.x - intersections[i];
		var line = drawline(bars, 
					[{x:leftx+1.6, y:FRONTVIEWORIGIN.y+bardistances[i]},
					 {x:rightx-1.6, y:FRONTVIEWORIGIN.y+bardistances[i]}]);
		if (i==4){
			line.id="bar-rosette";
		} else {
			line.id="bar-"+i;
		}
		var tadd="";
		if (bl[i].thickness !== undefined){
			var thickness=bl[i].thickness.toFixed(1);
			var height=bl[i].height.toFixed(0);
			tadd = " "+thickness+"x"+height
		}
		
		var te = bl[i].pos.toFixed(0)+tadd;
		var t = drawtext(bars, 
					{x:rightx+5, y:FRONTVIEWORIGIN.y-bl[i].pos+2}, 
					te);
		t.id = "bar-pos-"+i; 
		if (i==8) line.id = "neckblock-lower"; // Last bar is actually neckblock lower/inside edge
	}
	
	// Draw J-bar
	var p1 = FRONTVIEWORIGIN.move(10, -barlist[9].pos);
	var p2 = FRONTVIEWORIGIN.move(intersections[0]*0.5, -barlist[9].pos);
	var p3 = FRONTVIEWORIGIN.move(intersections[0]+1, -barlist[0].pos-5)
	var cp1 = FRONTVIEWORIGIN.move(intersections[0]*0.85, -barlist[9].pos);
	var cp2 = new Point(p3.x, p3.y);
	var p3 = p3.bezier(cp1,cp2);
	var jbar = [p1, p2, p3 ];
	drawshape(bars, jbar, "", "bassbar", false);
	
	// Treble bar 1 goes to (bridgewidth+20)/2, 2 to bridgewidth/3
	var barstart = FRONTVIEWORIGIN.move(0, -(2*barlist[1].pos+barlist[2].pos)/3);
	
	
	var thru1 = FRONTVIEWORIGIN.move((cps.bridgewidth)/2+25, -barlist[0].pos);
	var bar1a = getangle(barstart,thru1);
	var bar1 = [barstart, barstart.movedist(1000, bar1a)];
	var bar1end = pathline_intersect(currentbody.trebleside, bar1);
	bar1end = bar1end.movedist(-2.5,bar1a);
	bar1 = [thru1, bar1end];
	drawline(bars, bar1,"","treble-bar-1");


	var thru2 = FRONTVIEWORIGIN.move((cps.bridgewidth)/3, -barlist[0].pos);
	var bar2a = getangle(barstart,thru2);
	var bar2 = [barstart, barstart.movedist(1000, bar2a)];
	var bar2end = pathline_intersect(currentbody.trebleside, bar2);
	bar2end = bar2end.movedist(-6.5,bar2a);
	bar2 = [thru2, bar2end];
	drawline(bars, bar2,"","treble-bar-2");

	
	// Position bars on top of body shape
	addel(getelid("frontview"),bars);
}
	
function drawneck(frontview,edge,trebleside){
	
	// Draws neck, strings, bridge, nut
	// First attempt to make neck symmetrically, but if intersection point is wider than neck width limit, use advanced method with neck width limit
	// Return useful calculated points for further use in main draw function
	var stringbandws = calculatestrings();
	// console.log(stringbandws);
	var bridgewidth = stringbandws.bridgewidth;
	cps.bridgewidth = bridgewidth;
	var nutwidth = getlast(stringbandws.nuts[0]); // Add space around strings
	var bridgelastfingerboardcourse = getlast(stringbandws.bridge[0]);
	
	var mensur = editorstate.mensur;
	var bx=FRONTVIEWORIGIN.x;
	var by=FRONTVIEWORIGIN.y;
	var edge = currentbody.side;
	var trebleside = currentbody.trebleside;
	var bridgetreblex = bx+bridgewidth/2; // Add 4.5 for some calculations
	var bridgebassx = bx-bridgewidth/2;
	var fingerboardstringsbassx = bridgetreblex-bridgelastfingerboardcourse;
	var bridgey = by-barlist[0]["pos"]-editorstate.bridgeoffset;
	var neckjointy = 0; // This is returned
	var firststringbridge = new Point (bridgetreblex, bridgey);
	// Intersect first string+4.5mm with otherside to find neck width
	var tneck = [{x:bx+nutwidth/2, y:bridgey-mensur}, {x:bridgetreblex+4.5, y:bridgey}];
	// var inter = intersectpaths(tneck,trebleside,10,null,null,true);
	// console.log("drawneck pls intersect");
	var inter = pathline_intersect(currentbody.trebleside, tneck);
	// console.log("drawneck thx for intersect");
	// return;
	// TODO: having no intersection points causes error, handle ach case separately or return default value?
	if (!inter) {console.log("No intersection for string band");return;}

	var neckwidth = (inter.x-bx)*2 +5;
	// delel(tneck);
	// Is neck width wider than neck width limit?

	// console.log("Neck would be quite wide, limiting width, drawing asymmetric neck");
	// If it is, intersect vertical line at bx + editorstate.neckwidthlimit/2
	// this neckwidth refers to the width at the body joint, not at the nut
	if (neckwidth > editorstate.neckwidthlimit){
		neckwidth = editorstate.neckwidthlimit;
		// TODO: neck width set
	}
	if (editorstate.limitorset == "set"){
		neckwidth = editorstate.neckwidthlimit;
	}
	cps.neckwidth = neckwidth;
	var vertline = [{x:bx+neckwidth/2, y:bridgey-mensur}, 
					{x:bx+neckwidth/2, y:bridgey}];
	// var inter = intersectpaths(vertline,trebleside,10,null,null,true)[0].intersectpoint;
	var inter = pathline_intersect(currentbody.trebleside, vertline);
	// delel(vertline);
	// console.log(inter);
	// Find angle of line from bridge treble end+4.5 to intersection (neck joint)
	var angle = Math.atan((bridgetreblex+4.5-inter.x) / (bridgey-inter.y));
	// console.log((bx+bridgewidth/2+4.5-inter.x),(by-barlist[0]["pos"]-inter.y));

	// Draw line with angle, length mensur from bridge treble end
	// Get nut treble end coordinates
	var nutr = new Point((mensur+4.5)*Math.sin(angle),
						 (mensur+4.5)*Math.cos(angle));
	// console.log(nutr.x,nutr.y, angle);
	nutr.x = bx+bridgewidth/2+4.5 - nutr.x;
	nutr.y = bridgey - nutr.y;
	// var neckright = drawline(frontview, nutr.x,nutr.y, inter.x,inter.y, THINSTYLE, "necktreble");
	// Find neck centerline, nut centerpoint
	// neckadd should always affect (+/-) neck width, but not nut width (- for 10c, 11c lutes; + for theorbos)
	var neckwidth2 = parseFloat(nutwidth) + parseFloat(editorstate.neckadd) + 8;
	// console.log(neckwidth2, nutwidth, editorstate.neckadd);
	// Find line starting at neckC(center of neck at body joint) which is tangential to circle at point O (nutr.x,nutr.y) with radius r=nutwidth/2, at point P1, (center of neck at nut).
	var neckC = {x:bx, y:inter.y}; // centerline of instrument, y coordinate at neck joint
	var AO = Math.sqrt((nutr.x-neckC.x)**2+(nutr.y-neckC.y)**2);
	var r1 = (neckwidth2)/2;
	var AP = Math.sqrt((AO)**2-r1**2);
	
	var d=Math.sqrt((nutr.x-neckC.x)**2 + (nutr.y-neckC.y)**2);
	var bob=(AP**2-r1**2+d**2)/(2*d);
	var h=Math.sqrt(AP**2-bob**2);
	var x2=neckC.x+bob*(nutr.x-neckC.x)/d;   
	var y2=neckC.y+bob*(nutr.y-neckC.y)/d;   
	var nutC = {x:x2+h*(nutr.y-neckC.y)/d,       // also nutC.x=x2-h*(y1-y0)/d
				y:y2-h*(nutr.x-neckC.x)/d};      // also nutC.y=y2+h*(x1-x0)/d
	// console.log(neckC.x,neckC.y,nutC.x,nutC.y);
	
	// Find coordinates for bass end of nut
	var nutangle = Math.atan((nutr.x-nutC.x)/(nutr.y-nutC.y));
	nutangle = -Math.abs(nutangle);
	// console.log(nutangle);
	var nutbass = {x: nutr.x - Math.abs((nutwidth+8) * Math.sin(nutangle)),
				   y: nutr.y + Math.abs((nutwidth+8) * Math.cos(nutangle))};
	// Bass top corner of neck
	var neckbass = {x: nutr.x - Math.abs((neckwidth2) * Math.sin(nutangle)),
				   y: nutr.y + Math.abs((neckwidth2) * Math.cos(nutangle))};
	// drawcircle(frontview, nutr, 2);
	neckjointy = inter.y;
	// Draw neck; With fangs or not
	
	var bass_inter = new Point(bx-(inter.x-bx), inter.y);
	if (editorstate.fingerboardstyle=="fangs"){
		// Neck frontview fangs
		// TODO: Maybe also small fangs as a different style
		var fangw = (20 +neckwidth/5.0)/2.0; // width of fang
		var fangd = 10; // How far fang pokes in to soundboard
		var sb_e = 20; // How far the soundboard extends in the middle
		var bassfang = bass_inter.move(fangw, fangd);
		var bassp = bass_inter.move(fangw, -sb_e);
		var trebfang = inter.move(-fangw, fangd);
		// var trebp = inter.move(-fangw, -sb_e);
		var trebp = trebfang.movedist(fangd+sb_e, (angle/2-Math.PI));
		// Fangs are between inter (treble side) and bass_inter
		// if (editorstate.bodyshapefrom != "classical"){
		if (getelid("bodyshapefrom").value != "classical"){
			// Add white rectangle to cover the soundboard top edges
			var covertangle = drawshape(frontview, 
				[bass_inter,inter, trebp,bassp], 
				makestyle(COVERSTYLE, ["stroke","none"]), "covertangle", true);
		}
		
		
		var neck = drawshape(frontview, 
				[nutr,neckbass,bass_inter,
				bassfang.relbezier(-fangw*0.6,-fangd,-fangw*0.3,-fangd),
				bassp,
				trebp,
				trebfang,
				inter.relbezier(-fangw*0.7,0,-fangw*0.4,0)], 
				COVERSTYLE, "neck", true);
	} else {
		// Flat fingerboard joint
		var neck = drawshape(frontview, 
				[nutr,neckbass,bass_inter,inter], 
				COVERSTYLE, "neck", true);
	}
	
	if (editorstate.drawingpurpose && editorstate.drawingpurpose.startsWith("technical")){
		// console.log(neckC,nutC);
		drawline(frontview,[neckC,nutC],GUIDESTYLE,"neckcenter");
		
	}
	cps.nutmid =  new Point(nutC.x,nutC.y);
	// } else {
		// console.log("Drawing symmetrical neck");
		// var rightx = (bx-inter.x)*2+inter.x;
		// var nutbass = {x: bx-nutwidth/2,
					   // y: bridgey-mensur-4.5};
		// var nutr = {x: bx+nutwidth/2,
					// y: nutbass.y};
		// var neckwidth2 = nutwidth ;
		// var neckbass = {x: nutr.x - Math.abs((neckwidth2) * Math.sin(nutangle)),
					   // y: nutr.y + Math.abs((neckwidth2) * Math.cos(nutangle))};
		// var nutangle = -Math.PI/2;

		// neckjointy = inter.y;
		// cps.nutmid =  new Point(bx,nutr.y);
		
		// var neck = drawshape(frontview, [inter,nutr,nutbass,{x:rightx,y:inter.y}], 
							// COVERSTYLE, "neck", true);
	// }
	// Draw all strings here, if wanted, but do calculations for nut and bridge extremes above
	if (nutbass.y != nutr.y){
		// Limited neck width
		var nut =  new Point (nutr.x + Math.abs((4.5) * Math.cos(nutangle)),
					nutr.y + Math.abs((4.5) * Math.sin(nutangle)));
		var chan = new Point (nut.x - Math.abs((4.5) * Math.sin(nutangle)),
					nut.y + Math.abs((4.5) * Math.cos(nutangle)));
		var bass = new Point (nut.x - Math.abs((nutwidth+4.5)*Math.sin(nutangle)),
					nut.y + Math.abs((nutwidth+4.5)*Math.cos(nutangle)));
		var nut2 = new Point (nut.x - Math.abs((nutwidth+8) * Math.sin(nutangle)),
					nut.y + Math.abs((nutwidth+8) * Math.cos(nutangle)));
	} else {
		// Symmetrical neck
		var nut =  new Point (nutr.x, 		nutr.y+4.5);
		var chan = new Point (nutr.x-4.5, 	nutr.y+4.5);
		var bass = new Point (nutbass.x+2,	chan.y);
		var nut2 = new Point (nutbass.x, 	nut.y);
		
	}
	// Find pegbox or extension start points, for drawing later by drawpegbox()
	if (editorstate.pegboxstyle == "theorbo"){
		var dist = 5;
	} else {
		var dist = 3;
	}
	
	var ext1 = new Point(nutr.x-dist + Math.abs((dist) * Math.cos(nutangle)),
				 nutr.y-dist + Math.abs((dist) * Math.sin(nutangle)));
	var ext2 = new Point(nutr.x - Math.abs((neckwidth2-dist) * Math.sin(nutangle)),
				nutr.y + Math.abs((neckwidth2-dist) * Math.cos(nutangle)));
	cps.ext1 = ext1;
	cps.ext2 = ext2;
	// Make sure nutangle is negative (because some parts of the code have been written in such neckC way taht they expect neckC negative angle)
	cps.nutangle = -Math.abs(nutangle);
	// function makegroup(c, groupname, inkscapelayer)
	var stringgroup = makegroup(frontview,"stringgroup");
	// addel(frontview,stringgroup);
	drawline(stringgroup, [bass,{x:fingerboardstringsbassx,y:bridgey}], 
			THINSTYLE, "lowestfingerboardstring");
	drawline(stringgroup, [chan,{x:bridgetreblex,y:bridgey}], 
			THINSTYLE, "chanterelle");
	drawline(frontview, [nut,nut2], THINSTYLE, "nutline");
	var nutgroup = makegroup(frontview, "nutgroup");
	drawshape(nutgroup, [nutr,nutbass,nut2,nut], THINSTYLE, "nut_outline");
	// drawline(frontview, fingerboardstringsbassx,bridgey,bridgetreblex,bridgey, THINSTYLE, "bridgeline");
	if (editorstate.drawingpurpose.startsWith("technical")){
		// var nutC.x = nutC.x | bx; // Not reliable 
		// drawtext(c, coords, inner, style,id)
		var neckwidth = 2*(inter.x-bx);
		var neckheight = inter.y-nutr.y;
		// Make text boxes for neck width, bridge position
		drawtext(frontview,{x:bx-neckwidth/2-30, y:inter.y-neckheight/2}, 
				neckheight.toFixed(0));
		drawtext(frontview,{x:bx, y:inter.y+TEXTH}, 
				neckwidth.toFixed(0));
		drawtext(frontview,{x:bx, y:nut.y-8},
				nutwidth.toFixed(1));
		drawtext(frontview,{x:bx+2, y:bridgey-3},
				bridgewidth.toFixed(1));
		drawtext(frontview,{x:bridgetreblex+4, y:bridgey-4},
				(barlist[0]["pos"]+editorstate.bridgeoffset).toFixed(0));
	}
	
	// Drawbridge (lol)
	
	var bgroup = makegroup(frontview, "bridge-group");
	var bfrontg = makegroup(frontview, "bridge-front-group");
	bfrontg.style = "display:none;";
	// Get selected bridge style or if editorstate.bridgestyle is not available, use a default
	if (editorstate.bridgestyle){
		var bridgeend = bridgelist[editorstate.bridgestyle].cloneNode(true);
	} else { // default case for first time run
		var bridgeend = bridgelist["renaissance"].cloneNode(true);
	}
	
	bridgeend.setAttribute("transform",""); // Remove any transforms from group
	var bassend = bridgeend.cloneNode(true);
	bassend.id = bridgeend.id+"-bass";
	addel(bgroup, bridgeend);
	move(bridgeend, {x:bridgetreblex+0.5, y:bridgey});
	// Other end of bridge
	addel(bgroup, bassend);
	move(bassend, {x:bridgebassx-bassend.getBBox().width-7.5, y:bridgey});
	mirror(bassend,"h");
	// Scale bridge ends
	
	bridgeend.setAttribute("transform",bridgeend.getAttribute("transform")+" scale(0.9375)"); 
	bassend.setAttribute("transform",bassend.getAttribute("transform")+" scale(1.0315)"); 
	
	// Draw bottomline
	var brbotba = new Point (bridgebassx-4.5, bridgey+16.5);
	var brbottr = new Point (bridgetreblex+4.5, bridgey+15);
	var brmidba = new Point (bridgebassx-8, bridgey+8.3);
	var brmidtr = new Point (bridgetreblex+7.9, bridgey+7.5);
	var brtopba = new Point (bridgebassx-8, bridgey);
	var brtoptr = new Point (bridgetreblex+7.9, bridgey);
	drawline(bgroup, [brbotba,brbottr], THINSTYLE, "bridgebottom");
	drawline(bgroup, [brmidba,brmidtr], THINSTYLE, "bridgemiddle");
	drawline(bgroup, [brtopba,brtoptr], THINSTYLE, "bridgetop");
	
	// Make hidden size legend for bridge
	var blegend = makegroup(bgroup, "bridge_size_legend");
	drawshape(blegend, [brbotba.move(-20), brbotba.move(-30), brbotba.move(-30,-16.5), brbotba.move(-20,-16.5) ], BEHINDSTYLE, "basslegend", false);
	drawtext(blegend, brbotba.move(-50, -5), "16.5" );
	
	drawshape(blegend, [brbottr.move(20), brbottr.move(30), brbottr.move(30,-15), brbottr.move(20,-15) ], BEHINDSTYLE, "treblelegend", false);
	drawtext(blegend, brbottr.move(30, -5), "15" );
	blegend.style = "display:none;";
	
	// Draw bridge from the front and hide it
	var bodyb = new Point(bridgebassx-8, 0);
	var bodytopb = bodyb.move(0,9);
	var bodytr = new Point(bridgetreblex+8, 0);
	var bodytoptr = bodytr.move(0,7);
	drawshape(bfrontg, [bodyb, bodytopb, bodytoptr, bodytr], THINSTYLE, "bridgebody", true);
	
	var inb = new Point(bridgebassx-4.5, 0);
	var intopb = inb.move(0.4,7.5);
	var intr = new Point(bridgetreblex+4.5, 0);
	var intoptr = intr.move(-0.4,5.5);
	drawshape(bfrontg, [inb, intopb, intoptr, intr], THINSTYLE, "bridgeinner", false);
	// Bridge ends from the front
	drawshape(bfrontg, [bodyb, bodyb.move(-23), bodyb.move(-23,3), bodytopb.bezier(bodyb.move(-15, 3), bodytopb.move(-5, -5))], THINSTYLE, "", false);
	drawshape(bfrontg, [bodytr, bodytr.move(23), bodytr.move(23,2.5), bodytoptr.bezier(bodytr.move(15, 2.5), bodytoptr.move(5, -5))], THINSTYLE, "", false);
	
	// Legend for front view of bridge
	drawshape(bfrontg, [bodyb.move(-15), bodyb.move(-25), bodyb.move(-25,9), bodyb.move(-15,9) ], BEHINDSTYLE, "", false);
	drawtext(bfrontg, bodyb.move(-32,7.5), "9" );
	
	drawshape(bfrontg, [bodytr.move(15), bodytr.move(25), bodytr.move(25,7), bodytr.move(15,7) ], BEHINDSTYLE, "", false);
	drawtext(bfrontg, bodytr.move(32,6.5), "7" );
	
	var holangle = getangle(intoptr, intopb);
	var fhole = new Point(bridgetreblex, 5);
	// Draw string positions on bridge:
	for (var i=0; i<stringbandws.bridge.length;i++) {
		for (var j=0; j<stringbandws.bridge[i].length;j++) {
			var strstart = {x:bridgetreblex-stringbandws.bridge[i][j], y:bridgey};
			var strend = {x:bridgetreblex-stringbandws.bridge[i][j], y:bridgey+3};
			drawline(bgroup, [strstart,strend], THINSTYLE, "bridgestring-"+i+"-"+j);
			// Draw holes in bridge front view
			var hole = fhole.movedist(stringbandws.bridge[i][j], holangle);
			drawcircle(bfrontg, hole, 0.7);
		}
	}
	
	cps.bassnuts = [];
	// Draw string positions on the fingerboard nut, draw string bands, draw bass nuts
	for (var n=0; n<stringbandws.nuts.length; n++) {
		if (n > 0){
			// Find angle by drawing line through a point 5mm(?) from previous nut's lowest string, with length editorstate["mensur_"+i]
			// Less distance the fewer nuts there are
			// console.log(firststringbridge);
			var bridgefirst = firststringbridge.move(-stringbandws.bridge[n][0]);
			// console.log("bridgefirst",bridgefirst);
			var thru = s.movedist(9-stringbandws.nuts.length, nutangle);
			var bangle = getangle(bridgefirst, thru);
			// console.log(getmensur(n));
			var nutfirst = bridgefirst.movedist(-getmensur(n), bangle);
			// console.log(bridgefirst,nutfirst);
			drawline(stringgroup, [bridgefirst,nutfirst], THINSTYLE, "bassstring-"+n+"-first");
			
			// Last string on this nut
			var bridgelast = firststringbridge.move(-getlast(stringbandws.bridge[n]));
			var nutlast = nutfirst.movedist(getlast(stringbandws.nuts[n]), nutangle);
			drawline(stringgroup, [bridgelast,nutlast], THINSTYLE, "bassstring-"+n+"-last");
			
			// Draw the nut itself
			if (editorstate.pegboxstyle != "theorbo"){
				var tr1 = nutfirst.movedist(-2,nutangle);
				var tr2 = tr1.movedist(4.5, nutangle-Math.PI/2);
				var b1 = nutlast.movedist(2,nutangle);
				var b2 = b1.movedist(4.5,nutangle-Math.PI/2);
				drawshape(frontview, [tr1,tr2,b2,b1], THINSTYLE, "nut_outline_"+n);
			}
			
			
			// Store for posterity
			cps.bassnuts.push(nutfirst);
			
		} else {
			var nutfirst = chan;
		}
		// Draw intervening strings on all nuts if chosen
		if (editorstate.drawallstrings){
				for (var i=1; i < stringbandws.nuts[n].length-1; i++){
					var br = firststringbridge.move(-stringbandws.bridge[n][i]);
					var nu = nutfirst.movedist(stringbandws.nuts[n][i], nutangle);
				
					drawline(stringgroup, [br,nu], THINSTYLE, "bassstring-"+n+"-"+i);
				}
				
			}
		for (var i=0; i<stringbandws.nuts[n].length; i++) {
				// Draw string grooves on nut
				// console.log("nutbass.y != nutr.y");
				var s = nutfirst.movedist(stringbandws.nuts[n][i], nutangle);
				if (n>0 && editorstate.pegboxstyle == "theorbo"){
					var s2 = s.movedist(1.5, nutangle-Math.PI/2);
				} else {
					var s2 = s.movedist(4.5, nutangle-Math.PI/2);
				}
				if (n==0) {
					drawline(nutgroup, [s,s2], THINSTYLE, "nutstring-"+n+"-"+i);
				} else {
					drawline(frontview, [s,s2], THINSTYLE, "nutstring-"+n+"-"+i);
				}
				
				
			//} //else { // Symmetric neck
			// TODO: Check that nutangle is usable even if neck is symmetrical
				// console.log("else");
				// drawline(frontview, 
					// [{x: chan.x-stringbandws.nuts[n][i], y:chan.y},
					 // {x: chan.x-stringbandws.nuts[n][i], y:chan.y-4.5}], 
					 // THINSTYLE, "nutstring-"+n+"-"+i);
			// }
			
		}

		
	}
	
	//////////////////////////////////////////////////
	// Draw frets
	// TODO: Add fret limit?
	var treblefrets = calcfrets(mensur,0,12);
	var bassfrets = calcfrets(mensur*0.995,0,12); // Compensate for metal wounds
	// var trangle = angle;
	var trangle = Math.atan((bridgetreblex+4.5-inter.x) / (bridgey-inter.y));
	// var bangle = angle;
	// Bass angle should aim for bass edge for fingerboard, not last string
	var basside = new Point(neckbass.x, neckbass.y+4.5); // Not 100% correct, should move 4.5 along bass side of neck

	// var bangle = -Math.atan((nut2.x-(bx-(inter.x-bx))) / (nut2.y-inter.y));
	var bangle = -Math.atan((basside.x-(bx-(inter.x-bx))) / (basside.y-inter.y));
	// var bangle = Math.asin(((B-neckC)/2.0) / (bassfrets[12]*2.0));
	var frets = makegroup(frontview, "frets");
	for (var i=1; i <treblefrets.length; i++){
		// The actual coordinates of each fret end must be calculated
		// Bass end
		
		var Bx = bassfrets[i] * Math.sin(bangle);
		var By = bassfrets[i] * Math.cos(bangle);
		// 12th fret is under first two strings, 11th under three etc.
		// avg of bridge and nut distance
		// stringbandws
		
		// Treble end
		var Tx = treblefrets[i] * Math.sin(trangle);
		var Ty = treblefrets[i] * Math.cos(trangle);
		// if (nut.y+Ty < inter.y) {
		if (i==12){
			var st = THICKSTYLE;
		} else if (i==5 || i==7){
			var st = THICKSTYLE;
		} else {
			var st = THINSTYLE;
		}
		var sp = new Point(nut.x+Tx, nut.y+Ty);
		var ep = new Point(basside.x-Bx, basside.y+By);

		if (nut.y+Ty > inter.y && i>8 ){
			var indx = (14-i); // * 2 ;//- parseInt(editorstate.chanterelles);
			if (!editorstate.singlestrings) indx = indx*2;

			if (stringbandws.nuts[0][indx] === undefined) {
				indx = stringbandws.nuts[0].length-1;
			}
			// if on the soundboard, draw shorter
			var dir = getangle(ep,sp);
			var len = (stringbandws.nuts[0][indx]+stringbandws.bridge[0][indx])/2;
			// console.log(i, len,dir);
			if (dir < 0) dir += Math.PI; // Forces direction to be correct, otherwise sometimes drawn outside body
			ep = sp.movedist(-len,dir);
			
			drawline(frets,[sp,ep],THINSTYLE, "fret-"+i);
		} else {
			drawline(frets,[sp,ep],THINSTYLE, "fret-"+i);
		}
		
		
		if (editorstate.drawingpurpose.startsWith("technical")){
			var postext = parseFloat(Math.round(treblefrets[i] * 10) / 10).toFixed(1);
			var postext2 = (mensur-postext).toFixed(1);
			var ord = i+"th";
			if (i==1){
				ord = "1st";
			} else if (i==2) {
				ord = "2nd";
			}else if (i==3) {
				ord = "3rd";
			}
			drawtext(frets, {x:nut.x+Tx+3.0, y:nut.y+Ty+3}, ord+": "+postext);//+" - "+postext2);
		}
		// }
	}
	
	cps.neckjointy = neckjointy;
	cps.bridgey = bridgey;
	return neckjointy;
}

function drawborder(border){
	// Draw neckC border around the plan that has lines of neckC certain length, so that when the plan is printed the scale can be checked
	drawrect(border, {x:0,y:0}, {w:BORDERWIDTH,h:BORDERWIDTH}, BORDERSTYLEWHITE);
	// Make 10 short ones first
	for (var i=0;i<10;i+=2){
		// Horizontally
		var hsize = {w:10, h:BORDERWIDTH};
		var vsize = {w:BORDERWIDTH, h:10};
		drawrect(border, {x:BORDERWIDTH+i*10, y:0}, hsize, BORDERSTYLEBLACK);
		drawrect(border, {x:BORDERWIDTH+i*10+10, y:0}, hsize, BORDERSTYLEWHITE);
		// Vertically
		drawrect(border, {x:0, y:BORDERWIDTH+i*10},vsize, BORDERSTYLEBLACK);
		drawrect(border, {x:0, y:BORDERWIDTH+i*10+10},vsize	, BORDERSTYLEWHITE);
	}
	var borderlengthx = 100;
	var borderlengthy = 100;
	var white = false;
	
	var blen = {w:100, h:BORDERWIDTH};
	while(borderlengthx < DRAWINGWIDTH){
		var bpos = {x:BORDERWIDTH+borderlengthx, y:0};
		if (white){
			drawrect(border, bpos,blen, BORDERSTYLEWHITE);
			white=false;
		} else {
			drawrect(border, bpos,blen, BORDERSTYLEBLACK);
			white=true;
		}
		borderlengthx+=100;
	}
	var white = false;
	
	var blen = {w:BORDERWIDTH, h:100};
	while(borderlengthy < DRAWINGHEIGHT){
		var bpos = {x:0, y:BORDERWIDTH+borderlengthy};
		if (white){
			drawrect(border, bpos,blen, BORDERSTYLEWHITE);
			white=false;
		} else {
			drawrect(border, bpos,blen, BORDERSTYLEBLACK);
			white=true;
		}
		borderlengthy+=100;
	}
}
function drawinfobox(infobox){
	// Logo and instrument information
	// 2014logoontopopt.png
	// <image href="2014logoontopopt.png" height="100" width="100"/> 
	// preserveAspectRatio
	// TODO: Store image in the svg so it shows up when downloaded
	// var logo = makeimage(infobox,"niskanenluteslogo", "2014logoontopopt.png", 
	// INFOBOXORIGIN,{w:400,h:80}, true);
	// console.log(logo);
	// c, coords, inner, style,id
	// Drawer, date
	var h = 0; //80
	var d = new Date();
	// var n = d.toISOString();
	var da = [d.getFullYear(),d.getMonth()+1,d.getDate()].join("-");
	drawtext(infobox, INFOBOXORIGIN.move(0,h+10), "Drawing by Lauri Niskanen, "+ da, "","drawingby");
	// Scale
	// instrument information: Name & year, stringing info
	var na = editorstate.bodyshapefromlist.substr(0,1).toUpperCase()+editorstate.bodyshapefromlist.substr(1).toLowerCase();
	var info = na +", strings: "+stringing();
	drawtext(infobox, INFOBOXORIGIN.move(0,h+20), info, "","luteinfo");
	drawtext(infobox, INFOBOXORIGIN.move(0,h+30), "Mensur: "+((editorstate.mensur/10).toFixed(1))+" cm", "","mensurinfo");
	drawtext(infobox, INFOBOXORIGIN.move(0,h+40), "Scale: 1:1", "","scaleinfo");
	
}




