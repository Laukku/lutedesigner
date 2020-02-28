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
// Add some options to lutedesigner, which begins to make it the full version

// TODO: quick dirty method for sideview ribs: Scale middle path in X to get approximated rib sideview shapes. Hide advanced code to full version. Also draw simple cross section view.

// Draw svg border with size information ie. lines of certain lengths
// draw frets as a group
/* // TODO:
Lute designer hyödyllisiä mittoja
Rib length & width
rosette width
neck angle
pegbox width, length, also draw neck on detached view
*/

// Bug in open preset: Body shapes are duplicated in the list, some other things too

// Calculation subroutines, so webgl can be easily used later


// Draw interactive nodes on body shape on another layer so they can be moved easily

// Store rosettes separately as images
// Store body shapes in a single file as svg


// frets on neck vs. string length: Frets override string length, should show some error message too


// TODO: Body presets containing number of ribs, bulge and rib spread
// TODO: Full instrument presets with strings, bridge types, neckadds etc should be another thing entirely
// var bodynames =""; // Every startup, body names are collected here so they can be manually baked into bodypresets


features_init.push(function(){


	// creel(tagname, id, cla, attrs, NS, del){
	// to metaselector
	var meta = getelid("metaselector");

	// var label = creel("label");
	// label.innerHTML = '<button id="copylinkbutton" onclick="copylink();">Copy link (to limited mode)</button>';
	// addel(meta, label);

	var label = creel("label");
	label.innerHTML = '<button id="editorstatebutton" onclick="download_editorstate(true);">Save Preset As...</button>';
	addel(meta, label);

	var label = creel("label");
	label.innerHTML = 'Open Preset<input type="file" id="editorstateuploadbutton" onchange="upload_editorstate(this);" accept=".json"/>';
	addel(meta, label);


	var label = creel("label");
	label.innerHTML = '<button id="downloadbutton" onclick="downloaddrawing();">Download SVG drawing</button>';
	addel(meta, label);

	// var label = creel("label");
	// label.innerHTML = '<button id="hidehandles" onclick="hidehandles(this);">Show handles</button>';
	// addel(meta, label);
	
	var opt = creel("option");
	opt.value = "technical";
	opt.innerHTML = "Technical drawing";
	addel(getelid("drawingpurpose"), opt);
	
	// var label = creel("label");
	// label.innerHTML = 'Drawing is a<select id="drawingpurpose" name="drawingpurpose" onchange="settingchange(this)"><option value="technical" selected>Technical drawing</option></select>';
	// addel(meta, label);

	// To pegboxstyle
	var peg = getelid("pegboxstyle");

	var label = creel("option");
	label.innerHTML = 'Swan neck';
	label.value = 'swanneck';
	addel(peg, label);

	var label = creel("option");
	label.innerHTML = 'Swan neck triple';
	label.value = 'swannecktriple';
	addel(peg, label);

	var label = creel("option");
	label.innerHTML = 'Orpharion / Curvy /w head';
	label.value = 'curvy';
	addel(peg, label);

});
features.push(function add_layers(){
	// Make export layer for inkscape_pdf_export.py
	var drawing = getelid("designer-canvas");
	var exportlayer = makegroup(drawing, "export-areas", "export-areas");
	var fullplanlayer = makegroup(exportlayer, "fullplanlayer", "plan");
	var templateslayer = makegroup(exportlayer, "templateslayer", "templates");
	var fformplanlayer = makegroup(exportlayer, "foamformplanlayer", "foamform");
	var cformplanlayer = makegroup(exportlayer, "carvedformplanlayer", "carvedform");
	drawrect(fullplanlayer, new Point(-400,0), {w:190,h:277}, NOFILLTHIN, "rect-1");
});
function copylink(){
	// Copy link to online limited mode lutedesigner
	var a = creel("input");
	a.value = "https://www.niskanenlutes.com/lutedesigner/index.php"+location.hash;
	addel(getelid("pagewrapper"),a);
	a.select();
	document.execCommand("copy");
	delel(a);
}
function download_editorstate(d,sep){
	// return or offer for download a JSONified version of editorstate
	var sep = sep || "_";
	var txt = JSON.stringify(editorstate);
	var datatype = 'data:txt/html;charset=utf-8,';
	var bm = "";
	var b = 1;
	while (editorstate["mensur_"+b] && b < editorstate.numbernuts){
		bm = sep+getmensur(b) + "mm";
		b++;
	} 
	var fname = editorstate.bodyshapefromlist+sep+ 
				editorstate.mensur+"mm"+ 
				bm+ 
				sep+stringing();
	if (d){
		fname += ".json";
		download(fname, txt, datatype);
	} else {
		// return {name:fname,txt:txt};
		return '"'+fname+'":'+txt+',\n';
	}
	
}
function upload_editorstate(el){
	// Open a saved .json preset of an instrument in the editor
	var file = el.files[0];
	
	var reader = new FileReader();
	reader.onload = function(e) {
		console.log("result",e.target.result);
		editorstate = JSON.parse(e.target.result);
		// Make sure loaded values are displayed in the editor
		backup();
		populateeditor();
		// Make drawing with loaded values.
		makedrawing("upload_editorstate");
	}
	// Run the filereader
	reader.readAsText(file);
	
}
function download(filename, txt, datatype) { 
	// Open save file dialog. Might not work on IE.
    var pom = document.createElement('a');
    pom.setAttribute('href', (datatype + encodeURIComponent(txt)));
    pom.setAttribute('download', filename);
    
    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    } else {
        pom.click();
    }
}
function save_editorstate(){
	// Saves all data from editor (remember changed nodes from SVG too)
	// Puts the data in the svg somewhere as JSON? in a comment?
	// Also updates global editorstate variable.
	
}
function save_as_file(){
	// Save svg contents into a file, upload to server
	// Needs php script that handles the upload on the server
	var state_to_save = save_editorstate()
}
function downloaddrawing(){
	// Save svg contents into a file, and open file download dialog for the user locally
	var drawing = getelid("designer-canvas");
	drawing.setAttribute("xmlns:sodipodi", "http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd");
	drawing.setAttribute("xmlns:inkscape", "http://www.inkscape.org/namespaces/inkscape");
	// Make document background opaque white
	// Set scale to 0,0 and viewport to 0,0 ?
	// Attributes of svg tag:
	// width="210mm"
    // height="297mm"
    // viewBox="0 0 210 297"
	
	// scale is calculated automatically from viewbox size and page size.
	drawing.setAttribute("width", "210mm");
	drawing.setAttribute("height", "297mm");
	drawing.setAttribute("viewBox", "0 0 210 297");
	delelid("handlelayer"); // Remove handles etc
	// Add scale & user unit information for inkscape
	var scale = [
	"inkscape:document-units","mm",
	"inkscape:window-maximized","1",
	"inkscape:current-layer","designer-canvas",
	"scale-x","1",
	"scale-y","1",
	"id","base",
	"pagecolor","#ffffff",
	"inkscape:pageopacity","1",
	"units","mm"];
	var s = creel("sodipodi:namedview", "namedview", "", scale);
	addel(drawing, s);
	// Make a filename that makes sense
	var b = 1;
	var bm="";
	while (editorstate["mensur_"+b] && b < editorstate.numbernuts){
		bm = getmensur(b);
		b++;
	} 
	var fname = editorstate.bodyshapefromlist+"_"+ 
				editorstate.mensur+ "mm"+
				bm+"_"+ 
				stringing()+".svg";
	// offer a download
	var datatype = 'data:image/svg+xml;charset=utf-8,';
	download(fname, drawing.outerHTML, datatype);	
	
	
}

function bodylist_totext(){
	// Create javascript object declaration string from bodylist with baked in path d attributes
	// This will allow the body shapes to be baked in the JS rather be read from SVG every time.
	var o = "var bodylist = {\r\n";
	for (var lutename in bodylist){
		if(bodylist.hasOwnProperty(lutename)){
			// console.log(lutename);
			o+='\t"'+lutename+'": {\r\n';
				for (var part in bodylist[lutename]){
					if(bodylist[lutename].hasOwnProperty(part)){
						o+='\t\t"'+part+'": "';
						bodylist[lutename][part].pathSegList[0].x=0;
						bodylist[lutename][part].pathSegList[0].y=0;
						o+=bodylist[lutename][part].getAttribute("d");
						o+= '",\r\n';
					}
				}
			o+= '\t},\r\n';
		}
	}
	o += "};\r\n"
	console.log(o);
}


/* function backup(){
	// console.log("backupping");
	// Save editorstate as json in a hidden input field
	// var b = getelid("designer-backup");
	// b.value = JSON.stringify(editorstate);
	// TODO: Save edited paths in editorstate?
	makehash(editorstate);
} */
