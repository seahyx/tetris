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




/* Constants */


//Grid details
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

//Keyboard long-press time and repeat time (in seconds)
var keyboard_ini_p_t = 0.25;
var keyboard_rep_p_t = 0.06;




/*Tetris brick objects*/
/*
*   A tetris brick object have 9 attributes:
	name                -       display name of the object
	c_rotation          -       current rotation of the object (or default rotation at definition)
	x                   -       in-game x position of the anchor
	y                   -       in-game y position of the anchor
								anchor is at the centre of the boundary box
	kick_margin         -       size of extra margin given to rotating shape
	bounding_size       -       size of the square boundary of the pieces
	c_margin            -       current offset of shape from original position
	schematic           -       array of objects containing coordinates for the blocks in default rotation
								0 is the bottom-left box
								usually defined starting from the top of the shape, left to right
*/

//Array of all the shapes
var Shapes = [Shape_t, Shape_l, Shape_il, Shape_s, Shape_z, Shape_i, Shape_sq];

//T-shape
function Shape_t(x, y) {
	this.name = "T";
	this.c_rotation = 0;
	this.x = x;
	this.y = y;
	this.kick_margin = 1;
	this.bounding_size = 3;
	this.c_margin = {x: 0, y: 0};
	this.schematic = [
		{x: 1, y: 2},
		{x: 0, y: 1},
		{x: 1, y: 1},
		{x: 2, y: 1}
		];
}

//L-shape
function Shape_l(x, y) {
	this.name = "L";
	this.c_rotation = 0;
	this.x = x;
	this.y = y;
	this.kick_margin = 1;
	this.bounding_size = 3;
	this.c_margin = {x: 0, y: 0};
	this.schematic = [
		{x: 2, y: 2},
		{x: 0, y: 1},
		{x: 1, y: 1},
		{x: 2, y: 1}
		];
}

//Inverse L-shape
function Shape_il(x, y) {
	this.name = "Inverse L";
	this.c_rotation = 0;
	this.x = x,
	this.y = y,
	this.kick_margin = 1,
	this.bounding_size = 3,
	this.c_margin = {x: 0, y: 0};
	this.schematic = [
		{x: 0, y: 2},
		{x: 0, y: 1},
		{x: 1, y: 1},
		{x: 2, y: 1}
		];
}

//S-shape
function Shape_s(x, y) {
	this.name = "S";
	this.c_rotation = 0;
	this.x = x;
	this.y = y;
	this.kick_margin = 1;
	this.bounding_size = 3;
	this.c_margin = {x: 0, y: 0};
	this.schematic = [
		{x: 1, y: 2},
		{x: 2, y: 2},
		{x: 0, y: 1},
		{x: 1, y: 1}
		];
}

//Z-shape
function Shape_z(x, y) {
	this.name = "Z";
	this.c_rotation = 0;
	this.x = x;
	this.y = y;
	this.kick_margin = 1;
	this.bounding_size = 3;
	this.c_margin = {x: 0, y: 0};
	this.schematic = [
		{x: 0, y: 2},
		{x: 1, y: 2},
		{x: 1, y: 1},
		{x: 2, y: 1}
		];
}

//I
function Shape_i(x, y) {
	this.name = "I";
	this.c_rotation = 0;
	this.x = x;
	this.y = y;
	this.kick_margin = 2;
	this.bounding_size = 4;
	this.c_margin = {x: 0, y: 0};
	this.schematic = [
		{x: 0, y: 2},
		{x: 1, y: 2},
		{x: 2, y: 2},
		{x: 3, y: 2}
		];
}

//Square
function Shape_sq(x, y) {
	this.name = "Square";
	this.c_rotation = 0;
	this.x = x;
	this.y = y;
	this.kick_margin = 0;
	this.bounding_size = 2;
	this.c_margin = {x: 0, y: 0};
	this.schematic = [
		{x: 0, y: 1},
		{x: 1, y: 1},
		{x: 0, y: 0},
		{x: 1, y: 0}
		];
}




/* Actual stuff working */


//Grid container
var grid_container = new PIXI.Container();
app.stage.addChild(grid_container);
grid_container.x = 50;
grid_container.y = app.renderer.height - 100;

//Grid 2d array
var grid = generate2dGrid(grid_width, grid_height);

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
	//Move anchor point to bottom-left
	boundary.pivot.set(0, grid_height * (unit_length + 2*unit_margin));
	grid_container.addChild(boundary);




/* Update loop */


//KB Variables
var left_arrow = {pressed: false, press_duration: 0, ini_rep: true};
var right_arrow = {pressed: false, press_duration: 0, ini_rep: true};
var up_arrow = {pressed: false, press_duration: 0, ini_rep: true};
var down_arrow = {pressed: false, press_duration: 0, ini_rep: true};

//Array of all keys
var keys = [left_arrow, right_arrow, up_arrow, down_arrow];

//Variables
var score = 0;
var highscore = 0;

var level = 1;
var base_level = 1;

var elapsed_time = 0;           //elapsed time from start of game
var block_present = false;      //if there is a player-controlled tetromino in the game right now
var gravity_cooldown = 1;    //cooldown time to next drop
var c_gravity_cooldown = 0;    //current cooldown time to next drop
var c_block_obj;                //current block object

var dt = 0;

//Generate a random number for the shape
let random_shape_num = Math.floor((Math.random() * Shapes.length) + 0);
//Set active shape
c_block_obj = new Shapes[random_shape_num](Math.floor(grid_width/2), grid_height);
//Spawn shape into grid
drawShape(grid, -1, c_block_obj);
block_present = true;

//Define deltaTime ticker -- update function
app.ticker.add(function(deltaTime) {

	//dt change to per second
	dt = deltaTime / 60;
	elapsed_time += dt;
	c_gravity_cooldown += dt;

	//Test for drop
	if (c_gravity_cooldown >= gravity_cooldown) {
		c_gravity_cooldown -= gravity_cooldown;

		let moveable = moveShape(grid, -1, c_block_obj, "down"); //will return fals if unable to drop further

		//Test if the shape is going to set
		if (!moveable) {
			//Set the shape (turn id to 1)
			drawShape(grid, 1, c_block_obj);

			//Generate random number for the shape
			let random_shape_num = Math.floor((Math.random() * Shapes.length) + 0);
			//Set active shape
			c_block_obj = new Shapes[random_shape_num](Math.floor(grid_width/2), grid_height);
			//Spawn shape into grid
			drawShape(grid, -1, c_block_obj);
			block_present = true;
			c_gravity_cooldown = gravity_cooldown;
		}
	}


	//KB responses
	keys.forEach(function(key) {
		if (key.pressed) {
			key.press_duration += dt;

			if (key.ini_rep) {
				if (key.press_duration >= keyboard_ini_p_t) {
					key.press_duration -= keyboard_ini_p_t;
					key.ini_rep = false;
					key.func();
				}
			} else {
				if (key.press_duration >= keyboard_rep_p_t) {
					key.press_duration -= keyboard_rep_p_t;
					key.func();
				}
			}
		} else {
			key.press_duration = 0;
			key.ini_rep = true;
		}
	});


	//Debugging purposes
	//console.log(elapsed_time);
});




/* Keycode Events */


//left arrow
left_arrow.event = keyboard(37);
left_arrow.event.press = () => {
	left_arrow.func();
	left_arrow.pressed = true;
};
left_arrow.event.release = () => {left_arrow.pressed = false;};
left_arrow.func = function() {
	if (block_present) {
		moveShape(grid, -1, c_block_obj, "left");
	}
}

//right arrow
right_arrow.event = keyboard(39);
right_arrow.event.press = () => {
	right_arrow.func();
	right_arrow.pressed = true;
};
right_arrow.event.release = () => {right_arrow.pressed = false;};
right_arrow.func = function() {
	if (block_present) {
		moveShape(grid, -1, c_block_obj, "right");
	}
}

//up arrow
up_arrow.event = keyboard(38);
up_arrow.event.press = () => {
	up_arrow.func();
	up_arrow.pressed = true;
};
up_arrow.event.release = () => {up_arrow.pressed = false;};
up_arrow.func = function() {
	if (block_present) {
		rotateShape(grid, -1, c_block_obj, "anti-clockwise");
	}
}

//down arrow
down_arrow.event = keyboard(40);
down_arrow.event.press = () => {
	down_arrow.func();
	down_arrow.pressed = true;
};
down_arrow.event.release = () => {down_arrow.pressed = false;};
down_arrow.func = function() {
	if (block_present) {
		let moveable = moveShape(grid, -1, c_block_obj, "down");
		if (!moveable) {
			c_gravity_cooldown += gravity_cooldown / 4;
		}
	}
}




/* Functions */


//Generate grid initialized with objects
function generate2dGrid(width, height) {

	//Target array
	var arr = [];

	//Grid unit object
	function GridUnit() {this.id = 0;}

	//Generate x (column) first then y (row), so cells can be called by array[x][y]
	for (var x = 0; x < width; x++) {

		//Create an empty column
		arr.push([]);

		//Filling the column
		for (var y = 0; y < height; y++) {

			let obj = new GridUnit();

			//Generate sprite of cell by supplying their x and y coordinates
			//coordinate = row|column * cell length + offset
			obj.sprite = generateCell(
				x * (unit_length + (unit_margin * 2)) + (unit_margin + (unit_length/2)),
				-(y * (unit_length + (unit_margin * 2)) + (unit_margin + (unit_length/2))));
			grid_container.addChild(obj.sprite);
			obj.sprite.tint = c_empty;

			arr[x].push(obj);
		}
	}

	return arr;
}

//Creates the sprite for a unit cell
function generateCell(x, y) {

	//Start with a graphic object
	var obj = new PIXI.Graphics();

	//Define stroke width and colour
	obj.lineStyle(6, 0xFFFFFF, 1);
	//Draw rectangle border
	obj.drawRoundedRect(
		x,
		y,
		unit_length,
		unit_length,
		unit_round);
	
	obj.beginFill(0xFFFFFF, 1);
	obj.drawRoundedRect(
		x + unit_length/5,
		y + unit_length/5,
		3*unit_length/5,
		3*unit_length/5,
		unit_round);
	obj.endFill();


	//Use the current renderer to generate a texture from the graphic
	let texture = obj.generateCanvasTexture();
	//Use the texture to generate a sprite
	let sprite = new PIXI.Sprite(texture);

	//Define anchor point to be center
	sprite.anchor.set(0.5, 0.5);
	sprite.x = x;
	sprite.y = y;

	return sprite;
}

//Updates colour of a unit cell
function tintCell(array, x, y) {

	//Test if grid to be tinted is within grid boundaries. If not, return.
	if (x >= grid_width && x < 0 &&
		y >= grid_height && y < 0) {
		return;
	}

	//Paint cell
	switch(array[x][y].id) {

		//Falling block
		case -1:
			array[x][y].sprite.tint = c_filled;
			break;

		//Empty
		case 0:
			array[x][y].sprite.tint = c_empty;
			break;

		//Filled
		case 1:
			array[x][y].sprite.tint = c_filled;
			break;
	}
}

//Draw a shape onto the grid
function drawShape(array, id, shape) {

	//Get anchor coords
	var anchor = anchorCoordinates(shape);

	//Accessing the relative coordinates of each segment in the shape
	shape.schematic.forEach(
		function(coordinates) {

			//Get coordinates of segment relative to grid
			var seg = rotateCoordinates(shape, shape.c_rotation, coordinates, anchor);

			//Test if cell to be drawn is within grid boundaries
			if (seg.x < grid_width && seg.x >= 0 &&
				seg.y < grid_height && seg.y >= 0) {

				array[seg.x][seg.y].id = id;

				//Print shape
				tintCell(array, seg.x, seg.y);
			}
		}
	);
}

//Checks for positions during rotations and rotate if possible
function rotateShape(array, id, shape, direction) {

	//Saving original settings before rotating in case all rotates are invalid
	let ori_margin = shape.c_margin;
	let ori_rotation = shape.c_rotation;

	//Default rotation to valid
	var valid = true;

	//Erase shape first
	drawShape(array, 0, shape);

	//Going through various rotations
	for (var rot = 0; rot < 3; rot++) {

		//Add a rotation
		if (direction == "clockwise") {
			if (shape.c_rotation < 3) {
				shape.c_rotation++;
			} else {
				shape.c_rotation = 0;
			}
		} else {
			if (shape.c_rotation > 0) {
				shape.c_rotation--;
			} else {
				shape.c_rotation = 3;
			}
		}

		//Testing y-margin
		for (var mar_y = 0; mar_y <= shape.kick_margin; mar_y++) {
			
			//Testing x-margin
			for (var mar_x = 0; mar_x <= shape.kick_margin; ) {

				//Setting margins of the shape
				shape.c_margin.x = mar_x;
				shape.c_margin.y = mar_y;

				//Get anchor coords
				var anchor = anchorCoordinates(shape);

				//Default rotation to valid
				valid = true;

				//Accessing the relative coordinates of each segment in the shape
				for (var i = 0; i < shape.schematic.length; i++) {

					//Get coordinates of segment relative to grid
					var seg = rotateCoordinates(shape, shape.c_rotation, shape.schematic[i], anchor);

					//Test if cell to be drawn is within grid boundaries
					if (seg.x < grid_width && seg.x >= 0 &&
						seg.y < grid_height + grid_hidden && seg.y >= 0) {

						//Within boundary

						//Exclude id check on hidden grid
						if (seg.y < grid_height) {
							switch(array[seg.x][seg.y].id) {

								//If testing cell is occupied
								case 1:
									valid = false;
									break;
							}
						}

						if (!valid) break;
					} else {

						//Not within boundary
						valid = false;
						break;
					}
				}

				//If a rotation is possible
				if (valid) {
					break;
				}

				//Alternate margin x left and right
				if (mar_x <= 0) {
					//If it is 0 or negative, make it positive and add one
					mar_x = -mar_x + 1;
				} else {
					//If is positive, make it negative
					mar_x = -mar_x;
				}
			}

			//If a rotation is possible
			if (valid) {
				break;
			}
		}

		//If a rotation is possible
		if (valid) {
			break;
		}
	}

	//If a rotation is possible
	if (valid) {
		drawShape(array, id, shape);
	} else {
		shape.c_margin = ori_margin;
		shape.c_rotation = ori_rotation;

		//redraw shape
		drawShape(array, id, shape);
	}
}

//Checks for position during movement and moves if possible
function moveShape(array, id, shape, direction) {

	//Saving original settings before moving in case movement is invalid
	let ori_x = shape.x;
	let ori_y = shape.y;

	//Default movement to valid
	var valid = true;

	//Erase shape first
	drawShape(array, 0, shape);

	if (direction == "left") {
		shape.x--;
	} else if (direction == "right") {
		shape.x++;
	} else if (direction == "down") {
		shape.y--;
	}

	//Get anchor coords
	var anchor = anchorCoordinates(shape);

	//Accessing the relative coordinates of each segment in the shape
	for (var i = 0; i < shape.schematic.length; i++) {

		//Get coordinates of segment relative to grid
		var seg = rotateCoordinates(shape, shape.c_rotation, shape.schematic[i], anchor);


		//Test if cell to be drawn is within grid boundaries
		if (seg.x < grid_width && seg.x >= 0 &&
			seg.y < grid_height + grid_hidden && seg.y >= 0) {

			//Within boundary

			//Exclude id check on hidden grid
			if (seg.y < grid_height) {
				switch(array[seg.x][seg.y].id) {

					//If testing cell is occupied
					case 1:
						valid = false;
						break;
				}
			}
			
			if (!valid) break;
		} else {

			//Not within boundary
			valid = false;
			break;
		}
	}

	if (valid) {
		if (shape.x != ori_x) {
			shape.x += shape.c_margin.x;
			shape.c_margin.x = 0;
		} else {
			shape.y += shape.c_margin.y;
			shape.c_margin.y = 0;
		}
		
		drawShape(array, id, shape);
		return true;
	} else {
		shape.x = ori_x;
		shape.y = ori_y

		drawShape(array, id, shape);
		return false;
	}
}

//Calculate anchor coordinates
function anchorCoordinates(shape) {

	//Drawing anchor coordinates relative to grid
	let anchor = {x: shape.x + shape.c_margin.x, y: shape.y + shape.c_margin.y};

	//Check if anchor point relative to bounding box is in a cell or between
	if ((shape.bounding_size % 2) == 0) {
		//Anchor is between cell e.g. square shape
		anchor.x += -(shape.bounding_size / 2);
		anchor.y += -(shape.bounding_size / 2);
	} else {
		//Anchor is in a cell e.g. T-shape
		anchor.x += -((shape.bounding_size - 1) / 2) - 1;
		anchor.y += -((shape.bounding_size - 1) / 2) - 1;
	}

	return anchor;
}

//Rotate coordinates
function rotateCoordinates(shape, rotation, coordinates, anchor) {

	//Coordinates - default no rotation
	let segment = {x: anchor.x + coordinates.x, y: anchor.y + coordinates.y};

	//Rotate shape clockwise from default
	switch(rotation) {

		//90 deg
		case 1:
			segment.x = anchor.x + coordinates.y;
			segment.y = anchor.y + shape.bounding_size - 1 - coordinates.x;
			break;

		//180 deg
		case 2:
			segment.x = anchor.x + shape.bounding_size - 1 - coordinates.x;
			segment.y = anchor.y + shape.bounding_size - 1 - coordinates.y;
			break;

		//270 deg
		case 3:
			segment.x = anchor.x + shape.bounding_size - 1 - coordinates.y;
			segment.y = anchor.y + coordinates.x;
			break;
	}

	return segment;
}




/* Keystroke listener */


function keyboard(keyCode) {
	let key = {};
	key.code = keyCode;
	key.isDown = false;
	key.isUp = true;
	key.press = undefined;
	key.release = undefined;

	//The `downHandler`
	key.downHandler = event => {
	if (event.keyCode === key.code) {
			if (key.isUp && key.press) key.press();
			key.isDown = true;
			key.isUp = false;
		}
		event.preventDefault();
	};

	//The `upHandler`
	key.upHandler = event => {
		if (event.keyCode === key.code) {
			if (key.isDown && key.release) key.release();
			key.isDown = false;
			key.isUp = true;
		}
		event.preventDefault();
	};

	//Attach event listeners
	window.addEventListener(
		"keydown", key.downHandler.bind(key), false
		);
	window.addEventListener(
		"keyup", key.upHandler.bind(key), false
		);

	return key;
}