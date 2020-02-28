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
// Basic HTML and SVG helper functions
// - Accessing and creating elements in DOM easily
// - Path intersections
// - 

var features_init = []; // To be run at body.onload
var features = []; // To be run at makedrawing(). push new features that should be added if a certain file is present into this array as functions. This is here because helper is the first js file to be included.

function getlast(ar){
	return ar[ar.length-1];
}

///////////////////////////////////////////////////////////////////////////////
// Debug
///////////////////////////////////////////////////////////////////////////////
function debug(what, father){
	// what should be a string of variable names separated by spaces
	// father is the object that the variables belong to, or global scope if not provided 
	var vars = what.split(" ");
	var out = "";
	for (var i=0; i<vars.length; i++){
		// console.log("debug", vars[i]);
		if (father && vars[i].startsWith("this.")){
			out += vars[i] + " = " + eval(father+vars[i].replace("this","")) + "\n";
		} else {
			out += vars[i] + " = " + eval(vars[i]) + "\n";
		}
		
	}
	console.log(out);
}
///////////////////////////////////////////////////////////////////////////////
// JS and SVG related helper functions
///////////////////////////////////////////////////////////////////////////////
function Point(cx,cy, cz){
	// Point class for easier drawing
	this.x = cx || 0.0;
	this.y = cy || 0.0;
	if (cz !== undefined) this.z = cz;
	return this;
}
function Circle(cp, radius){
	// circle class, contains center point and radius
	this.iscircle = true;
	this.center = new Point(cp.x,cp.y);
	this.x = cp.x;
	this.y = cp.y;
	this.r = radius;
	return this;
}

function intersect_circle_above(c1,c2){
	// intersect two circle objects, actually positive semicircles
	
	var d = Math.sqrt((c1.x-c2.x)**2 + (c1.y-c2.y)**2);
	var l = (c1.r**2 - c2.r**2 + d**2) / (2*d);
	var h = Math.sqrt(c1.r**2 - l**2);
	var ix = (l/d)*(c2.x-c1.x) - (h/d)*(c2.y-c1.y) + c1.x;
	var iy = (l/d)*(c2.y-c1.y) + (h/d)*(c2.x-c1.x) + c1.y;
	console.log(ix,iy);
	return new Point(ix,iy);
}

function intersect_circle(c1,c2){
	// intersect two circle objects
	var d = Math.sqrt((c1.x-c2.x)**2 + (c1.y-c2.y)**2); // distance between circle centers
	if (d > c1.r + c2.r){console.log("circles don't touch");return false;} // 
	if (d == 0 && c1.r == c2.r){console.log("same circle");return false;} // 
	if (d < Math.abs(c1.r - c2.r)){console.log("circle inside the other");return false;} // 
	
	
	var a = (c1.r**2 - c2.r**2 + d**2) / (2*d); // distance from c1 to line between intersections
	var h = Math.sqrt(c1.r**2 - a**2); // distance to intersection from line connecting centers
	// var bp = c2.sub(c1).scale(a/d).add(c1); // point between circles
	var xb = c1.x + a * (c2.x-c1.x) / d;
	var yb = c1.y + a * (c2.y-c1.y) / d;
	
	var x3 = xb + h*(c2.y - c1.y)/d;
	var y3 = yb - h*(c2.x - c1.x)/d;
	var x4 = xb - h*(c2.y - c1.y)/d;
	var y4 = yb + h*(c2.x - c1.x)/d;
	
	return [new Point(x3,y3), new Point(x4,y4)];
}

Point.prototype.move = function (movex,movey,movez){
	// Add coordinates to old coordinates and return new Point
	var movey = movey || 0.0;
	if (this.z === undefined) {
		if (movez === undefined){
			return new Point(this.x+movex, this.y+movey);
		} else {
			return new Point(this.x+movex, this.y+movey, movez);
		}
	} else {
		if (movez === undefined){
			return new Point(this.x+movex, this.y+movey, this.z);
		} else {
			return new Point(this.x+movex, this.y+movey, this.z+movez);
		}
	}
	
}

Point.prototype.addpoint = function (newpoint){
	// Add coordinates of another point object to old coordinates and return new Point
	// return new Point(this.x+newpoint.x,this.y+newpoint.y);
	return this.move(newpoint.x,newpoint.y,newpoint.z);
}
Point.prototype.minuspoint = function (newpoint){
	// Find distance between points in x and y
	// return new Point(this.x-newpoint.x,this.y-newpoint.y);
	return this.move(-newpoint.x,-newpoint.y,-newpoint.z);
}
Point.prototype.flip = function (){
	// Flip x and y
	// TODO: specify axes to flip for 3D
	var oldx = this.x;
	this.x = y;
	this.y = oldx;
}
Point.prototype.rotate = function (rotpoint,angle){
	// TODO: Rotate around specified rotation point
	var oldx = this.x;
	this.x = y;
	this.y = oldx;
}
Point.prototype.scale = function (xscale,yscale,zscale){
	// Multiply coordinates by scale
	var x = this.x*xscale;
	var yscale = yscale || xscale;
	var y = this.y*yscale;
	if (this.isbezier){
		console.log("scaling a bezier");
		var x1 = (this.x1 - this.x)*xscale;
		var x2 = (this.x2 - this.x)*xscale;
		var y1 = (this.y1 - this.y)*yscale;
		var y2 = (this.y2 - this.y)*yscale;
		return new Point(x,y).relbezier(x1,y1,x2,y2);
	}
	if (this.z){
		var zscale = zscale || yscale;
		var z = this.z*zscale;
		return new Point(x,y,z);
	} else {
		return new Point(x,y);
	}
	
}


/* Point.prototype.movedist = function (dist,angle, around_axis){
	// Move from point coordinates by a certain length and angle and return new point
	// TODO: around_axis
	// upwards (negative y) is 0.0, right (positive y) is Math.PI/2
	return new Point(this.x+dist*Math.sin(angle), 
				     this.y-dist*Math.cos(angle));
}
*/
Point.prototype.movedist = function (dist,angle){
	// Move from point coordinates by a certain length and angle and return new point
	return new Point(this.x+dist*Math.sin(angle), 
				     this.y+dist*Math.cos(angle),
					 this.z || null);
}
Point.prototype.moveangle = function (dist,angle){
	// Move from point coordinates by a certain length and angle and return new point
	// Normalized angle function where north is 0 and + is clockwise
	while (angle >= 2*Math.PI){
		angle -= 2*Math.PI;
	}
	while (angle < 0){
		angle += 2*Math.PI;
	}
	if (angle < 0.5*Math.PI){
		return this.move(dist*Math.sin(angle), 
						-dist*Math.cos(angle));
	} else if (angle < Math.PI){
		return this.move(dist*Math.cos(angle-0.5*Math.PI), 
						dist*Math.sin(angle-0.5*Math.PI));
	} else if (angle < 1.5*Math.PI){
		return this.move(-dist*Math.sin(angle-Math.PI), 
						dist*Math.cos(angle-Math.PI));
	} else {
		return this.move(-dist*Math.cos(angle-1.5*Math.PI), 
						-dist*Math.sin(angle-1.5*Math.PI));
	}
}

// These objects only have enough data for drawing paths if the starting point is known
Point.prototype.bezier = function (cp1,cp2){
	// Convert this point into a bezier object
	this.isbezier = true;
	this.x1 = cp1.x;
	this.y1 = cp1.y;
	this.x2 = cp2.x;
	this.y2 = cp2.y;
	
	return this;
}

Point.prototype.relbezier = function (x1,y1,x2,y2){
	// Convert this point into a bezier object using coordinates relative to the end node
	this.isbezier = true;
	this.x1 = this.x + (x1 || 0);
	this.y1 = this.y + (y1 || 0);
	this.x2 = this.x + (x2 || 0);
	this.y2 = this.y + (y2 || 0);
	
	return this;
}
Point.prototype.smartbezier = function (x1,y1,x2,y2){
	// TODO: No access to previous segment....
	// Convert this point into a bezier object 
	// First coordinate is relative to start point, second relative to the end node
	this.isbezier = true;
	this.x1 = this.x + (x1 || 0);
	this.y1 = this.y + (y1 || 0);
	this.x2 = this.x + (x2 || 0);
	this.y2 = this.y + (y2 || 0);
	
	return this;
}
Point.prototype.arcthru = function (p1,p2,p3, f){ 
	// Draw arc that goes through all three points, return Point.arc for drawing an svg arc path segment. p1 should be the previous segment's end. p3 is this segment's end, and p2 is a point on the arc between p3 and p1.
	var chord1 = linelength(p1,p2);
	var chord2 = linelength(p2,p3);
	var angle1 = Math.atan2((p2.x-p1.x),(p2.y-p1.y));
	var angle2 = Math.atan2((p3.x-p2.x),(p3.y-p2.y));
	var p11 = p1.movedist(chord1/2,angle1);
	var p12 = p11.movedist(1000000,angle1+Math.PI/2);
	var p11 = p12.movedist(2000000,angle1-Math.PI/2);
	var p21 = p2.movedist(chord2/2,angle2);
	var p22 = p21.movedist(1000000,angle2+Math.PI/2);
	var p21 = p22.movedist(2000000,angle2-Math.PI/2);
	var cp = intersectline(p11,p12,p21,p22);
	// console.log("center",cp);
	var r = linelength(p1,cp);
	// var f = getelid("formlayer");
	var st = OCTSTYLE;
	var st2 = SEVENTHSTYLE;
	
	if (!cp) {
		// drawline(f,[p1,p2],st);
		// drawline(f,[p2,p3],st);
		// drawline(f,[p12,p11],st2);
		// drawline(f,[p22,p21],st2);
		
		return p3;
	}
	
	
	
	// console.log(cp);
	return p3.arc(r,r,0,0,1);
}
Point.prototype.arc = function (rx, ry, xrot, largearc, sweep){
	// Convert this point into an arc for drawing svg paths. this.x,y are the endpoint
	// xrot, largearc, sweep should be 0 or 1
	this.isarc = true;
	this.rx = rx; // radius on x-axis
	this.ry = ry;
	this.xrot = xrot; // direction of x-axis
	this.largearc = largearc;
	this.sweep = sweep;
	
	return this;
}

function Arc (center,radius,a1,a2){
	// Create Arc object. Default is the above X axis part of the unit circle centered at origin.
	// The filled part of the arc is understood to be clockwise from a1 to a2
	this.center = center || new Point(0,0);
	this.radius = this.radius || 1;
	this.a1 = a1 || Math.PI/2*3;
	this.a2 = a2 || Math.PI/2;
}
arctobezier = function (p1,p2,radius_or_center, clockwise, largearc){
	if (largearc) console.log("arctobezier: largearc is not implemented yet but it shouldn't be too hard to do.");
	// TODO: method for using center point sometimes fails
	// Always returns an array of bezier objects
	// Perfect circle quadrant as a bezier command, radius 100:
	// m 0,0 c 0,-55.228474		44.77152,-100	100,-100
	// tangent to circle
	// each control point is located at almost 1/3 the angle of the arc segment
	// 1/8 of a circle as bezier, radius 100
	// m 0,0 c 0,-27.558474 	11.147721,-52.513259 	29.179775,-70.600964
	// Math.atan(55.228747 / 100)
	// 0.5045977293756361
	var radius, center;
	if (typeof radius_or_center == "number"){
		// We got a radius, so find center
		// TODO: Currently this assumes smaller possible circle
		radius = radius_or_center;
		// Location of center depends on clockwise
		var a = normangle(p1,p2);
		var ll = 0.5*linelength(p1,p2);
		var mp = p1.moveangle(ll, a); // Point between p1 & p2
		// drawcircle(getelid("frontview"), mp, 2, REDSTYLE);
		// drawshape(getelid("frontview"),[p1,p2],REDSTYLE);
		var b = Math.sqrt(radius**2-ll**2);
		if (clockwise) {
			center = mp.moveangle(b, a+Math.PI*0.5);
		} else {
			center = mp.moveangle(b, a-Math.PI*0.5);
		}
		// drawcircle(getelid("frontview"), center, 1, REDSTYLE);
	} else { // We got a center Point so calculate the radius
		center = radius_or_center;
		radius = linelength(center,p1);
		var radius2 = linelength(center,p2);
		
		if (radius2.toFixed(4) != radius.toFixed(4)) {
			console.log("arctobezier: radiuses do not match. Using average. ",radius,radius2);
			radius = radius+radius2/2.0;
		}
	}
	// var clockwise = clockwise || true;
	// console.log(clockwise);
	var cplength = 0.55228474; // cplength*radius if 90deg circle segment
	var cpangle = 0.3212368916123159; // percentage of angle of circle segment
	var beziers = [];
	
	 
	// if angle between points is larger than 90deg, break into segments
	// Find new points along the circumference every 90deg
	var a1 = normangle(center,p1); // Normalize angles to positive numbers
	var a2 = normangle(center,p2);
	
	// console.log("angles at first",a1,a2);
	if (clockwise && (a1 > a2)) { 
		// a2 must be larger than a1, so if it isn't, make it so
		a2 += Math.PI*2;
	} //else if (!clockwise && a1 < a2){
		// a1 += Math.PI*2;
	// }
	var angledelta = a2-a1; // Size of arc in radians
	// console.log(!clockwise);
	if (!clockwise) {angledelta = 2*Math.PI - angledelta;}
	// TODO: if clockwise and angledelta = a2-a1 ==> largesweep
	
	// console.log("angles",a1,a2, "angledelta",angledelta);
	var outp = [];
	
	function makesegment(startp,endp,ang){
		
		var ca1 = normangle(center,startp);
		var ca2 = normangle(center,endp);
		var cple = radius*Math.tan(cpangle*ang);
		// if (clockwise) {
			var cp1 = startp.moveangle(cple, ca1+0.5*Math.PI*dir);
			var cp2 = endp.moveangle(cple, ca2-0.5*Math.PI*dir);
		// } else {
			// var cp1 = startp.moveangle(cple, ca1-0.5*Math.PI);
			// var cp2 = endp.moveangle(cple, ca2+0.5*Math.PI);
		// }
		
		// drawcircle(getelid("frontview"), startp, 1, PURPLESTYLE);
		// drawcircle(getelid("frontview"), cp1, 1, GREENSTYLE);
		// drawshape(getelid("frontview"),[startp,cp1],GREENSTYLE);
		// drawcircle(getelid("frontview"), cp2, 1, BLUESTYLE);
		// drawshape(getelid("frontview"),[endp,cp2],BLUESTYLE);
		outp.push(endp.bezier(cp1,cp2));
		// console.log("makesegment",ang,ca1,ca2,cple,cp1,cp2);
		
	}
	// Split arc into max 90deg segments
	var dir = 1;
	if (!clockwise ) dir = -1; // && largearc ???
	var incr_a = 0.5*Math.PI;
	var cur_a = incr_a;
	var curp = p1;
	var endp;
	while (cur_a < angledelta){
		// Calculate a point along the circle
		// console.log("in while",cur_a, angledelta);
		var endp = center.moveangle(radius, a1+cur_a*dir);
		makesegment(curp,endp,incr_a);
		cur_a += incr_a;
		curp = endp;
	}
	// Make the last segment from curp to p2. This might also be the only one that gets made, if the specified arc was less than 90deg
	makesegment(curp, p2,angledelta-cur_a+incr_a);
	// console.log("final angles",angledelta,cur_a,incr_a);
	// console.log("outp",outp);
	return outp;
}

Point.prototype.flipsign = function (axis) {
	if (axis=="x"){
		if (this.z === undefined){
			return new Point(-this.x, this.y);
		} else {
			return new Point(-this.x, this.y, this.z);
		}
	} else if (axis=="y"){
		if (this.z === undefined){
			return new Point(this.x, -this.y);
		} else {
			return new Point(this.x, -this.y, this.z);
		}
	} else if (axis=="z"){
		return new Point(this.x, this.y, -this.z || 0.0);
	} 
}
function normangle(p1,p2){
	// Normalized angle function where north is 0 and + is clockwise
	var x = Math.abs(p2.x - p1.x);
	var y = Math.abs(p2.y - p1.y);
	
	if (p2.y <= p1.y && p2.x >= p1.x){ // up right
		// console.log("up right");
		return Math.atan(x/y);
	} else if (p2.y >= p1.y && p2.x >= p1.x){ // down right
		// console.log("down right");
		return 0.5*Math.PI+Math.atan(y/x);
	} else if (p2.y >= p1.y && p2.x <= p1.x){ // down left
		// console.log("down left");
		return Math.PI+Math.atan(x/y);
	} else { // up left
		// console.log("up left");
		return 1.5*Math.PI+Math.atan(y/x);
	}
	
}
function getangle(p1,p2){
	// return Math.atan2(p1,p2);
	return Math.atan((p1.x-p2.x)/(p1.y-p2.y));
}
function linelength(p1,p2){
	if (p1 === undefined || p2 === undefined) return undefined;
	if (p1.z !== undefined && isNaN(p1.z)) p1.z = 0.0;
	if (p2.z !== undefined && isNaN(p2.z)) p2.z = 0.0;
	if (p1.z === undefined && p2.z === undefined){
		// console.log("linelength no z",p1,p2);
		return Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2);
	} else if (p1.z === undefined && !(p2.z === undefined)){
		return Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2 + (p2.z)**2);
	} else if (p2.z === undefined && !(p1.z === undefined)){
		return Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2 + (0-p1.z)**2);
	} else {
		return Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2 + (p2.z-p1.z)**2);
	}
}

function flatlinelength(p1,p2){
	// Ignore z coordinates
	return Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2);
}


Point.findmax = function(array,coord,minmax){ 
	// find coordinate in an array of points, return index
	// TODO: Why is this Point.findmax()?
	var max = 0,
		mini = 1000000000,
		a = array.length,
		counter,
		maxcounter= 0,
		minmax = minmax || "max",
		coord = coord || "x";
	
	for (counter=0;counter<a;counter++){
		if (minmax=="max"){
			if (array[counter][coord] > max){
			  max = array[counter][coord];
			  maxcounter = counter;
			}
		} else {
			if (array[counter][coord] < mini){
			  mini = array[counter][coord];
			  maxcounter = counter;
			}
		}
		
	}
	return maxcounter;
}
/////////////////////////////////////////////////////////////

function getelid(id){
	if (id){
		return document.getElementById(id);
	} else {
		return false;
	}
}

function delelid(elid){
	var d = document.getElementById(elid);
	delel(d);
}
function delel(el){
	if (el){el.parentNode.removeChild(el);}
}
function addel(to,newel){
	to.appendChild(newel);
}
function addelafter(to,newel){
	to.parentNode.insertBefore(newel, to.nextSibling);
}
function addelbefore(to,newel){
	to.parentNode.insertBefore(newel, to);
}
function delchildren(el){
	while (el.children.length>0){
		el.removeChild(el.children[0]);
	}
}
function creel(tagname, id, cla, attrs, NS, del){
	var exists = getelid(id);
	if (exists){
		var n = exists;
		if (del){
			delchildren(n);
		}
	} else {
		if (NS){
			var n = document.createElementNS(NS, tagname);
		} else {
			var n = document.createElement(tagname);
		}
		if (id){ n.id = id;}
	}
	if (cla) {n.className=cla;}
	if (attrs){
		for (var i=0; i<attrs.length; i=i+2){
			// console.log(tagname,id,cla,attrs[i],attrs[i+1]);
			// if (attrs[i] == "cx"){
				// console.log(id, attrs[i+1]);
			// }
			n.setAttribute(attrs[i],attrs[i+1]);
		}
	}
	return n;
}
function creel_empty(tagname, id, cla, attrs, NS){
	// Create element, or use existing one if it exists already, but delete its contents
	if (NS){
		var n = document.createElementNS(NS, tagname);
	} else {
		var n = document.createElement(tagname);
	}
	return creel(tagname, id, cla, attrs, NS, true);
}
//////////////////////////////////////////////////////////////////////////////
// 
function insert_drawing(fromsvg, id, togroup, topoint, rotate, rotpoint){
	// Insert an svg group from technical drawing presets into the drawing
	var fromsvg = fromsvg || getelid("svg-general").getSVGDocument();
	
	if (fromsvg.getElementById(id) === null){
		console.log("did not find " + id);
		return;
	}
	var item = fromsvg.getElementById(id).cloneNode(true);
	
	var t = "translate("+topoint.x+" "+topoint.y+")";
	if (rotate) {
		var rotpoint = rotpoint || new Point(0,0)
		t += "rotate("+rotate+" "+(rotpoint.x) +" "+(rotpoint.y) +")";
	}
	item.setAttribute("transform", t);
	
	addel(togroup, item);
	return item;
}


//////////////////////////////////////////////////////////////////////////////
// Functions for paths
//////////////////////////////////////////////////////////////////////////////

function drawline (c,points, style,id){
	// Method for svg paths
	var d = "M"+points[0].x.toFixed(DIGITS)+","+points[0].y.toFixed(DIGITS)+" L"+points[1].x.toFixed(DIGITS)+","+points[1].y.toFixed(DIGITS);
	var p = creel("path", id, "", ["d",d], NAMESPACE);
	if (style){
		p.setAttribute("style",style);
	} else {
		p.setAttribute("style",THINSTYLE);
	}
	addel(c, p);
	return p;
}

function drawarc (c, p1, p2, rx,ry, xrot, largearc, sweep, style, id){
	var ry = ry || rx;
	var xrot = xrot || 0;
	var largearc = largearc || 0;
	var sweep = sweep || 0;
	
	// Method for drawing a single arc segment path
	var d = "M"+p1.x.toFixed(DIGITS)+","+p1.y.toFixed(DIGITS)+" A"+rx.toFixed(DIGITS)+","+ry.toFixed(DIGITS)+ " " + xrot + " " + largearc + "," + sweep + " " + +p2.x.toFixed(DIGITS)+","+p2.y.toFixed(DIGITS);
	var p = creel("path", id, "", ["d",d], NAMESPACE);
	if (style){
		p.setAttribute("style",style);
	} else {
		p.setAttribute("style",NOFILLTHIN);
	}
	addel(c, p);
	return p;
}


function drawshape(c, points,style,id, z){
	if (z === undefined) z = true;
	// Draw path composed of many straight line segments, z= close path
	// Or beziers with two control points
	if (!points || !points[0]) {console.log("drawshape: points[0] is empty");return;}
	var d = "M"+points[0].x.toFixed(DIGITS)+","+points[0].y.toFixed(DIGITS);
	for (var i = 1; i< points.length; i++){
		if (!points[i]) {console.log("drawshape: points["+i+"] is empty");return;}
		if (points[i].isbezier){ // Bezier if 
			d += " C"+points[i].x1.toFixed(DIGITS)+","+points[i].y1.toFixed(DIGITS) +" "
					 +points[i].x2.toFixed(DIGITS)+","+points[i].y2.toFixed(DIGITS) +" "
					 +points[i].x.toFixed(DIGITS) +","+points[i].y.toFixed(DIGITS)  +" ";
		} else if (points[i].isarc){
			d += " A"+points[i].rx.toFixed(DIGITS)+","
					+points[i].ry.toFixed(DIGITS)+ " " 
					+ points[i].xrot + " " + points[i].largearc 
					+ "," + points[i].sweep + " " 
					+points[i].x.toFixed(DIGITS)+","
					+points[i].y.toFixed(DIGITS);
		} else {
			d += " L"+points[i].x.toFixed(DIGITS)+","+points[i].y.toFixed(DIGITS);
		}
		
	}
	if (z) d += "z";
	
	var p = creel("path", id, "", ["d",d], NAMESPACE);
	if (style){
		p.setAttribute("style",style);
	} else {
		p.setAttribute("style",THINSTYLE);
	}
	addel(c, p);
	return p;
}
function drawshaperel(c, points,style,id, z){
	if (z === undefined) z = true;
	// Draw path composed of many straight line segments, z= close path
	// Or beziers with two control points
	// Relative mode, so each 
	var running = new Point(points[0].x,points[0].y);
	// TODO: this function
	var d = "M"+points[0].x.toFixed(DIGITS)+","+points[0].y.toFixed(DIGITS);
	for (var i = 1; i< points.length; i++){
		
		if (points[i].isbezier){ // Bezier if 
			d += " c"+points[i].x1.toFixed(DIGITS)+","+points[i].y1.toFixed(DIGITS) +" "
					 +points[i].x2.toFixed(DIGITS)+","+points[i].y2.toFixed(DIGITS) +" "
					 +points[i].x.toFixed(DIGITS) +","+points[i].y.toFixed(DIGITS)  +" ";
		} else if (points[i].isarc){
			d += " a"+points[i].rx.toFixed(DIGITS)+","
					+points[i].ry.toFixed(DIGITS)+ " " 
					+ points[i].xrot + " " + points[i].largearc 
					+ "," + points[i].sweep + " " 
					+points[i].x.toFixed(DIGITS)+","
					+points[i].y.toFixed(DIGITS);
		} else {
			d += " l"+points[i].x.toFixed(DIGITS)+","+points[i].y.toFixed(DIGITS);
		}
		
	}
	if (z) d += "z";
	
	var p = creel("path", id, "", ["d",d], NAMESPACE);
	if (style){
		p.setAttribute("style",style);
	} else {
		p.setAttribute("style",THINSTYLE);
	}
	addel(c, p);
	return p;
}
function drawpolygon (c, points,style,id){
	var poi="";
	for (var i = 0; i< points.length; i++){
		poi += " "+points[i].x.toFixed(DIGITS)+","+points[i].y.toFixed(DIGITS);
	}
	var p = creel("polygon",id, "", ["points",poi], NAMESPACE);
	if (style){
		p.setAttribute("style",style);
	} else {
		p.setAttribute("style",THINSTYLE);
	}
	addel(c, p);
	
}
function drawtext(c, point, inner, style,id){
	var t = creel("text",id,"",["x",point.x.toFixed(DIGITS),"y",point.y.toFixed(DIGITS)], NAMESPACE);
	if (style){
		t.setAttribute("style",style);
	} else {
		t.setAttribute("style",TEXTSTYLE);
	}
	t.innerHTML = inner;
	addel(c, t);
	return t;
}
function drawrect(c, point, size, style,id){
	var t = creel("rect",id,"",
		["x",point.x.toFixed(DIGITS),
		"y",point.y.toFixed(DIGITS),
		"width",size.w.toFixed(DIGITS),
		"height",size.h.toFixed(DIGITS)], NAMESPACE);
	if (style){
		t.setAttribute("style",style);
	} else {
		t.setAttribute("style",BOXSTYLE);
	}
	var c = c || getelid("debuglayer");
	addel(c, t);
	return t;
}
function drawcircle(c, point, radius, style,id){
	var t = creel("circle",id,"",
		["cx",point.x.toFixed(DIGITS),
		"cy",point.y.toFixed(DIGITS),
		"r",radius.toFixed(DIGITS)], NAMESPACE);
	if (style){
		t.setAttribute("style",style);
	} else {
		t.setAttribute("style",BOXSTYLE);
	}
	
	var c = c || getelid("debuglayer");
	addel(c, t);
	return t;
}

function drawellipse(c, point, rx, ry, style,id){
	var t = creel("ellipse",id,"",
		["cx",point.x.toFixed(DIGITS),
		"cy",point.y.toFixed(DIGITS),
		"rx",rx.toFixed(DIGITS),
		"ry",ry.toFixed(DIGITS)], NAMESPACE);
	if (style){
		t.setAttribute("style",style);
	} else {
		t.setAttribute("style",BOXSTYLE);
	}
	
	var c = c || getelid("debuglayer");
	addel(c, t);
	return t;
}
function makegroup(c, groupname, inkscapelayer){
	var p = creel("g", groupname, "", [], NAMESPACE);
	if (inkscapelayer){
		p.setAttribute("inkscape:label",inkscapelayer);
		p.setAttribute("inkscape:groupmode","layer");
	} 
	addel(c, p);
	return p;
}

function makeimage(to, id, source, pos,size, preserveAspectRatio){
	// Make image tag
	if (preserveAspectRatio === true) {preserveAspectRatio = "xMinYMin";}
	
	var p = creel("image", id, "", ["href",source,"x",pos.x.toFixed(DIGITS),"y",pos.y.toFixed(DIGITS),"width",size.w.toFixed(DIGITS),"height",size.h.toFixed(DIGITS), "preserveAspectRatio",preserveAspectRatio], NAMESPACE);
	addel(to, p);
	return p;
}

function marklength (to, points, side){
	// Do squigly curvy length marker on the drawing
	
	var mlength = Math.sqrt(Math.abs((points[1].x-points[0].x)**2+
									 (points[1].y-points[0].y)**2));
	var mangle = Math.atan((points[0].x-points[1].x)-(points[0].y-points[1].y));
	// console.log("Folded length:", mlength);
	
	/* var d = ["M", coords.x, coords.y];
	d = d.concat(["C", sidex-60, exty4, sidex-70, exty4+10,sidex-68, exty4+30]);
	d = d.concat(["L", sidex-25, sidey-10]); // Start off curve 
	d = d.concat(["C", sidex-25, sidey+10, sidex-20, sidey+35, sidex, sidey+40]);

	d = d.join(" ");
	var extside = creel("path", "ext-side", "", ["d",d], NAMESPACE);
	extside.setAttribute("style",COVERSTYLE);
	addel(sideview, extside);	 */
	
	
	
}
///////////////////////////////////////////////////////////////////////////////
// SVG Path and object operations
///////////////////////////////////////////////////////////////////////////////


function extractpath(d){
	// returns path as an array of command letters with their coords
	var ltrs = "MmCcLlHhVvZzSsQqTtAa";
	var output = [];
	var j = -1;
	var numbers= "";
	for (var i=0; i < d.length; i++){
		if (ltrs.indexOf(d[i]) >= 0){
			// is command letter, start new object and put numberbuffer in previous command
			if (output[j]){
				output[j]["numbers"] = numbers;
				// empty number buffer
				numbers="";
			}
			j++;
			output[j] = {"letter": d[i], "numbers": ""};
			
		} else {
			numbers += d[i];
		}
	}
	if (numbers){output[j]["numbers"] = numbers;}
	// Break numbers apart into objects
	for (var i=0; i < output.length; i++){
		function strip(str) {
			return str.replace(/^\s+|\s+$/g, '');
		}
		var t = strip(output[i]["numbers"].replace(/,/g," ")).split(" ");
		for (var j=0; j < t.length; j++){
			if (t[j]){
				t[j] = parseFloat(t[j]);
			}
		}
		output[i]["numbers"] = t;
	}
	// console.log("extracted",output);
	return output;
}
function makedtext(d){
	// output usable d string for svg path
	var output = "";
	// incomplete
	for (var i=0; i < d.length; i++){
		output += d[i]["letter"]+ " ";
		// console.log(d);
		for (var j=0; j < d[i]["numbers"].length; j++){
			output += d[i]["numbers"][j].toFixed(4)+ " "
		}
	}
	return output;
}
function makerelative(el){
	// TODO: Use path.pathSegList[], probably more difficult to break. And they broke it!
	// console.log(el);
	var d = el.pathSegList;
	// Makes a path relative
	//TODO: Probably destroys arcs, and is not otherwise complete anyway
	var ltrs = "MCLHVZSQTA";
	// var d = extractpath(d);
	// var p0 = new Point(d.getItem(0).x,d.getItem(0).y);
	// console.log(x,y);
	var firstp = d.getItem(0);
	var prevseg = new Point(firstp.x, firstp.y);
	for (var i=1; i < d.numberOfItems; i++){
		
		var seg = d.getItem(i);
		var thisp = new Point(seg.x, seg.y);
		
		if (ltrs.indexOf(seg.pathSegTypeAsLetter) >= 0){
			
			// var relp = new Point(seg.x-prevseg.x, seg.y-prevseg.y);
			var relp = new Point(thisp.x-prevseg.x, thisp.y-prevseg.y);

			
			if (seg.pathSegTypeAsLetter == "A"){
				//undefined, some numbers are booleans
				console.log("Found an arc in path and can't figure out how to make it relative.");
			} else if (seg.pathSegTypeAsLetter == "C"){
				// Make new relative segment and replecItem it into the seglist
				// var newSegment  =el.createSVGPathSegArcAbs(100,200,10,10,Math.PI/2,true,false)
				// el.createSVGPathSegLinetoRel(0,0)
				// el.createSVGPathSegArcRel
				var cp1 = new Point(seg.x1-prevseg.x, seg.y1-prevseg.y);
				var cp2 = new Point(seg.x2-prevseg.x, seg.y2-prevseg.y);
				
				d.replaceItem(el.createSVGPathSegCurvetoCubicRel(relp.x, relp.y, cp1.x, cp1.y, cp2.x, cp2.y), i);
			} else if (seg.pathSegTypeAsLetter == "L"){
				d.replaceItem(el.createSVGPathSegLinetoRel(relp.x, relp.y), i);
			}
			prevseg = new Point(seg.x, seg.y); // For next segment
		} else {
			// already relative segment so... probably increment running?
			console.log("Encountered relative path segment when converting to a relative path. This is not yet supported. Your path might look a bit funny now.");
		}
		
	}
	// creel_empty(tagname,id,cla,attrs,NS);
	return d;
}
/* function positionpath(pathd, tocoords){
	// Change path d so that the M command points to tocoords
	var d = extractpath(pathd);
	// console.log("before rel", d);
	// console.log("before", makedtext(d));
	d = makerelative(d);
	// console.log("after rel", d);
	// console.log("after", makedtext(d));
	var x = d[0]["numbers"][0];
	var y = d[0]["numbers"][1];
	d[0]["numbers"][0] = tocoords[0];
	d[0]["numbers"][1] = tocoords[1];
	// console.log("made", makedtext(d));
	return makedtext(d);
	// return output;
	// TODO: This is not in use because some paths become warped byt his
	
} */
function movepath(path, point){
	// Change path starting coordinates
	//
	// console.log("movepath", path, point);
	var p = path.pathSegList.getItem(0);
	p.x = point.x;
	p.y = point.y;
	
}


function scalepath(pa, s){
	// Scale path by applying scale to all points of the path
	// Ignore first point
	var seglist = pa.pathSegList;
	// console.log(seglist);
	for (var i=1; i < seglist.numberOfItems; i++){
		var seg = seglist.getItem(i);
		var p = new Point(seg.x*s, seg.y*s);

		if (seg.pathSegTypeAsLetter == "a"){
			//undefined, some numbers are booleans
			console.log("Found an arc in the path and can't bother.");
		} else if (seg.pathSegTypeAsLetter == "c"){

			var cp1 = new Point(seg.x1*s, seg.y1*s);
			var cp2 = new Point(seg.x2*s, seg.y2*s);
			
			seglist.replaceItem(pa.createSVGPathSegCurvetoCubicRel(p.x, p.y, cp1.x, cp1.y, cp2.x, cp2.y), i);
		} else if (seg.pathSegTypeAsLetter == "l"){
			seglist.replaceItem(pa.createSVGPathSegLinetoRel(p.x, p.y), i);
		}
	}
}
function positionpath_transform(el,point){
	// Position group element using transform
	// Get path start point
	var d = extractpath(el.getAttribute("d"));
	var x = (-d[0]["numbers"][0]+point.x).toFixed(4);
	var y = (-d[0]["numbers"][1]+point.y).toFixed(4);
	var t = "translate("+x+","+y+")";
	el.setAttribute("transform",t);
	
}

function copyelement(group, el, point, style){
	// Copies the given svg element into the specified group
	// console.log(group, el, point, style);
	// console.log("before clone in copyelement",el);
	var cln = el.cloneNode(true);
	// console.log("after clone in copyelement",cln);
	// position path by replacing its M command
	// cln.setAttribute("d",positionpath(cln.getAttribute("d"), coords));
	
	// console.log("before movepath in copyelement",cln);
	movepath(cln, point);
	// console.log("after movepath in copyelement",cln);
	// positionpath_transform(cln, coords);
	if (style){
		cln.setAttribute("style",style);
	}
	
	// put in svg in group
	// console.log("before addel in copyelement",cln);
	addel(group, cln);
	// console.log("after addel in copyelement",cln);
	return cln;
	
}
function mirror(p, orientation){
	// Mirrors svg element in place
	var orig_t = p.getAttribute("transform") || "";
	var bb = p.getBBox();
	if (orientation.indexOf("h") >= 0){
		// Flip horizontally
		var w = bb.x*2+bb.width;
		var t = "translate("+w.toFixed(3)+",0) scale(-1, 1)";
	} else {
		var h = bb.y*2+bb.height;
		var t ="translate("+h.toFixed(3)+",0) scale(1, -1)";
	}
	p.setAttribute("transform",orig_t+" "+t+" ");
	
}
function move(el,point) {
	// Move element by adding transform
	var orig_t = el.getAttribute("transform") ? el.getAttribute("transform"):"" ;
	// console.log(orig_t);
	var bb = el.getBBox();
	if (point == "width"){
		var point = new Point(-bb.width,0);
		// point.x = bb.width;
	} 
	if (point == "height"){
		var point = new Point(0,-bb.width);
		// point.y = bb.height;
	} 
	var t ="translate("+point.x.toFixed(3)+","+point.y.toFixed(3)+") ";
	el.setAttribute("transform",orig_t+" "+t);
	// el.setAttributeNS(NAMESPACE,"transform",orig_t+" "+t);
}
function mirrorpath(group, path, vertical){
	// Mirror path d coordinates, maintain first point, return new path
	// Clone new element from path
	var cln = path.cloneNode(true);
	// if (style){
		// cln.setAttribute("style",style);
	// }
	p1 = cln;
	var ltrs = "CLHVZSQTA"; // Absolute coordinate commands
	var seglist = cln.pathSegList;
	for (var i=1; i<seglist.numberOfItems;i++ ){
		var seg = seglist.getItem(i);
		if (ltrs.indexOf(seg.pathSegTypeAsLetter) >=0){
			console.log("mirrorpath(): Path contains absolute segment:",path);
		}
		if (vertical){
			// Mirror vertically
			console.log("mirrorpath(): Vertical mirror not implemented yet:",path);
		} else {
			if (seg.pathSegTypeAsLetter == "a"){
				// Mirroring an arc segment
				// console.log("mirrorpath(): Arc segment:",seg);
				// console.log(seg.sweepFlag);
				seg.sweepFlag = false;
				// console.log(seg.sweepFlag);
			}
			// Mirror horizontally
			seg.x = -seg.x;
			if (seg.x1) seg.x1 = -seg.x1;
			if (seg.x2) seg.x2 = -seg.x2;
			
		}
	}
	// put in svg in group
	cln.id += "-mirrored";
	addel(group, cln);
	return cln;
}

function breakpath(path){
	// TODO: Not finished
	// Break every segment into a separate path, return list of paths
	var seglist = path.pathSegList;
	var pathlist = [];
	console.log(seglist);
	var a = ["x","y","x1","y1","x2","y2"];
	
	function makecommand(seg){
		var out= "";
		for (var property in seg) {
			if (a.indexOf(property)>=0) {
				out += " " + property;
			}
		}
		return out;
	}
	var curx = seglist[0].x;
	var cury = seglist[0].y;
	// First new path is just first m and second command from original path
	var m = seglist[0].pathSegTypeAsLetter + " " + seglist[0].x
	pathlist.push();
	for (var i=1; i<seglist.length;i++){
		var m =0;
		pathlist.push();
		
		curx += seglist[i].x;
		cury += seglist[i].y;
	}
	return pathlist;
}
function path_calculate_cursor_pos(path){
	// Calculate svg virtual paintbrush/cursor position given path and number of segments moved along it. Return list of positions, one per segment.
	var seglist = path.pathSegList;
	var ltrs = "clhvzsqta";
	var absltrs = "CLHVZSQTA";
	var output = [];
	var last_abs = 0;
	// var handles = getelid("handlelayer");
	for (var i=0; i<seglist.length; i++){
		var seg = seglist[i];
		if (ltrs.indexOf(seg.pathSegTypeAsLetter)>=0){
			// relative movement
			output.push({"x": output[output.length-1].x+seg.x, 
						 "y": output[output.length-1].y+seg.y});
		} else if (seg.pathSegTypeAsLetter =='m' 
				|| seg.pathSegTypeAsLetter =='M'){
			output.push({"x": seg.x, "y": seg.y});
		}  else if (absltrs.indexOf(seg.pathSegTypeAsLetter)>=0){
			// Absolute segment
			// console.log("abs",i,seg.x,seg.y);
			output.push({"x": seg.x, "y": seg.y});
			last_abs = i;
		} 
		// drawcircle(handles, [output[i].x,output[i].y,4], SEVENTHSTYLE,"point-"+i);
	}
	// console.log("cursor",output);

	return output;
}
function greaterof(a,b){if (a>=b){return a;} else {return b;}}
	function smallerof(a,b){if (a<=b){return a;} else {return b;}}
	function isbetween(a,b,c){
		var greater = greaterof(a,c);
		var smaller = smallerof(a,c);
		return (b >= smaller && b <= greater);
	}
function intersectline(p1,p2,     p3,p4,	dontcheckbounds) {
	
	// p1 and p2 are the start end end points of one line, likewise for p3 and p4
	// Return intersect coordinates of two lines
	// y = mx+b
	var m1 = (p2.y-p1.y) / (p2.x-p1.x);
	var m2 = (p4.y-p3.y) / (p4.x-p3.x);
	// p1.y = m1*p1.x +b1
	// b1 = p1.y-m1*p1.x 
	var b1 = p1.y-m1*p1.x;
	var b2 = p3.y-m2*p3.x;
	// y = m1*x+b1
	// m1*x+b1 = m2*x+b2
	// m1*x + b1 - b2 = m2*x
	// m2*x - m1*x = b1 - b2
	// (m2-m1)*x = b1 - b2
	var x = (b1 - b2) / (m2-m1);
	if (isNaN(x)) { // if x,y = NaN, one line was vertical, m&b will also be NaN
		if (p1.x==p2.x) {
			x=p1.x;
			var y = m2*x + b2;
		}
		else if (p3.x==p4.x) {
			x=p3.x;
			var y = m1*x + b1;
		}
	} else {
		var y = m1*x + b1;
	}
	
	// TODO: if one is horizontal, sometimes this still fails. Maybe add 0.000000000001 to one y coordinate?
	// TODO: What if lines are colinear?
	if (dontcheckbounds){
		return new Point(x,y);
	}
	if (isbetween(p1.x,x,p2.x) && isbetween(p1.y,y,p2.y) 
		&& isbetween(p3.x,x,p4.x) && isbetween(p3.y,y,p4.y)){
		return new Point(x,y);
	} else { return false;}
};


function intersectBBox(r1, r2) {

	r1.right = (r1.x + r1.width);
	r1.bottom = r2.y+ r1.height;
	r2.right = r2.x + r2.width;
	r2.bottom = r2.y+ r2.height;
	// Is some part of rectangles on top of each other?
	var intersects = !(r2.x > r1.right || 
			 r2.right < r1.x || 
			 r2.y > r1.bottom ||
			 r2.bottom < r1.y);
	// Then get points
	
	function greaterof(a,b){if (a>=b){return a;} else {return b;}}
	function smallerof(a,b){if (a<=b){return a;} else {return b;}}
	if (intersects){
		var ir = {};
		ir.x = greaterof(r1.x, r2.x);
		ir.y = greaterof(r1.y, r2.y);
		ir.right = smallerof(r1.right, r2.right);
		ir.bottom = greaterof(r1.bottom, r2.bottom);
		ir.width = ir.right - ir.x;
		ir.height = ir.bottom - ir.y;
		return ir;
	} else {
		return false;
	}
}
function convertToAbsolute(path){
	// https://embed.plnkr.co/a4GIp0/
  var x0,y0,x1,y1,x2,y2,segs = path.pathSegList;
  for (var x=0,y=0,i=0,len=segs.numberOfItems;i<len;++i){
    var seg = segs.getItem(i), c=seg.pathSegTypeAsLetter;
    if (/[MLHVCSQTA]/.test(c)){
      if ('x' in seg) x=seg.x;
      if ('y' in seg) y=seg.y;
    }else{
      if ('x1' in seg) x1=x+seg.x1;
      if ('x2' in seg) x2=x+seg.x2;
      if ('y1' in seg) y1=y+seg.y1;
      if ('y2' in seg) y2=y+seg.y2;
      if ('x'  in seg) x += seg.x;
      if ('y'  in seg) y += seg.y;

      switch(c){
        case 'm': segs.replaceItem(path.createSVGPathSegMovetoAbs(x,y),i);                   break;
        case 'l': segs.replaceItem(path.createSVGPathSegLinetoAbs(x,y),i);                   break;
        case 'h': segs.replaceItem(path.createSVGPathSegLinetoHorizontalAbs(x),i);           break;
        case 'v': segs.replaceItem(path.createSVGPathSegLinetoVerticalAbs(y),i);             break;
        case 'c': segs.replaceItem(path.createSVGPathSegCurvetoCubicAbs(x,y,x1,y1,x2,y2),i); break;
        case 's': segs.replaceItem(path.createSVGPathSegCurvetoCubicSmoothAbs(x,y,x2,y2),i); break;
        case 'q': segs.replaceItem(path.createSVGPathSegCurvetoQuadraticAbs(x,y,x1,y1),i);   break;
        case 't': segs.replaceItem(path.createSVGPathSegCurvetoQuadraticSmoothAbs(x,y),i);   break;
        case 'a': segs.replaceItem(path.createSVGPathSegArcAbs(x,y,seg.r1,seg.r2,seg.angle,seg.largeArcFlag,seg.sweepFlag),i);   break;
        case 'z': case 'Z': x=x0; y=y0; break;
      }
    }
    if (c=='M' || c=='m') x0=x, y0=y;
  }
}

function planey3dline (p1,p2, yval){
	// p1,p2 should be Point objects with 3 axes
	// yval 
	// var axis = axis || "y";
	// First find x coordinate
	// var x = intersectline(p1,p2,  new Point(p1.x));
	var x = p1.x +((p1.y-yval)*(p2.x-p1.x))/(p1.y-p2.y)
	var z = p1.z +((p1.y-yval)*(p2.z-p1.z))/(p1.y-p2.y)
	
	// Find z coordinate
	
	return new Point(x,yval,z);
}


////////////////////////////////////////////////////////////////////////////////
// Fast path intersections using some higher level math
function pathline_intersect (path,line,debug){
	// Intersect any svg path and a line segment, where line is an array of Point objects, whose coordinates are absolute
	// Loops through the whole path but stops when the first intersection is found, returns false if nothing was found
	// Will probably find intersections for M,m path commands too
	
	var seglist = path.pathSegList;
	// console.log("pathline_intersect", seglist);
	// if (path.pathSegList._list === undefined){
		// console.log("pathline_intersect", path.pathSegList);
		
	// } else if (path.pathSegList._list !== undefined){
		// console.log("pathline_intersect._list", path.pathSegList);
		// var seglist = path.pathSegList._list;
	// } else if (path.pathSegList._list._list !== undefined){
		// console.log("pathline_intersect._list._list", path.pathSegList._list._list);
		// var seglist = path.pathSegList._list._list;
	// }
	
	
	var lx = [line[0].x,line[1].x];
	var ly = [line[0].y,line[1].y];
	var LTRS = "MCLHVZSQTA";
	var sge = seglist.getItem(0);
	var segend = new Point(sge.x, sge.y);
	// console.log("pathline list length", seglist.numberOfItems);
	
	for (var i=1; i<seglist.numberOfItems;i++){
		// Get absolute coordinates for path segment control points
		var seg = seglist.getItem(i);
		if (LTRS.indexOf(seg.pathSegTypeAsLetter) > 0){
			// Path segment is absolute already
			if (debug) console.log("absolute segment",i);
			var px = [segend.x, // last segend = start of this one
					  (seg.x1 || 0), // if line segment, there's no x1
					  (seg.x2 || 0), // but does this produce correct results
					  seg.x]; // in those cases?
			var py = [segend.y,
					  (seg.y1 || 0),
					  (seg.y2 || 0),
					  seg.y];
			segend = new Point(seg.x, seg.y);
		} else {
			// Path segment is relative
			if (debug) console.log("relative segment",i);
			var px = [segend.x, 
					  segend.x + (seg.x1 || 0),
					  segend.x + (seg.x2 || 0),
					  segend.x + seg.x];
			var py = [segend.y,
					  segend.y + (seg.y1 || 0),
					  segend.y + (seg.y2 || 0),
					  segend.y + seg.y];
			segend = segend.move(seg.x, seg.y);
		}
		// Try to intersect path segment with line
		if (debug) console.log("pathline",px,py,lx,ly);
		
		if (seg.pathSegTypeAsLetter == "a" || seg.pathSegTypeAsLetter == "A"){
			if (debug) console.log("pathline A");
			var inter = arc_intersect(px,py,lx,ly, seg);
		} else if (seg.pathSegTypeAsLetter == "l" || seg.pathSegTypeAsLetter == "L"){
			var inter = intersectline(new Point(px[0],py[0]),new Point(px[3],py[3]),     line[0],line[1]);
			
		} else { // Bezier segment
			var inter = computeIntersections(px,py,lx,ly, true);
			if (inter.x==0 && inter.y ==0){inter = false;}
		}
		
		if (inter){
			if (debug) console.log("pathline found intersection", inter);
			return inter;
		} else {
			if (debug) console.log("pathline; no intersection", px,py);
			// drawline(getelid("infobox"), line ,GREENSTYLE);
			
		}
	}
	return false;
}

/*computes intersection between an arc segment and a line segment*/
function arc_intersect(px,py,lx,ly, arcseg){
	var f = getelid("infobox");
	// console.log("px,py,lx,ly", px,py,lx,ly);
	var randi = parseInt(Math.random()*1000); // identifier for debug drawings
	console.log("arc intersection; arcseg "+randi, arcseg);
	function ang(p1,p2){
		var a = Math.atan2(p2.x-p1.x,p2.y-p1.y );
		// Normalize to positive angles
		// if (a<0) a = a+2*Math.PI;
		return a;
	}
	// Find circle center and radius
	var radius = arcseg.r1;
	// Points on the circle
	if (arcseg.sweepFlag){
		var c1 = new Point(px[0], py[0]);
		var c2 = new Point(px[3], py[3]);
	} else {
		var c2 = new Point(px[0], py[0]);
		var c1 = new Point(px[3], py[3]);
	}
	drawcircle(f, c1, 1,"","c1-"+randi);
	drawcircle(f, c2, 1,"","c2-"+randi);
	// drawline(getelid("infobox"),[p1,p2], BLUESTYLE);
	var d = linelength(c1,c2)/2.0;
	var angle = ang(c1,c2);
	var midp = c1.movedist(d, angle);
	drawcircle(f, midp, 1,"","midp-"+randi);
	var b = Math.sqrt(radius**2-d**2);
	// Decide centerpoint side
	// TODO: centerpoint finding fails sometimes
	// if (arcseg.sweepFlag) {
	if (arcseg.largeArcFlag) {
		// || (!arcseg.sweepFlag && arcseg.largeArcFlag)){
		var center = midp.movedist(b, angle+0.5*Math.PI);
	} else {
		var center = midp.movedist(b, angle-0.5*Math.PI);
	}
	drawcircle(f, center, 3,"","center-"+randi);
	
	var p1 = new Point(lx[0], ly[0]);
	var p2 = new Point(lx[1], ly[1]);
	drawline(f,[p1,p2], REDSTYLE, "line-"+randi);
	var p1a = ang(center, p1);
	var p2a = ang(center, p2);
	var c1a = ang(center, c1);
	var c2a = ang(center, c2);
	
	var pa = ang(p1, p2);
	
	var langle = Math.abs(p2a-p1a);

	var c1len = linelength(center,c1);
	var c2len = linelength(center,c2);
	var p1len = linelength(center,p1);
	var p2len = linelength(center,p2);
	var plen = linelength(p1,p2);
	// Rotate lp2 around lp1 by -langle
	var origin = FRONTVIEWORIGIN.move(78,-100);
	drawcircle(f, origin, 1,"","origin-"+randi);
	// Angle center-lp1-lp2
	var corner1 = Math.acos((plen**2+p1len**2-p2len**2)/(2*plen*p1len));
	console.log("corner1", corner1);
	var corner2 = Math.PI-corner1-langle;
	var np1a = 0.5*Math.PI-corner1;
	console.log(p1len,np1a, corner1);
	// Find p3, located perpendicular to center on line p1-p2
	var p1top3 = p1len * Math.cos(corner1);
	var p3 = p1.movedist(p1top3,pa);
	drawcircle(f, p3, 2,"","p3-"+randi);
	
	drawline(f,[center,p3], REDSTYLE, "p3line-"+randi);
	drawline(f,[center,center.movedist(100,p1a)], REDSTYLE, "p1line-"+randi);
	drawline(f,[center,center.movedist(100,p2a)], REDSTYLE, "p2line-"+randi);
	var p3len = linelength(center,p3); 
	var p3a = ang(center, p3);
	//
	// Rotate line and arc points until line is horizontal
	var np1 = new Point(0,0).movedist(p1len,p1a-p3a);
	drawcircle(f, origin.addpoint(np1), 1,"","np1-"+randi);
	var np2 = new Point(0,0).movedist(p2len,p2a-p3a);
	drawcircle(f, origin.addpoint(np2), 1,"","np2-"+randi);
	drawline(f,[origin.addpoint(np1),origin.addpoint(np2)], REDSTYLE, "nline-"+randi);
	var nc1a = c1a-p3a;
	var nc2a = c2a-p3a;
	var nc1 = new Point(0,0).movedist(c1len,nc1a);
	var nc2 = new Point(0,0).movedist(c2len,nc2a);
	drawcircle(f, origin.addpoint(nc1), 1,BLUESTYLE,"nc1-"+randi);
	drawcircle(f, origin.addpoint(nc2), 1,"","nc2-"+randi);
	// Draw rotated circle segment
	var nnc1 = origin.addpoint(nc1);
	var nnc2 = origin.addpoint(nc2);
	var d = "M"+nnc1.x.toFixed(DIGITS)+","+nnc1.y.toFixed(DIGITS);
	var larc = "0";
	if (arcseg.largeArcFlag) larc = "1";
	d += " A"+radius+","+radius+ " 0 "+larc+" 1 " + + nnc2.x.toFixed(DIGITS)+","+nnc2.y.toFixed(DIGITS);
	var el = creel("path", "testnc"+randi , "", ["d",d], NAMESPACE);
	el.setAttribute("style",NOFILLTHIN);
	addel(f,el);
	// if line shortest distance from center is < radius, there are intersections
	function archeck(a1,a,a2){
		// if (a1 < 0)a1 += Math.PI*2;
		// if (a < 0)
		if (a1 > Math.PI) a1 = a1 - 2*Math.PI;
		if (a2 > a1) a2 = a2 - 2*Math.PI;
		// if both a1 and a2 are in the negative space, a should be too
		if (a1 < 0 && a > 0) a = a - 2*Math.PI
		console.log("arc",isbetween(a1,a,a2),a1,a,a2);
		return isbetween(a1,a,a2);
	}
	if (p3len < radius){
		console.log("circle and line intersect");
		// Find intersections with circle
		var h = Math.sqrt(radius**2-p3len**2);
		var inter1 = new Point(h, p3len);
		var inter2 = new Point(-h, p3len);
		var i1a = ang(new Point(0,0),inter1);
		var i2a = ang(new Point(0,0),inter2);
		drawline(f,[origin,origin.movedist(100,0)], REDSTYLE, "angl0-"+randi);
		drawline(f,[origin,origin.movedist(100,-1)], REDSTYLE, "anglneg-"+randi);
		// Angle 0 is downwards, clockwise is negative
		console.log("line",isbetween(np1.x,inter1.x,np2.x),np1.x,inter1.x,np2.x);
		// console.log("arc",isbetween(nc1a,i1a,nc2a),nc1a,i1a,nc2a);
		drawcircle(f, origin.addpoint(inter1), 2,REDSTYLE,"inter1-"+randi);
		drawcircle(f, origin.addpoint(inter2), 2,REDSTYLE,"inter2-"+randi);
		// var nnc1a = ang(new Point(), );
		// Check validity of first intersection
		if (archeck(nc1a,i1a,nc2a) && isbetween(np1.x,inter1.x,np2.x)){
			// && ((nc1.y < p3len)&&(nc2.y < p3len))){
			console.log("inter1 is valid");
			valid1 = true;
			
			var reali = center.movedist(radius,i1a+p3a);
			drawcircle(f, reali, 2,REDSTYLE,"inter1real-"+randi);
			return reali;
		}
		console.log("line",isbetween(np1.x,inter2.x,np2.x),np1.x,inter2.x,np2.x);
		
		// Check validity of second intersection
		if (archeck(nc1a,i2a,nc2a) && isbetween(np1.x,inter2.x,np2.x) ){
			// && ((nc2.y < p3len)||(nc2.y < p3len))){
			// ilist.push(inter1);
			console.log("inter2 is valid");
			valid2 = true;
			
			var reali = center.movedist(radius,i2a+p3a);
			drawcircle(f, reali, 2,REDSTYLE,"inter2real-"+randi);
			return reali;
		}
		// Rotate selected intersection point to original coordinates
		
	}
	console.log("No valid intersections");
	return false;
}

/*computes intersection between an arc segment and a line segment*/
function arc_intersect_(px,py,lx,ly, arcseg){
	console.log("arc intersection; arcseg", arcseg);
	// console.log("px,py,lx,ly", px,py,lx,ly);
	var randi = parseInt(Math.random()*1000); // identifier for debug drawings
	function ang(p1,p2){
		var a = Math.atan2(p2.x-p1.x,p2.y-p1.y );
		// Normalize to positive angles
		if (a<0) a = a+2*Math.PI;
		return a;
	}
	// Find circle center and radius
	var radius = arcseg.r1;
	// Points on the circle
	if (arcseg.largeArcFlag){
		var p2 = new Point(px[0], py[0]);
		var p1 = new Point(px[3], py[3]);
	} else {
		var p1 = new Point(px[0], py[0]);
		var p2 = new Point(px[3], py[3]);
	}
	
	drawcircle(getelid("infobox"), p1, 1,"","");
	drawcircle(getelid("infobox"), p2, 1,"","");
	// drawline(getelid("infobox"),[p1,p2], BLUESTYLE);
	var d = linelength(p1,p2)/2.0;
	var angle = ang(p1,p2);
	var midp = p1.movedist(d, angle);
	drawcircle(getelid("infobox"), midp, 1,"","midp"+randi);
	var b = Math.sqrt(radius**2-d**2);
	// Decide centerpoint side
	// TODO: centerpoint finding fails sometimes
	if (arcseg.sweepFlag) {
	// if ((arcseg.sweepFlag && !arcseg.largeArcFlag) 
		// || (!arcseg.sweepFlag && arcseg.largeArcFlag)){
		var center = midp.movedist(b, angle-Math.PI/2);
	} else {
		var center = midp.movedist(b, angle+Math.PI/2);
	}
	drawcircle(getelid("infobox"), center, 3,"","center"+randi);
	// drawline(getelid("infobox"),[p1,center], BLUESTYLE);
	// drawline(getelid("infobox"),[p2,center], BLUESTYLE);
	// drawline(getelid("infobox"),[center, center.movedist(100,3)], BLUESTYLE);
	// console.log("p1,p2, radius", p1,p2, radius, d);
	
	var lp1 = new Point(lx[0], ly[0]).minuspoint(center);
	var lp2 = new Point(lx[1], ly[1]).minuspoint(center);
	drawcircle(getelid("infobox"), {x:lx[0], y:ly[0]}, 1,REDSTYLE,"");
	drawline(getelid("infobox"),[{x:lx[0], y:ly[0]},{x:lx[1], y:ly[1]}], REDSTYLE);
	// Is there an intersection at all?
	var dx = lp2.x - lp1.x;
	var dy = lp2.y - lp1.y;
	var dr = Math.sqrt(dx**2 + dy**2);
	var DD = lp1.x*lp2.y - lp2.x*lp1.y;
	var discriminant = (radius**2)*(dr**2) - DD**2;
	// console.log("discriminant", discriminant);
	function sgn(x) { if (x<0){return -1;} else {return 1;}}
	var valid1 = false;
	var valid2 = false;
	
	if (discriminant >= 0){ // Single solution, or more
		
		function archeck(a1,ai,a2){
			var result = false;
			if (arcseg.sweepFlag && arcseg.largeArcFlag){
				console.log("archeck sweepflag largeArcFlag");
				// if (a1 == 0.0) a1 = Math.PI*2;
				
				result = (a1<=ai && ai >=a2) || (a1<=ai && ai <=a2);
			} else if (arcseg.sweepFlag ){
				console.log("archeck sweepflag true");
				if (a1 == 0.0) a1 = Math.PI*2;
				result = a1>=ai && ai >=a2;
			} else {
				if (a2 == 0.0) a2 = Math.PI*2;
				result = a1<=ai && ai <=a2;
			}
			console.log("archeck ", result, a1,ai,a2);
			// TODO: what if archeck  false -1.57 -1.86 3.14
			// +10 to all -> PI still not in order. normalize PI to 0?
			// Modulo PI
			// If p1 < 0 && p2 == PI, p2 = 0
			
			// if inter is on the same side of center as p1 and p2
			return result;
		}
		var ix = (DD*dy + sgn(dy)*dx*Math.sqrt(discriminant))/(dr**2);
		var iy = (-DD*dx + Math.abs(dy)*Math.sqrt(discriminant))/(dr**2);
		// var inter1 = new Point(ix,iy).addpoint(center); // move-+?
		var inter1 = center.move(ix,iy); // move-+?
		var a1 = ang(center, p1); // angle from arc center to arc start
		var a2 = ang(center, p2);
		drawline(getelid("infobox"),[center, center.movedist(200,a1)], GREENSTYLE);
		drawline(getelid("infobox"),[center, center.movedist(200,a2)], BLUESTYLE);
		// Math.atan2(p1,p2);
		var ai1 = ang(center, inter1);
		drawline(getelid("infobox"),[center, center.movedist(200,ai1)], REDSTYLE);
		console.log("First intersection", drawcircle(getelid("infobox"), inter1, 2,BLUESTYLE,""));
		// console.log("isbetween",lx[0],inter1.x,lx[1],isbetween(lx[0],inter1.x,lx[1]),ly[0],inter1.y,ly[1], isbetween(ly[0],inter1.y,ly[1]));
		if (isbetween(lx[0],inter1.x,lx[1]) && isbetween(ly[0],inter1.y,ly[1])
			&& archeck(a1, ai1, a2)){
			// ilist.push(inter1);
			valid1 = true;
			drawcircle(getelid("infobox"), inter1, 2,REDSTYLE,"");
		} //else { return false;}
		if (discriminant > 0){ // Two intersections
			var ix2 = (DD*dy - sgn(dy)*dx*Math.sqrt(discriminant))/(dr**2);
			var iy2 = (-DD*dx - Math.abs(dy)*Math.sqrt(discriminant))/(dr**2);
			// var inter2 = new Point(ix2,iy2).addpoint(center);
			var inter2 = center.move(ix2,iy2);
			
			var ai2 = ang(center, inter2);
			drawline(getelid("infobox"),[center, center.movedist(200,ai2)], REDSTYLE);
			console.log("Second intersection", drawcircle(getelid("infobox"), inter2, 2,BLUESTYLE,""));
			// console.log("isbetween",lx[0],inter2.x,lx[1],isbetween(lx[0],inter2.x,lx[1]),ly[0],inter2.y,ly[1], isbetween(ly[0],inter2.y,ly[1]));
			if (isbetween(lx[0],inter2.x,lx[1]) && isbetween(ly[0],inter2.y,ly[1])
				&& archeck(a1, ai2, a2)){
				// ilist.push(inter2);
				valid2 = true;
				drawcircle(getelid("infobox"), inter2, 2,GREENSTYLE,"");
				drawline(getelid("infobox"),[inter1,inter2], GREENSTYLE);
			} //else { return false;}
		}
		
		
		
		
	}
	
	// TODO: Cull intersections; Are they inside line segment bounds, within arc segment angle?
	// Check inter1
	
	if (valid1 && valid2){
		console.log("arc_intersect: Two valid intersections");
		drawcircle(getelid("infobox"), inter1, 4,GREENSTYLE,"");
		return inter1;
	} else if (valid1){
		console.log("arc_intersect: inter1");
		drawcircle(getelid("infobox"), inter1, 4,GREENSTYLE,"");
		return inter1;
	} else if (valid2){
		console.log("arc_intersect: inter2");
		drawcircle(getelid("infobox"), inter2, 4,GREENSTYLE,"");
		return inter2;
	} else {
		console.log("arc_intersect: No intersections", valid1, valid2);
		return false;
	}
	return false;
}


/*computes intersection between a cubic spline(path bezier segment) and a line segment*/
function computeIntersections(px,py,lx,ly,verify){
	// px, py = arrays of coordinates for bezier control points (4), 
	// lx,ly = coords for line (2)
    var X=[];
    
    var A=ly[1]-ly[0];	    //A=y2-y1
	var B=lx[0]-lx[1];	    //B=x1-x2
	var Zpoints=lx[0]*(ly[0]-ly[1]) + 
          ly[0]*(lx[1]-lx[0]);	//Zpoints=x1*(y1-y2)+y1*(x2-x1)

	var bx = bezierCoeffs(px[0],px[1],px[2],px[3]);
	var by = bezierCoeffs(py[0],py[1],py[2],py[3]);
	
    var P = Array();
	P[0] = A*bx[0]+B*by[0];		/*t^3*/
	P[1] = A*bx[1]+B*by[1];		/*t^2*/
	P[2] = A*bx[2]+B*by[2];		/*t*/
	P[3] = A*bx[3]+B*by[3] + Zpoints;	/*1*/
	
	var r=cubicRoots(P);
	
    /*verify the roots are in bounds of the linear segment*/
	t=r[0];
	X[0]=bx[0]*t*t*t+bx[1]*t*t+bx[2]*t+bx[3];
    X[1]=by[0]*t*t*t+by[1]*t*t+by[2]*t+by[3];  
	if (!verify){
		return new Point(X[0], X[1]);
	} else {
		for (var i=0;i<3;i++){
			t=r[i];
			
			X[0]=bx[0]*t*t*t+bx[1]*t*t+bx[2]*t+bx[3];
			X[1]=by[0]*t*t*t+by[1]*t*t+by[2]*t+by[3];            
			  

			// above is intersection point assuming infinitely long line segment,
			// make sure we are also in bounds of the line
			var s;
			if ((lx[1]-lx[0])!=0)           //if not vertical line
				s=(X[0]-lx[0])/(lx[1]-lx[0]);
			else
				s=(X[1]-ly[0])/(ly[1]-ly[0]);
			
			//in bounds?    
			if (t<0 || t>1.0 || s<0 || s>1.0)
			{
				// X[0]=-100;  //move off screen
				// X[1]=-100;
				return false;
			}
			
			// move intersection point
			// I[i].setAttributeNS(null,"cx",X[0]);
			// I[i].setAttributeNS(null,"cy",X[1]);
			return new Point(X[0], X[1]);
		} 

	}
	
	
   
}

/*based on http://mysite.verizon.net/res148h4j/javascript/script_exact_cubic.html#the%20source%20code*/
function cubicRoots(P)
{
	var a=P[0];
	var b=P[1];
	var c=P[2];
	var d=P[3];
	
	var A=b/a;
	var B=c/a;
	var Zpoints=d/a;

    var Q, R, D, S, T, Im;

    var Q = (3*B - Math.pow(A, 2))/9;
    var R = (9*A*B - 27*Zpoints - 2*Math.pow(A, 3))/54;
    var D = Math.pow(Q, 3) + Math.pow(R, 2);    // polynomial discriminant

    var t=Array();
	
    if (D >= 0)                                 // complex or duplicate roots
    {
        var S = sgn(R + Math.sqrt(D))*Math.pow(Math.abs(R + Math.sqrt(D)),(1/3));
        var T = sgn(R - Math.sqrt(D))*Math.pow(Math.abs(R - Math.sqrt(D)),(1/3));

        t[0] = -A/3 + (S + T);                    // real root
        t[1] = -A/3 - (S + T)/2;                  // real part of complex root
        t[2] = -A/3 - (S + T)/2;                  // real part of complex root
        Im = Math.abs(Math.sqrt(3)*(S - T)/2);    // complex part of root pair   
        
        /*discard complex roots*/
        if (Im!=0)
        {
            t[1]=-1;
            t[2]=-1;
        }
    
    }
    else                                          // distinct real roots
    {
        var th = Math.acos(R/Math.sqrt(-Math.pow(Q, 3)));
        
        t[0] = 2*Math.sqrt(-Q)*Math.cos(th/3) - A/3;
        t[1] = 2*Math.sqrt(-Q)*Math.cos((th + 2*Math.PI)/3) - A/3;
        t[2] = 2*Math.sqrt(-Q)*Math.cos((th + 4*Math.PI)/3) - A/3;
        Im = 0.0;
    }
    
    /*discard out of spec roots*/
	for (var i=0;i<3;i++) 
        if (t[i]<0 || t[i]>1.0) t[i]=-1;
                
	/*sort but place -1 at the end*/
    t=sortSpecial(t);
    
	// console.log(t[0]+" "+t[1]+" "+t[2]);
    return t;
}

function sortSpecial(a)
{
    var flip;
    var temp;
    
    do {
        flip=false;
        for (var i=0;i<a.length-1;i++)
        {
            if ((a[i+1]>=0 && a[i]>a[i+1]) ||
                (a[i]<0 && a[i+1]>=0))
            {
                flip=true;
                temp=a[i];
                a[i]=a[i+1];
                a[i+1]=temp;
                
            }
        }
    } while (flip);
	return a;
}

// sign of number
function sgn( x )
{
    if (x < 0.0) return -1;
    return 1;
}

function bezierCoeffs(P0,P1,P2,P3)
{
	var Z = Array();
	Z[0] = -P0 + 3*P1 + -3*P2 + P3; 
    Z[1] = 3*P0 - 6*P1 + 3*P2;
    Z[2] = -3*P0 + 3*P1;
    Z[3] = P0;
	return Z;
}
//////////////////////////////////////////////////////////////////////////////
// Array functionality


function flipsign(ar){ // Flip sign of all numbers in array
	var out = [];
	var a= ar.length;
	for (i=0;i<a;i++){
		out.push(-ar[i]);
	}
	return out;
}
function findmax(array){ // find largest number in an array, return index
  var max = -1000000,
      a = array.length,
      counter,
	  maxcounter;
  for (counter=0;counter<a;counter++){
      if (array[counter] > max){
          max = array[counter]
		  maxcounter = counter
      }
  }
  return maxcounter;
}
function findmin(array){ // find smallest number in an array, return index
  var max = 1000000000,
      a = array.length,
      counter,
	  maxcounter;
  for (counter=0;counter<a;counter++){
      if (array[counter] < max){
          max = array[counter]
		  maxcounter = counter
      }
  }
  return maxcounter;
}

//////////////////////////////////////////////////////////////////////////////
// SVG styling helpers

function makestyle(style, repls){
	// TODO: This is not ready obviously
	// Usage: makestyle(COVERSTYLE, ["stroke","none"])
	// in fully formed style string, replace specified things
	var out = style;
	for (var i=0; i<repls.length; i=i+2){
		var istart;
		out = out.replace(repls[i],repls[i+1]);
	}
	return out;
}















