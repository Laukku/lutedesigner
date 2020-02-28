<?php echo(" ");?>
<html>

<head>
<title>Lute Designer | Niskanen Lutes</title>
	<meta property="og:title" content="Lute Designer"/>
    <meta property="og:type" content="website"/>
    <meta property="og:url" content="https://www.niskanenlutes.com/lutedesigner/fullmode.php"/>
    <meta property="og:image" content="https://www.niskanenlutes.com/lutedesigner/lutedesigner-og.png"/>
	<meta property="og:image:type" content="image/jpg">
	<meta property="og:image:width" content="470">
	<meta property="og:image:height" content="246">
    <meta property="og:site_name" content="Niskanen Lutes"/>
    <meta property="fb:admins" content="526938350"/>
    <meta property="og:description"
          content="Free online parametric design aid for lutes"/>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta charset="UTF-8"> 

<meta name="description" content="Create lute technical drawings easily!">
<!-- <meta name="title" content="Lauri Niskanen, luthier"> -->
<link rel="shortcut icon" href="LDicon3.png" type="image/x-icon">
<!--Replacement for removed SVG path segment API-->
<script src="pathseg.js"></script>
<!--Lute designer helpers-->
<script src="lutedesigner-helper.js"></script>
<script src="lutedesigner-editing.js"></script>
<script src="lutedesigner-draw.js"></script>
<script src="lutedesigner-body.js"></script>
<script src="lutedesigner-bodyviewer.js"></script>
<script src="lutedesigner-presets.js"></script>

<?php
//<script src="lutedesigner-webglmath.js"></script>
if (isset($fullmode)){
echo('
<script src="lutedesigner-fullversion.js"></script>
<script src="lutedesigner-form.js"></script>

<script src="lutedesigner-planmaker.js"></script>
<script src="lutedesigner-gcode.js"></script>

<script src="three-finger-debug.js"></script>

');
}
?>

<!-- three.js for WebGL 3D stuff -->
<script src="threejs/three.min.js"></script>
<script src="threejs/examples/js/controls/OrbitControls.js"></script>
<!--Lute designer main file-->
<script src="lutedesigner.js"></script>
</head>



<?php
include("lutedesigner.html");




?>