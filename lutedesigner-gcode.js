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
	var meta = getelid("metaselector");
	var label = creel("label");
	label.innerHTML = "Endmill size:";
	var s = creel("input","ballnose_endmill_size","",["type","number","value","19.0"]);
	addel(label, s);
	var bu = creel("button","","",["onclick","gcoder.neckblock_gcode();"]);
	var inp = creel("textarea","neckblockgcode","",["rows","1","cols","10"]);
	bu.innerHTML = "Neckblock Gcode";
	addel(meta, label);
	addel(label, bu);
	addel(label, inp);
	
	
	// Create Gcode class object
	gcoder = new Gcode();
});
class Gcode {
	constructor(){
		// Initialized as global gcoder by features_init
		
		this.gprecision = 2; // Output decimal places
		this.ball_dia = 6.0; // 6mm ballnose
		this.default_cutrate = 15.0; // mm/s
		this.plunge_feed = 5.0; // Z feedrate when expecting material
	}
	
	
	neckblock_gcode(tool_dia){
		// Write a gcode program for machining the neckblock with a ball nose endmill
		// The neckblock is positioned with its inside face laying on the floor, neckjoint up, the endmill will cut the table on the last passes
		// TODO: Maybe do a curved top surface
		var ball_dia = parseFloat(getelid("ballnose_endmill_size").value) || this.ball_dia;
		var gcode = ["(Gcode created with Lutedesigner)"];
		gcode.push(`(Endmill: ${ball_dia.toFixed(1)} mm ballnose)`);
		// TODO: Figure out stock required size and output it to the beginning of the gcode
		
		// Sample neckblock shape at every layer
		// Do point if below top and above bottom points
		// lute3d.neckblock.jointpoints, bottompoints, lute3d.inribpaths.threedee
		// threedee is per ribjoint, not per layer...
		var points = lute3d.inribpaths.threedee;
		// bottompoints.y becomes z=0 (using table top as zero rather than stock surface)
		var bottompoints = lute3d.neckblock.bottompoints;
		var jointpoints = lute3d.neckblock.jointpoints;
		var bottom = bottompoints[0].y;
		var zerop = new Point(0,0);
		var njstart = cps.neckjoint_no_origin.y - bottom; // Start of neckjoint at y=0
		var nangle = Math.PI/2 - cps.neckjoint_angle; // Neckjoint angle

		var layers = [[]]; // Store rib joint points here per y coordinate, preserve which ribjoint point belongs to. x=x, y=-z, z=-y
		
		// Find out how many layers are needed to store all points between neckjoint and bottom
		for (var j=0; j < points[0].length; j++){
			if(points[0][j].y > bottom /*  && points[0][j].y <= jointpoints[0].y */ ){
				// All points from bottom to tip
				layers.push([]);
			}
		}
		// Store bottompoints as first layer. These have already been calculated by neckjoint_3D()
		for (var j=0; j < bottompoints.length; j++){
			var p = bottompoints[j];
			layers[0][j] = new Point(p.x, p.z, p.y-bottom);
		}
		
		console.log("Layers", layers.length);
		// Arrange neckblock shape into layers for easier use
		var neckblockshape = [];
		for(var i=0; i < points.length; i++){ // ribjoint number
			for(var j=0; j < points[i].length; j++){ // point along ribjoint
				if (points[i][j].y > bottom /* && points[i][j].y < jointpoints[i].y */){
					// Include this point in neckblock shape
					// Put in layer y, jointpoint i,
					// layers[]
					// layers[i][j]
					// put into first layer with free slot on this rib joint
					var lr = 0;
					while(layers[lr+1] && layers[lr][i] !== undefined){
						lr++;
					}
					// lr--;
					var p = points[i][j];
					layers[lr][i] = new Point(p.x, p.z, p.y-bottom);
				}
			}
		}
		console.log("wassup",jointpoints[0].y,bottom );
		var workpiece_height = jointpoints[0].y-bottom; // Z
		var workpiece_width = 2 * bottompoints[bottompoints.length-1].x; // X
		var workpiece_length = bottompoints[0].z; // Y
		// Store jointpoints on top of everything else
		/* for (var j=0; j < jointpoints.length; j++){
			var lr = 0;
			while(layers[lr][j] !== undefined){
				lr++;
			}
			var p = jointpoints[j];
			layers[lr][j] = new Point(p.x, p.z, p.y-bottom);
		} */
		
		console.log(layers);
		// Remove layers where [i][0].z is above neckjoint
		var culled = [];
		for (var i=0; i<layers.length; i++){
			if (layers[i].length){
				var p = layers[i][0];
				// console.log(i, p.z, njstart + p.y * Math.tan(nangle));
				if (p.z <= njstart + p.y * Math.tan(nangle)){
					culled.push(layers[i]);
				}
			}
		}
		layers = culled;
		
		// Mirror points on the other side
		for (var i=0; i<layers.length; i++){
			var reversed = [];
			for (var j=0; j<layers[i].length; j++){
				if (layers[i][j]){
					var p = layers[i][j];
					reversed.push(new Point(-p.x, p.y, p.z));
				}
				
			}
			reversed.reverse();
			layers[i] = reversed.concat(layers[i]);
		}
		// TODO: Find and check where it is decided where the neckblock goes
		// TODO: Draw ribline shapes and ball endmills somewhere to compare
		console.log(layers);
		// TODO: Maybe check that every point on every layer has same z coordinate
		// Debug draw layers on NECKBLOCKORIGIN
		var bsmove = cps.neckblocky - RIBTHICKNESS - jointpoints[jointpoints.length-1].y;
		var crosslayer = getelid("crosslayer");
		var debugg = makegroup(crosslayer, "neckblock-debug");
		var angles = []; // For later use in milling
		for (var i=0; i<layers.length; i++){
			var lshape = [];
			for (var j=0; j<layers[i].length; j++){
				var p = layers[i][j];
				lshape.push(NECKBLOCKORIGIN.move(p.x, p.y-bsmove));
				
			}
			if (lshape.length > 1){
				// var h = parseInt(255 * (i / (layers.length-1)));
				var h = parseInt(255 * (layers[i][0].z / (layers[layers.length-1][0].z)));
				var g = ("0"+(Number(h).toString(16))).slice(-2).toUpperCase();
				var b = ("0"+(Number(255-h).toString(16))).slice(-2).toUpperCase();
				var color = "#00"+g+b;
				// var styl = makestyle(GREENSTYLE, ["stroke",color]);
				var styl = "stroke:"+color+";stroke-width:0.2; fill:none;";
				// drawshape(debugg,lshape,styl,"neckblock-layer-"+i);
			}
		}
		// Neckblock points have now been neatly arranged in layers
		// TODO: interpolate (or calculate from lute model) extra layers if they are too far apart
		// Start parsing layers to create gcode
		console.log("angles",angles);
		
		var radius = ball_dia/2.0; // Cutter radius
		var toolpath = [];
		
		// Do a positioning move above workpiece
		gcode.push("(Stock size: W"+workpiece_width.toFixed(1)+"mm L"+workpiece_length.toFixed(1)+"mm H"+workpiece_height.toFixed(1)+"mm)");
		gcode.push("M3");
		gcode.push("G0 X0 Y-3 Z"+(workpiece_height+10.0).toFixed(this.gprecision));
		var roughtoolpath = ["(Rough pass)"];
		var finetoolpath = ["(Final pass)"];
		var roughcut = 4.0; // Depth to cut on rough pass
		var roughcounter = workpiece_height; // Keep track of rough passes
		var firstrough = true;
		for (var i=layers.length-1; i>0 ; i--){ // top down
			var tlayer = [];
			var layerh = layers[i][0].z;
			// TODO: Rough cut. Do before final cut, so gather into two separate toolpaths but calculate here. Fit full tool widths to rough depth
			if (layerh < roughcounter - roughcut){
				
				roughtoolpath.push("(Rough cut level "+layerh.toFixed(1)+" mm)");
				
				// Do as many rough cuts as fit radially. They need to be organized here in full arcs
				// Number of arcs on this layer
				var numbercuts = Math.abs(/* parseInt */((layers[0][0].x - layers[i][0].x) / ball_dia));
				console.log("Doing rough cut", layerh, "cuts", numbercuts);
				
				for (var c=1; c<=numbercuts; c++){
					for (var j=0; j<layers[i].length; j++){
						// Cut around shape at ball_dia intervals
						var thisp = layers[i][j];
						var lowestp = layers[0][j];
						// Find angle towards center at each joint
						var angle = getangle(thisp,zerop);
						var thispolar = flatlinelength(thisp, zerop);
						var lpolar = flatlinelength(lowestp, zerop);
						var incr = (lpolar-thispolar-radius)/numbercuts;
						if (j==0) console.log("incr",i,c,j,lpolar-thispolar, incr);
						var toolpos = thisp.movedist(radius+incr*c, angle);
						// tlayer.push(toolpos);
						
						if (j==0){
							if (firstrough){
								// Position endmill on top of first move
								roughtoolpath.push(this.gcode_move(toolpos.move(0,0,10.0)));
								roughtoolpath.push(this.gcode_straight_cut(toolpos));
								firstrough = false;
							} else {
								// Normally do a fast move along bottom and arc to arrive at start of cut
								var offset = new Point(0,ball_dia);
								roughtoolpath.push(this.gcode_move(toolpos.move(ball_dia,-ball_dia)));
								roughtoolpath.push(this.gcode_G2(toolpos, offset));
								// 
							}
						} else {
							// On non-first moves do normal cut
							roughtoolpath.push(this.gcode_straight_cut(toolpos));
						}
						
						
						
						if (j==layers[i].length-1){
							// On every layer's last point, do an arc around corner
							var offset = new Point(-ball_dia,0);
							roughtoolpath.push(this.gcode_G2(toolpos.move(-ball_dia,-ball_dia),offset));
						}
					}
				}
				roughcounter -= roughcut;
				
			}
			var lowerp, lowerpolar, polardif, vangle, hdif;
			
			// Do fine surfacing
			for (var j=0; j<layers[i].length; j++){
				
				// Milling the rib side of the block
				// Calculate offset by finding intersecting jointpoints below current
				// Find vertical tangent from this and point below 
				var thisp = layers[i][j];
				// if (thisp.z > workpiece_height) workpiece_height = thisp.z
				var thispolar = flatlinelength(thisp, zerop);
				
				if (i>0) {
					lowerp = layers[i-1][j];
					lowerpolar = flatlinelength(lowerp, zerop);
					polardif = lowerpolar-thispolar;
					hdif = Math.abs(thisp.z - lowerp.z);
					vangle = Math.atan((polardif)/(hdif));// angle between z axis, this and lower point vertically. 
				} else {
					var higherp = layers[i+1][j];
					var higherpolar = flatlinelength(higherp, zerop);
					polardif = Math.abs(higherpolar-thispolar);
					hdif = Math.abs(thisp.z - higherp.z);
					vangle = Math.atan((polardif)/(hdif));// angle between z axis, this and lower point vertically. 
				}
				
				// Find angle towards center at each joint
				var angle = getangle(thisp,zerop);
				
				var toolcl = radius * Math.cos(vangle); // Ball endmill center offset in polar form
				var toolch = - radius + radius * Math.sin(vangle); // endmill center height, minus tool radius to get correct height to tool tip
				// Convert tool position from polar form to xy
				var toolpos = thisp.movedist(toolcl, angle);//.move(0,0,toolch);
				tlayer.push(toolpos);
				
				// TODO: neckblocks are too short, squished. debug by drawing ball endmill on sideview/frontview. Maybe endmill is not round in reality?
				
				if (j==0){
					// Before first point of each layer, do a clockwise arc around corner
					// First move to beginning of arc
					if (i==layers.length-1){
						// Position endmill on top of first move
						finetoolpath.push(this.gcode_move(toolpos.move(0,0,10.0)));
						finetoolpath.push(this.gcode_straight_cut(toolpos));
					} else {
						// On all other moves, make (complete) a slight 1 mm curve around the neck surface. This is the other part of that move.
						// var h = ((toolpos.x-radius)**2 + 1)/2 - 1;
						// var offset = new Point(0, h);
						var endp = toolpos.move(radius, -radius); //new Point(-radius, toolpos.y-radius-1);
						// finetoolpath.push(this.gcode_G2(endp, offset));
						finetoolpath.push(this.gcode_straight_cut(endp));
						
						// Curve around corner
						var offset = new Point(0,radius);
						finetoolpath.push(this.gcode_G2(toolpos, offset));
					}
				} else {
					// Do a regular move from ribjoint to ribjoint. First point does not need this since the tool is moved to the position with the above arc command
					finetoolpath.push(this.gcode_straight_cut(toolpos));
					
				}
				
				
				
				
				
				if (j==layers[i].length-1){
					// After last point of each layer, do an arc
					// gcode.push(this.gcode_straight_cut(toolpos.move(0,-5)));
					// gcode.push(this.gcode_straight_cut(toolpos.move(radius,-radius)));
					var offset = new Point(-radius,0);
					finetoolpath.push(this.gcode_G2(toolpos.move(-radius,-radius), offset));
					// On all other moves, make a slight 1 mm curve around the neck surface
					// var h = ((toolpos.x-radius)**2 + 1)/2 - 1;
					// var offset = new Point(-(toolpos.x-radius), h);
					var endp = new Point(0, toolpos.y-radius);
					// finetoolpath.push(this.gcode_G2(endp, offset));
					finetoolpath.push(this.gcode_straight_cut(endp));
				}
			}
			toolpath.push(tlayer);
		}
		
		// Lift tool straight up 
		finetoolpath.push("G0 Y-"+(radius+2).toFixed(this.gprecision)+" Z"+(workpiece_height+10).toFixed(this.gprecision));
		// Add a move to safe height to rough cut path
		roughtoolpath.push("G0 Y-"+(ball_dia).toFixed(this.gprecision)+" Z"+(workpiece_height+10).toFixed(this.gprecision));
		// Join rough and fine to gcode
		gcode = gcode.concat(roughtoolpath);
		gcode = gcode.concat(finetoolpath);
		
		// Cut the neckjoint surface
		// TODO: Code below alters lute3d.neckblock.jointpoints and leads to cascading errors; Rework
		/* var ljp = [];
		for (var i=0; i<jointpoints.length; i++){
			// jointpoints[i].y = jointpoints[i].y-bottom;
			
			jointpoints[i] = new Point(jointpoints[i].x, jointpoints[i].z, jointpoints[i].y-bottom);
			ljp.push(new Point(-jointpoints[i].x, jointpoints[i].y, jointpoints[i].z));
		}
		var startp = jointpoints[0];
		
		ljp.reverse();
		jointpoints = ljp.concat(jointpoints); */
		// gcode.concat(this.machine_bounded_plane(jointpoints, nangle, 0, startp ));
		// machine_bounded_plane(shape, a1, a2, startp, accuracy, rough_depth ){
		
		// Debug draw toolpath
		if (toolpath[0]){
			var prevp = NECKBLOCKORIGIN.move(toolpath[0][0].x, toolpath[0][0].y-bsmove, toolpath[0][0].z);
			console.log("prevp",prevp);
			var toolpg = makegroup(crosslayer, "neckblock-toolpath-debug-top");
			for (var i=0; i<toolpath.length; i++){
				var lshape = [];
				for (var j=0; j<toolpath[i].length; j++){
					if (!(i == 0 && j == 0)) {
						var p = toolpath[i][j];
						p = NECKBLOCKORIGIN.move(p.x, p.y-bsmove, p.z);
						
						
						var h = parseInt(255 * (p.z / workpiece_height));
						var r = ("0"+(Number(h).toString(16))).slice(-2).toUpperCase();
						var b = ("0"+(Number(255-h).toString(16))).slice(-2).toUpperCase();
						var color = "#"+r+"44"+"44";
						// var styl = makestyle(GREENSTYLE, ["stroke",color]);
						var styl = "stroke:"+color+";stroke-width:0.2; fill:none;";
						drawline(toolpg,[prevp,p],styl,"neckblock-toolpath-debug-top-"+i+"-"+j);
						
						prevp = p;
					}
					
				}
				
			}
		}
		
		
		// TODO: Display as a wireframe model if easy...
		gcode.push("M5");
		// console.log(gcode.join("\n"));
		getelid("neckblockgcode").innerHTML = gcode.join("\n");
		// TODO: Offer download text file
	} // end neckblock_gcode
	
	gcode_lift_move(){
		// Do a quick reposition at safe height (lift above, move, lower)
	}
	
	gcode_G2(ep, offset){
		// Clockwise arc
		var out = ["G2"];
		out.push("X"+ep.x.toFixed(this.gprecision));
		out.push("Y"+ep.y.toFixed(this.gprecision));
		if (ep.z !== undefined){
			out.push("Z"+ep.z.toFixed(this.gprecision));
		}
		out.push("I"+offset.x.toFixed(this.gprecision));
		out.push("J"+offset.y.toFixed(this.gprecision));
		return out.join(" ");
	}
	
	gcode_G3(ep, offset){
		// Clockwise arc
		var out = ["G3"];
		out.push("X"+ep.x.toFixed(this.gprecision));
		out.push("Y"+ep.y.toFixed(this.gprecision));
		if (ep.z !== undefined){
			out.push("Z"+ep.z.toFixed(this.gprecision));
		}
		out.push("I"+offset.x.toFixed(this.gprecision));
		out.push("J"+offset.y.toFixed(this.gprecision));
		return out.join(" ");
	}
	
	gcode_move(ep){
		// Output line of gcode at fastest unspecified movement rate
		var out = ["G0"];
		out.push("X"+ep.x.toFixed(this.gprecision));
		out.push("Y"+ep.y.toFixed(this.gprecision));
		if (ep.z !== undefined){
			out.push("Z"+ep.z.toFixed(this.gprecision));
		}
		
		return out.join(" ");
	}
	
	gcode_straight_cut(ep, feed){
		// Output line of gcode at cutting feedrate
		var feed = feed || this.default_cutrate;
		var out = ["G1"];
		out.push("X"+ep.x.toFixed(this.gprecision));
		out.push("Y"+ep.y.toFixed(this.gprecision));
		if (ep.z !== undefined){
			out.push("Z"+ep.z.toFixed(this.gprecision));
		}
		if (feed !== undefined){
			out.push("F"+feed.toFixed(1));
		}
		
		return out.join(" ");
	}
	
	gcode_arc(ep, cp, feed){
		// Output line of gcode at cutting feedrate
		var out = ["G1"];
		out.push("X"+ep.x.toFixed(this.gprecision));
		out.push("Y"+ep.y.toFixed(this.gprecision));
		if (ep.y !== undefined){
			out.push("Z"+ep.y.toFixed(this.gprecision));
		}
		if (feed !== undefined){
			out.push("F"+feed);
		}
		
		return out.join(" ");
	}
	
	machine_plane(sp, a1,a2,w,h){
		// Machine an arbitrary plane specified in two angles and a point, and width and height
		// Assumes a ballnose endmill
	}
	
	machine_bounded_plane(shape, atool, avert, arot, startp, accuracy, rough_depth ){
		var atool = atool || 0.0; // tool movement along x by default
		while (atool > Math.PI/4) atool -= Math.PI/4; // Clamp value
		var avert = avert || 0.0; // inclination of plane
		var arot = arot || 0.0; // rotation of plane around Z axis on startp
		var accuracy = accuracy || 1.0;
		var rough_depth = rough_depth || 3.0;
		// Machine an arbitrary plane specified in two angles and a point, and bounding shape
		// Assumes a ballnose endmill
		// Starts at startp
		// Return array of moves as text 
		var out = ["(Start bounded plane machining at angles "
			+(avert/radtodeg).toFixed(1)+", "
			+(arot/radtodeg).toFixed(1)+")"];
		console.log("Bounding shape", shape);
		
		// Find largest and smallest coordinates in bounding box
		var smallest = new Point(shape[0].x, shape[0].y);
		var largest = new Point(shape[0].x, shape[0].y); // Z coordinate will be ignored and the shape will be treated as flat
		
		for (var i=0; i<shape.length; i++){
			if (shape[i].x < smallest.x) smallest.x = shape[i].x;
			if (shape[i].y < smallest.y) smallest.y = shape[i].y;
			// if (shape[i].z < smallest.z) smallest.z = shape[i].z;
			
			if (shape[i].x > largest.x) largest.x = shape[i].x;
			if (shape[i].y > largest.y) largest.y = shape[i].y;
			// if (shape[i].z > largest.z) largest.z = shape[i].z;
		}
		console.log(largest, smallest, shape[0]);
		largest = largest.move(1,1);
		smallest = smallest.move(-1,-1); // bounding box size increased to always know which side of shape is intersected
		// Create intersector lines at atool angle
		var intadva = atool+Math.PI/2; // Angle to advance intersector ,90deg to atool
		var radius = this.tool_dia/2; // Ballnose radius
		var interval = radius*Math.cos(avert); // Interval depends on avert TODO: Add interval param
		var toolpos = new Point(startp.x, startp.y, starp.x);
		var gcode = [];
		// while (toolpos.){
			
		// }
		
		return gcode; // gcode is an array that needs to be joined with newlines
	}
};
