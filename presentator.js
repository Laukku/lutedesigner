// Presentator

// For creating zooming presentations from SVG files

// 1. Create a layer called 'slides' in your SVG file
// 2. Create rectangles that have the correct width to height ratio (1920:1080 for full HD screens and video)
// The rectangles can be rotated and resized (but maintain the aspect ratio by holding down the CTRL key)
// Each rectangle represents a "slide" in the presentation. They will be animated in the same order they are in the resulting SVG file. You can change the order of already created rectangles by using the PageDown and PageUp keys, and easily view the order by using the XML Editor in Inkscape (Ctrl+shift+X).
// 3. You can hide the rectangles by hiding the 'slides' layer in the Layers menu, but it might be useful to see them during the next step, and come back when done and hide them.
// 4. Open the file with the web page Presentator.html . A list of rectangles will be shown and you can give them different CSS animations here.
// 5. ???
// 6. Profit

// TODO: Viewer mode: 

var editorstate; // 


function findrects(){
	// Find layer 'slides'
	// Find all rectangles in that layer, which represent "viewports" in to the document.
}

function createCSS(){
	// Create CSS text string for saving and outputting later
}

function backup(){
	// Save editorstate in a hidden textbox
}
function renderSVG() {
	// View chosen SVG file in a container
}

window.onload = function() {
	// Show file dialog if there's no backup
}








