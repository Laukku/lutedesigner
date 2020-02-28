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
// Finding lute body shape in 3D using WebGL for accelerated math (not graphics rendering)
var accel_av = null;
function accel_available(){
	// Find out if there's a graphics card and webgl is supported
	if (accel_av === null){
		// Figure out if webgl can be done
		accel_av = true;
		return accel_av;
	} else {
		return accel_av;
	}
	
}