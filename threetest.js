// Test the three.js library
// This code draws a cube with WebGL
var camera, scene, renderer;
// var geometry, material, mesh;
var pyramid;
var controls;
window.onload = function() {
	init(getelid("bodyviewer"));
	animate();
}
function init(el) {
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	el.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 500);
	camera.position.set(0, 0, 50);
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	scene = new THREE.Scene();
	// Create pyramid made of lines
	//create a blue LineBasicMaterial
	var material = new THREE.LineBasicMaterial({ color: 0x0000ff });
	var geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3(-10, -10, 0));
	geometry.vertices.push(new THREE.Vector3(-10, 10, 0));
	geometry.vertices.push(new THREE.Vector3(10, 10, 0));
	geometry.vertices.push(new THREE.Vector3(10, -10, 0));
	geometry.vertices.push(new THREE.Vector3(-10, -10, 0));
	base = new THREE.Line(geometry, material);
	
	var geometry = new THREE.Geometry()	
	geometry.vertices.push(new THREE.Vector3(-10, -10, 0));
	geometry.vertices.push(new THREE.Vector3(0, 0, 15));
	geometry.vertices.push(new THREE.Vector3(10, -10, 0));	
	var side = new THREE.Line(geometry, material);
	
	var geometry = new THREE.Geometry()	
	geometry.vertices.push(new THREE.Vector3(-10, 10, 0));
	geometry.vertices.push(new THREE.Vector3(0, 0, 15));
	geometry.vertices.push(new THREE.Vector3(10, 10, 0));	
	var side2 = new THREE.Line(geometry, material);
	
	pyramid = new THREE.Group();
	pyramid.add( base );
	pyramid.add( side );
	pyramid.add( side2 );
	scene.add(pyramid);
	controls = new THREE.OrbitControls( camera );

	//controls.update() must be called after any manual changes to the camera's transform
	camera.position.set( 0, 20, 100 );
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

	requestAnimationFrame( animate );

	// pyramid.rotation.x += 0.01;
	// pyramid.rotation.y += 0.02;
	controls.update();

	renderer.render( scene, camera );

}