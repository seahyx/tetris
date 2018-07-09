/*
Javascript running pixi.min.js to display an interactive side-scrolling list of items that freely floats around.
*/
//Initiation ritual
let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}
PIXI.utils.sayHello(type)


//Create a Pixi Application
var app = new PIXI.Application({
	width: 1380,
	height: 1920,
	backgroundColor: 0xFFFFFF,
	antialias: true,
	transparent: false,
	resolution: 1
});

//Add the canvas that Pixi automatically created for you to the HTML document
document.getElementById("canvas").appendChild(app.view);

//Make the canvas fill the browser window proportionately
scaleToWindow(app.view);
//...and whenever the window is resized
window.addEventListener("resize", function(event){ 
	scaleToWindow(app.view);
});

//Get the scaling factor
var scale = scaleToWindow(app.view);

//Define deltaTime ticker
app.ticker.add(update);

//Initiates the update loop
requestAnimationFrame(update);




/* Constants */


var grid_width = 10;
var grid_height = 20;
//Hidden extra grid at the top of the visible grid
var grid_hidden = 2;

//Size of each grid unit
var unit_length = 60;
var unit_margin = 6;
var unit_round = 2;

//Boundary padding
var boundary_padding = 10;

//Grid colour
var c_filled = 0x000000;
var c_empty = 0x879571;
var c_background = 0x9aa680;

app.renderer.backgroundColor = 0x9aa680;




/* Actual stuff working */


//Variables
var score = 0;
var highscore = 0;
var level = 1;
var base_level = 1;

//Grid container
var grid_container = new PIXI.Container();
app.stage.addChild(grid_container);
grid_container.x = 50;
grid_container.y = app.renderer.height - 100;

//Grid array
var grid = create2dGrid(grid_width, grid_height);

//Create grid initialized with objects
function create2dGrid(width, height) {

	var empty_arr = [];
	var arr = [];
	//Grid unit object
	var obj = {id: 0};

	for (var y = 0; y < height; y++) {
		arr.push(empty_arr);
		for (var x = 0; x < width; x++) {
			obj.graphic = unitGraphic(
				x * (unit_length + (unit_margin * 2)) + (unit_margin + (unit_length/2)),
				-(y * (unit_length + (unit_margin * 2)) + (unit_margin + (unit_length/2))));
			arr[y].push(obj);
		}
	}

	return arr;
}

//Unit graphic
function unitGraphic(x, y) {

	var obj = new PIXI.Graphics();

	//Define stroke width and colour
	obj.lineStyle(6, c_empty, 1);
	//Draw rectangle border
	obj.drawRoundedRect(x,
		y,
		unit_length,
		unit_length,
		unit_round);
	
	obj.beginFill(c_empty, 1);
	obj.drawRoundedRect(
		x + unit_length/5,
		y + unit_length/5,
		3*unit_length/5,
		3*unit_length/5,
		unit_round);
	obj.endFill();

	//Define anchor point to be center
	obj.pivot.set(unit_length/2, unit_length/2);

	grid_container.addChild(obj);

	return obj;
}

//Grid border
var boundary = new PIXI.Graphics();
//Define stroke width and colour
boundary.lineStyle(8, c_filled, 1);
//Draw rectangle border
boundary.drawRoundedRect(
	-boundary_padding,
	-boundary_padding,
	grid_width * (unit_length + 2*unit_margin) + 2*boundary_padding,
	grid_height * (unit_length + 2*unit_margin) + 2*boundary_padding,
	2*unit_round);
boundary.pivot.set(0, grid_height * (unit_length + 2*unit_margin));
grid_container.addChild(boundary);




/* Update loop */


function update(deltaTime) {

	//dt change to per second
	let dt = deltaTime / 60;





	//Debugging purposes
	//console.log(dt);
}