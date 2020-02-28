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
//
var camera, scene, renderer, animation_id;
// var geometry, material, mesh;
var pyramid;
var controls;

function start_bodyviewer(bbutn){
	// Unhide bodyviewer div and start three.js animation in it
	var bodyviewerdiv = getelid("bodyviewer");
	bbutn.innerHTML = "Exit 3D view";
	bbutn.setAttribute("onclick","stop_bodyviewer(this);");
	bodyviewerdiv.className = "";
	// Start 3D animation
	init(bodyviewerdiv); // Build scene
	animate();	// Animation loop
	// TODO: switch bbutn innerhtml depending on which button it is, and start init with chosen model, and write the function that creates a model based on the form svg elements.
	
}
function stop_bodyviewer(bbutn){
	cancelAnimationFrame( animation_id ); // Stop animating
	controls.dispose(); // Remove eventlisteners from mouse buttons
	var bodyviewerdiv = getelid("bodyviewer");
	delchildren(bodyviewerdiv); // Remove canvas 
	bodyviewerdiv.className = "hidebodyviewer";
	bbutn.innerHTML = "View body in 3D";
	bbutn.setAttribute("onclick","start_bodyviewer(this);");
}

///////////////////////////////////////////////////////////////////////////////
// 3D model creation fron lutedesigner
///////////////////////////////////////////////////////////////////////////////

function create_3d_wirebody(ribpaths){
	// Convert ribpaths to vector3s
	console.log("Ribpaths to 3D", ribpaths);
	var r = ribpaths.threedee; // Array of 3d points
	var wirebody = new THREE.Group();
	// Create line colours
	for (var i=0; i<r.length-1; i++){
		// For each rib, choose a color between red and blue
		var geometry = new THREE.Geometry();
		var geometry_l = new THREE.Geometry();
		// var B = ("00"+parseInt(50).toString(16)).substr(-2);
		// var R = ("00"+parseInt(255*(i/(r.length-1))).toString(16)).substr(-2);
		// var G = ("00"+parseInt(255*(1- i/(r.length-1))).toString(16)).substr(-2);
		// var colorstr = R + G + B;
		// var color = parseInt(colorstr,16);
		var color = 0x000000;
		// console.log(R,G,B, colorstr, color);
		var material = new THREE.LineBasicMaterial({ color: color, linewidth:3 });
		for (var j=0; j<r[i].length; j++){
			geometry.vertices.push(new THREE.Vector3(r[i][j].x, r[i][j].y, r[i][j].z));
			geometry_l.vertices.push(new THREE.Vector3(-r[i][j].x, r[i][j].y, r[i][j].z));
		}
		var line = new THREE.Line(geometry, material);
		var line_l = new THREE.Line(geometry_l, material);
		// Make a mirror image for the left side
		wirebody.add(line);
		wirebody.add(line_l);
	}
	// Add edge separately
	var geometry = new THREE.Geometry();
	var geometry_l = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth:3 });
	var r = ribpaths.soundboard_edge;
	for (var j=0; j<r.length; j++){
		geometry.vertices.push(new THREE.Vector3(r[j].x, r[j].y, r[j].z));
		geometry_l.vertices.push(new THREE.Vector3(-r[j].x, r[j].y, r[j].z));
	}
	var line = new THREE.Line(geometry, material);
	var line_l = new THREE.Line(geometry_l, material);
	// Make a mirror image for the left side
	wirebody.add(line);
	wirebody.add(line_l);
	// Move down a bit to center on screen
	console.log(wirebody);
	wirebody.translateY(-300);
	return wirebody;
}

function create_3d_meshbody(ribpaths){
	// Convert ribpaths to vector3s
	console.log("Ribpaths to 3D", ribpaths);
	var r = ribpaths.threedee; // Array of 3d points. Begin from leftmost rib.
	// for (var i=ribpaths.threedee.length; i<0; i--){
		// r.push(ribpaths.threedee[i]);
	// }
	function addvector (g,x,y,z,l) {
			g.vertices.push(new THREE.Vector3(x,y,z));
			if (!l) vcounter++;
			
		}
	var meshbody = new THREE.Group();
	// Create line colours
	var normal = new THREE.Vector3( 0, 0, -1 );
	for (var i=0; i<r.length; i++){
		// For each rib, choose a color between red and blue
		var geometry = new THREE.Geometry();
		var geometry_l = new THREE.Geometry();
		// var R = ("00"+parseInt(50).toString(16)).substr(-2);
		// var G = ("00"+parseInt(255*(i/(r.length-1))).toString(16)).substr(-2);
		// var B = ("00"+parseInt(255*(1- i/(r.length-1))).toString(16)).substr(-2);
		// var colorstr = R + G + B;
		// var color = parseInt(colorstr,16);
		var color = 0x885555;
		// console.log(R,G,B, colorstr, color);
		var material = new THREE.MeshStandardMaterial({ color: color, roughness:0.40, metalness:0.40, flatShading:true, wireframe:false });
		material.side = THREE.DoubleSide;
		// Find mesh points
		var vcounter = 0; // counts vectors
		
		// console.log(i,"has",r[i].length, "points");
		if (i==0){ // Center rib
			for (var j=0; j<r[i].length; j++){
				addvector(geometry, -r[i][j].x, r[i][j].y, r[i][j].z);
				addvector(geometry, r[i][j].x, r[i][j].y, r[i][j].z);
				if (j>0){
					geometry.faces.push( new THREE.Face3( vcounter-4, vcounter-2, vcounter-3, normal) ); // first triangle
					geometry.faces.push( new THREE.Face3(vcounter-1, vcounter-3, vcounter-2, normal) ); // second triangle
				}
			}
			
			meshbody.add(new THREE.Mesh( geometry, material ));
			// i = rib, j = point in rib
		} else {
			// right side ribs
			var ofs=0;
			var rightv = 0; // which vertex in the right rib joint are we at in a catch up situation
			var first = true;
			for (var j=0; j<r[i].length && j+ofs<r[i-1].length ; j++){ // right side
				// console.log(i,j, ofs,j+ofs, rightv);
				
				// Let the previous rib joint catch up in the y coordinate
				// while i.y > i-1.y, add offset to i-1 and do a face
				if (first && r[i][j].y > r[i-1][j+ofs].y){
					addvector(geometry_l, -r[i][j].x, r[i][j].y, r[i][j].z, true);
					addvector(geometry, r[i][j].x, r[i][j].y, r[i][j].z);
					rightv = vcounter-1;
					addvector(geometry_l, -r[i-1][j+ofs].x, r[i-1][j+ofs].y, r[i-1][j+ofs].z, true);
					addvector(geometry, r[i-1][j+ofs].x, r[i-1][j+ofs].y, r[i-1][j+ofs].z);
					while (r[i][j].y > r[i-1][j+ofs].y){
						ofs++;
						addvector(geometry_l, -r[i-1][j+ofs].x, r[i-1][j+ofs].y, r[i-1][j+ofs].z, true);
						addvector(geometry, r[i-1][j+ofs].x, r[i-1][j+ofs].y, r[i-1][j+ofs].z);
						// console.log(i,j, ofs,j+ofs, rightv);
						geometry_l.faces.push( new THREE.Face3( vcounter-1, vcounter-2, rightv, normal) );
						geometry.faces.push( new THREE.Face3( vcounter-1, vcounter-2, rightv, normal) );
						
					}
					// add right side face
					j++;
					if (j >= r[i].length) break;
					ofs--;
					// console.log(i,j, r[i][j]);
					addvector(geometry_l, -r[i][j].x, r[i][j].y, r[i][j].z, true);
					addvector(geometry, r[i][j].x, r[i][j].y, r[i][j].z);
					geometry_l.faces.push( new THREE.Face3( vcounter-1, rightv, vcounter-2, normal) );
					geometry.faces.push( new THREE.Face3( vcounter-1, rightv, vcounter-2, normal) );
					first = false;
				} else {
					addvector(geometry_l, -r[i-1][j+ofs].x, r[i-1][j+ofs].y, r[i-1][j+ofs].z, true);
					addvector(geometry, r[i-1][j+ofs].x, r[i-1][j+ofs].y, r[i-1][j+ofs].z);
					addvector(geometry_l, -r[i][j].x, r[i][j].y, r[i][j].z, true);
					addvector(geometry, r[i][j].x, r[i][j].y, r[i][j].z);
					if (j>0){
						geometry_l.faces.push( new THREE.Face3( vcounter-4, vcounter-3, vcounter-2, normal) ); // first triangle
						geometry.faces.push( new THREE.Face3( vcounter-4, vcounter-3, vcounter-2, normal) ); // first triangle
						geometry_l.faces.push( new THREE.Face3(vcounter-3, vcounter-1, vcounter-2 , normal) ); // second triangle
						geometry.faces.push( new THREE.Face3(vcounter-3, vcounter-1, vcounter-2 , normal) ); // second triangle
					}
				}
			}
			// vcounter = 0; // counts vectors
			// for (var j=0; j<r[i].length; j++){ // left side
				// addvector(geometry_l, -r[i-1][j].x, r[i-1][j].y, r[i-1][j].z);
				// addvector(geometry_l, -r[i][j].x, r[i][j].y, r[i][j].z);
				// if (j>0){
					// geometry_l.faces.push( new THREE.Face3( vcounter-4, vcounter-3, vcounter-2, normal) ); // first triangle
					// geometry_l.faces.push( new THREE.Face3(vcounter-3, vcounter-1, vcounter-2 , normal) ); // second triangle
				// }
			// }
			
			meshbody.add(new THREE.Mesh( geometry, material ));
			meshbody.add(new THREE.Mesh( geometry_l, material ));
			
		} 
	}
	meshbody.translateY(-300);
	console.log(meshbody);
	
	return meshbody;
}

///////////////////////////////////////////////////////////////////////////////
// Three.js functions
///////////////////////////////////////////////////////////////////////////////

// TODO: Draw foamcore mold in 3D. Parse SVG shapes for coordinates? Place rib supports based on angles and values from lute3d.planedata?
function create_3D_foamcore (parts){
	// Convert ribpaths to vector3s
	console.log("Ribpaths to 3D", ribpaths);
	var r = lute3d.ribpaths.threedee; // Array of 3d points
	var foamcore = new THREE.Group();
	// Create line colours
	for (var i=0; i<r.length-1; i++){
		// For each rib, choose a color between red and blue
		var geometry = new THREE.Geometry();
		var geometry_l = new THREE.Geometry();
		// var B = ("00"+parseInt(50).toString(16)).substr(-2);
		// var R = ("00"+parseInt(255*(i/(r.length-1))).toString(16)).substr(-2);
		// var G = ("00"+parseInt(255*(1- i/(r.length-1))).toString(16)).substr(-2);
		// var colorstr = R + G + B;
		// var color = parseInt(colorstr,16);
		var color = 0xffffff;
		// console.log(R,G,B, colorstr, color);
		var material = new THREE.LineBasicMaterial({ color: color, linewidth:3 });
		for (var j=0; j<r[i].length; j++){
			geometry.vertices.push(new THREE.Vector3(r[i][j].x, r[i][j].y, r[i][j].z));
			geometry_l.vertices.push(new THREE.Vector3(-r[i][j].x, r[i][j].y, r[i][j].z));
		}
		var line = new THREE.Line(geometry, material);
		var line_l = new THREE.Line(geometry_l, material);
		// Make a mirror image for the left side
		wirebody.add(line);
		wirebody.add(line_l);
	}
	// Add edge separately
	var geometry = new THREE.Geometry();
	var geometry_l = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth:3 });
	var r = ribpaths.soundboard_edge;
	for (var j=0; j<r.length; j++){
		geometry.vertices.push(new THREE.Vector3(r[j].x, r[j].y, r[j].z));
		geometry_l.vertices.push(new THREE.Vector3(-r[j].x, r[j].y, r[j].z));
	}
	var line = new THREE.Line(geometry, material);
	var line_l = new THREE.Line(geometry_l, material);
	// Make a mirror image for the left side
	wirebody.add(line);
	wirebody.add(line_l);
	// Move down a bit to center on screen
	console.log(wirebody);
	wirebody.translateY(-300);
	return wirebody;
}


function init(el) {
	renderer = new THREE.WebGLRenderer( {antialias:true} );
	renderer.setSize(el.clientWidth, el.clientHeight);
	el.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(75, el.clientWidth /el.clientHeight, 1, 5000);
	camera.position.set(0, 0, 500);
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x666666);
	var wirebody = create_3d_wirebody(lute3d.ribpaths);
	wirebody.scale.set(1.001,1.0005,1.001);
	scene.add(wirebody);
	scene.add(create_3d_meshbody(lute3d.ribpaths));
	var AmbientLight = new THREE.AmbientLight( 0x606060 ); // soft white light
	scene.add( AmbientLight );
	var light = new THREE.PointLight( 0xffaaaa, 10, 1000, 1 );
	light.position.set( 200,0,800 );
	scene.add( light );
	// THREE.Object3D.DefaultUp = new THREE.Vector3( 1,-1,0 )
	// var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
	// directionalLight.position = new THREE.Vector3( 500, 1000, 1000 );
	// scene.add( directionalLight );
	// directionalLight.target.position = new THREE.Vector3( 0,0,0 );
	
	controls = new THREE.OrbitControls( camera );

	//controls.update() must be called after any manual changes to the camera's transform
	// camera.position.set( 0, 20, 100 );
	controls.update();
	// renderer.render(scene, camera);

	// camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
	// camera.position.z = 1;

	// scene = new THREE.Scene();

	// geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
	// material = new THREE.MeshNormalMaterial();

	// mesh = new THREE.Mesh( geometry, material );
	// scene.add( mesh );

	// renderer = new THREE.WebGLRenderer( { antialias: true } );
	// renderer.setSize( window.innerWidth, window.innerHeight );
	// document.getElementById("threetest").appendChild( renderer.domElement );

}

function animate() {

	animation_id = requestAnimationFrame( animate );

	// pyramid.rotation.x += 0.01;
	// pyramid.rotation.y += 0.02;
	controls.update();

	renderer.render( scene, camera );

}