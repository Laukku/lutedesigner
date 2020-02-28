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
// This file contains baked presets for entire instruments and methods for creating them

function select_instrument(el){
	// editorstate = instrumentpresets[el.value]; // Get preset editorstate. This allows the original to be modified, copy each value instead
	var fields = Object.getOwnPropertyNames(instrumentpresets[el.value]);
	for (var i=0; i<fields.length; i++){
		editorstate[fields[i]] = instrumentpresets[el.value][fields[i]];
	}
	backup(); // Make hash with editorstate data
	populateeditor(); // This fills the editor with data from editorstate
	makedrawing("select_instrument");
}


// TODO: Check which ones you have an actual drawing for and which ones are guesses


var bodypresets = { // TODO: Perhaps put these in a text field in body.svg in named groups like "venere-data"
	// TODO: "name": [ribs,bulge,ribspread, bodyscale, ribspacingstyle],
	"GiorgioSellas1626": [43, 2.2, 1],
	"Schelle": [11, 2.3, 0.6],
	"Buchenberg1614": [41, 2.2, 1],
	"MagnoGraill1627": [31, 2.2, 1],
	"Kaiser1609": [27, 2.2, 1],
	"Hartung1599": [35, 2.1, 1],
	"Harz": [15, 2.3, 0.6],
	"Hoffmann": [11, 2.3, 1],	// Fix this one
	"Dieffopruchar1612": [37, 2.15, 1],
	"Frei": [11, 2.25, 0.6],
	"Mahler": [9, 2.3, 0.6],
	"venere": [25, 2.2, 1],
	"gerle": [11, 2.3, 0.6],
	"niskanen": [17, 2.25, 1],
	"railich": [15, 2.3, 1],
	"sellas": [15, 2.3, 1],
	"jauck1746": [11, 2.3, 1]
}; // TODO: only the path d information is needed, so bake a dictionary
// var bodylist = {"nameoflute": {"side":"M0,0 C 3,5 3,4 3,5", "middle",...}, ...};


function makepreset(){
	// create an instrument preset
	// Remove unnecessary data; bassnuts that are not used in this instrument

	for (var i=1; i <= 10; i++){ 
		if (i >= editorstate.numbernuts ){
			delete(editorstate["courses_" + i] );
			delete(editorstate["mensur_" + i] );
			delete(editorstate["nutunit_" + i] );
			delete(editorstate["singles_" + i] );
			
			
			delete(editorstate.drawingpurpose );
			
		}

	}
	
	console.log(download_editorstate(false, " "));
}

// instrument presets contain all data in editorstate

var instrumentpresets = {
"Hoffmann 700mm 13c":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"Hoffmann","numberofribs":11,"bulge":2.3,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":700,"fingerboardcourses":11,"chanterelles":2,"singlestrings":false,"hasdiapasons":true,"mensur_1":760,"courses_1":2,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":105,"neckadd":-2,"pegboxstyle":"bassrider","foldable":false,"bridgestyle":"baroque","bridgeoffset":15,"distcoursesbridge":8.5,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":6,"distchanterellesnut":7.5,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"above","numbernuts":2},

"niskanen 109% 890mm 1740mm 1x7-1x7":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"niskanen","numberofribs":31,"bulge":2.4,"divisions":9,"ribspread":1,"rosettelist":"triple","rosettescale":100,"mensur":890,"fingerboardcourses":7,"chanterelles":1,"singlestrings":true,"hasdiapasons":true,"mensur_1":1740,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":96,"neckadd":21,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"horse","bridgeoffset":8,"distcoursesbridge":12,"diststringsbridge":5,"distchanterellesbridge":12,"distbasscoursesbridge":10.2,"distcoursesnut":8,"distchanterellesnut":8,"diststringsnut":2.5,"distbasscoursesshortnut":7,"distbasscoursesnut":5,"ribspacing":"theorbo","bodyscale":1.09,"numbernuts":2},

"Hartung1599 845mm 1637mm 1x1+2x5-1x8":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"Hartung1599","numberofribs":17,"bulge":2.2,"divisions":9,"ribspread":1,"rosettelist":"triple","rosettescale":100,"mensur":845,"fingerboardcourses":6,"chanterelles":1,"singlestrings":false,"hasdiapasons":true,"mensur_1":1637,"courses_1":8,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":96,"neckadd":38,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"horse","bridgeoffset":8,"distcoursesbridge":7.8,"diststringsbridge":5,"distchanterellesbridge":8.5,"distbasscoursesbridge":10.2,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":1.8,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"theorbo","numbernuts":2,"drawallstrings":true,"limitorset":"limit"},

"Buchenberg1614 850mm 1740mm 1x7-1x7":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"Buchenberg1614","numberofribs":17,"bulge":2.2,"divisions":9,"ribspread":1,"rosettelist":"triple","rosettescale":100,"mensur":850,"fingerboardcourses":7,"chanterelles":1,"singlestrings":true,"hasdiapasons":true,"mensur_1":1740,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":22,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"horse","bridgeoffset":8,"distcoursesbridge":12,"diststringsbridge":5,"distchanterellesbridge":12,"distbasscoursesbridge":10.2,"distcoursesnut":8,"distchanterellesnut":8,"diststringsnut":2.5,"distbasscoursesshortnut":7,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":2,"ribspacing":"evenclasp"},

"Schelle 850mm 1650mm 1x1+2x6-1x7":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"Schelle","numberofribs":11,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":850,"fingerboardcourses":7,"chanterelles":1,"singlestrings":false,"hasdiapasons":true,"mensur_1":1650,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":21,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"schelle","bridgeoffset":24,"distcoursesbridge":7.8,"diststringsbridge":5,"distchanterellesbridge":8.5,"distbasscoursesbridge":10.2,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":1.8,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":2,"ribspacing":"evenclasp"},

"Schelle 875mm 1700mm 1x7-1x7":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"Schelle","numberofribs":11,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":875,"fingerboardcourses":7,"chanterelles":1,"singlestrings":true,"hasdiapasons":true,"mensur_1":1700,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":21,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"schelle","bridgeoffset":8,"distcoursesbridge":12,"diststringsbridge":5,"distchanterellesbridge":12,"distbasscoursesbridge":10.2,"distcoursesnut":8,"distchanterellesnut":8,"diststringsnut":2.5,"distbasscoursesshortnut":7,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":2,"ribspacing":"evenclasp"},

"Harz 675mm 1400mm 1x1+2x6-1x7":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"Harz","numberofribs":15,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"triple","rosettescale":100,"mensur":675,"fingerboardcourses":7,"chanterelles":1,"singlestrings":false,"hasdiapasons":true,"mensur_1":1400,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":19,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"horse","bridgeoffset":8,"distcoursesbridge":7.8,"diststringsbridge":5,"distchanterellesbridge":8.5,"distbasscoursesbridge":10.2,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":1.8,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":2,"ribspacing":"evenclasp"},

"Harz 750mm 1500mm 1x7-1x7":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"Harz","numberofribs":15,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"triple","rosettescale":100,"mensur":750,"fingerboardcourses":7,"chanterelles":1,"singlestrings":true,"hasdiapasons":true,"mensur_1":1500,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":20,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"horse","bridgeoffset":8,"distcoursesbridge":12,"diststringsbridge":5,"distchanterellesbridge":12,"distbasscoursesbridge":10.2,"distcoursesnut":8,"distchanterellesnut":8,"diststringsnut":2.5,"distbasscoursesshortnut":7,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":2,"ribspacing":"evenclasp"},

"Hoffmann 700mm 1x2+2x9":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"Hoffmann","numberofribs":11,"bulge":2.3,"divisions":9,"ribspread":1,"rosettelist":"single","ribspacing":"above","rosettescale":100,"mensur":700,"fingerboardcourses":11,"chanterelles":2,"singlestrings":false,"hasdiapasons":false,"mensur_1":1500,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":99,"neckadd":-6,"pegboxstyle":"chanterelle","foldable":false,"bridgestyle":"sbend","bridgeoffset":8,"distcoursesbridge":8.5,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":6,"distchanterellesnut":7.5,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"above"},

"Dieffopruchar1612 670mm 1x1+2x9":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"Dieffopruchar1612","numberofribs":37,"bulge":2.15,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":670,"fingerboardcourses":10,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"mensur_1":1500,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":93,"neckadd":-6,"pegboxstyle":"chanterelle","foldable":false,"bridgestyle":"sbend","bridgeoffset":8,"distcoursesbridge":8.5,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":6,"distchanterellesnut":7.5,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},

"Frei 630mm 1x1+2x9":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"Frei","numberofribs":11,"bulge":2.2,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":630,"fingerboardcourses":10,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"sbend","bridgeoffset":8,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"evenclasp","numbernuts":1,"drawallstrings":false,"limitorset":"limit"},

"Mahler 670mm 1x2+2x9":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"Mahler","numberofribs":9,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":670,"fingerboardcourses":11,"chanterelles":2,"singlestrings":false,"hasdiapasons":false,"mensur_1":1500,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":99,"neckadd":-6,"pegboxstyle":"chanterelle","foldable":false,"bridgestyle":"sbend","bridgeoffset":8,"distcoursesbridge":8.5,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":6,"distchanterellesnut":7.5,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},

"railich 615mm 1x2+2x9":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"railich","numberofribs":15,"bulge":2.3,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":615,"fingerboardcourses":11,"chanterelles":2,"singlestrings":false,"hasdiapasons":false,"mensur_1":1500,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":102,"neckadd":-6,"pegboxstyle":"chanterelle","foldable":false,"bridgestyle":"schelle","bridgeoffset":10,"distcoursesbridge":8.5,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":6,"distchanterellesnut":7.5,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},

"gerle 600mm 1x1+2x5":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"gerle","numberofribs":11,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":600,"fingerboardcourses":6,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"mensur_1":1700,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"ball","bridgeoffset":8,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},

"venere 585mm 1x1+2x6":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"venere","numberofribs":25,"bulge":2.2,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":585,"fingerboardcourses":7,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"mensur_1":1700,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":8,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},


"Frei 630mm 1x1+2x5":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"Frei","numberofribs":11,"bulge":2.25,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":630,"fingerboardcourses":6,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"mensur_1":1500,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":102,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":10,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},

"Mahler 670mm 1x1+2x5":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"Mahler","numberofribs":9,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":670,"fingerboardcourses":6,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"mensur_1":1500,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":102,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":10,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},

"renstudent 595mm 1x1+2x6":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"renstudent","numberofribs":9,"bulge":2.3,"divisions":9,"ribspread":0.5,"rosettelist":"single","rosettescale":100,"mensur":595,"fingerboardcourses":7,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"flat","neckwidthlimit":76,"neckadd":-1,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":8,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"even","numbernuts":1,"drawallstrings":false,"limitorset":"limit","constructionmensur":597,"constructionbottom":12,"constructionside":6,"constructionsmall":1.4,"constructionwidth":4,"constructionwedge":0,"constructionlength":6.5,"bodyshapefrom":"fromlist","constructionshoulder":3,"constructionshoulderlength":0.25},

"renaissance_a 540mm 1x1+2x5":{"constructor":"construct","presetoverlay":false,"bodyshapefromlist":"renaissance_a","numberofribs":9,"bulge":2.3,"divisions":9,"ribspread":0.5,"rosettelist":"single","rosettescale":100,"mensur":540,"fingerboardcourses":6,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"flat","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":8,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"even","numbernuts":1,"drawallstrings":false,"limitorset":"limit","constructionmensur":597,"constructionbottom":12,"constructionside":6,"constructionsmall":1.4,"constructionwidth":4,"constructionwedge":0,"constructionlength":6.5,"bodyshapefrom":"fromlist","constructionshoulder":3,"constructionshoulderlength":0.25},




}
// defaultlute is venere 585mm 1x1+2x6, but loaded from here only on startup. If it were loaded from instrumentpresets it would get corrupted. It would need to be copied...
var defaultlute = {"drawingpurpose":"concept","constructor":"construct","presetoverlay":false,"bodyshapefromlist":"venere","numberofribs":25,"bulge":2.2,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":585,"fingerboardcourses":7,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"mensur_1":1700,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":8,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0};

// Chanterelle rider shape
var chanterelle_top = "m 0,0 l 5.6,0.1 m -6.6,-3.5 c -0.4,0 0,7.2 0.3,7.1 c 0.6,0.1 0.1,-7.1 -0.3,-7.1 z m 0.8,16.1 c 0.2,-7.8 -0.1,-21.2 -1.2,-21.1 c -1.1,0.4 0.4,12.7 1.2,21.1 l 6,0 l 0,-21.1 l 4,0 l 0,59.5 l -9,0 c 0.8,-26.3 -6.7,-36.2 -6,-59.5 l 3.8,0";

var chanterelle_side = "m 0,0 c 4.7,0 8.6,-3.8 8.6,-8.5 c 0,-4.7 -3.8,-8.6 -8.6,-8.6 c -19.6,-0 -24.2,15.5 -50,19 l -1,2 h 53 l -2,-3.9 c -11.8,0.1 -27.7,2.1 -50,1.9 m 53.5,-10.5 a 3.5,3.5 0 0 1 -3.5,3.5 a 3.5,3.5 0 0 1 -3.5,-3.5 a 3.5,3.5 0 0 1 3.5,-3.5 a 3.5,3.5 0 0 1 3.5,3.5 z";
