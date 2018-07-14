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
let app = new PIXI.Application({
	width: 2000,
	height: 2400,
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
let scale = scaleToWindow(app.view);




/* Constants */


//Debug mode
let DEBUG_MODE = true;

//Grid details
let main_grid = {
	width: 10,
	height: 20,
	hidden: 2	//Hidden extra grid at the top of the visible grid
};

let next_grid = {
	width: 4,
	height: 4,
	hidden: 0
}

//Size of each grid cell
let unit_length = 90;
let unit_margin = 10;
let unit_round = 10;
let unit_thicc = 12;

//Boundary padding
let boundary_padding = 20;
let boundary_thicc = 10
let boundary_round = 8;

//Grid colour
let c_filled = 0x000000;
let c_empty = 0x879571;
let c_background = 0x9aa680;

app.renderer.backgroundColor = c_background;

//Keyboard long-press time and repeat time (in seconds)
let keyboard_ini_p_t = 0.25;
let keyboard_rep_p_t = 0.06;

//Arbitrary constants
const SPAWN = 0;
const MOVE = 1;
const ROTATE = 2;
const CLOCKWISE = 0;
const ANTI_CLOCKWISE = 1;




/*Tetris brick objects*/
/*
*   A tetris brick object have 10 attributes:
	name                -       display name of the object
	c_rotation          -       current rotation of the object (or default rotation at definition)
	x                   -       in-game x position of the anchor
	y                   -       in-game y position of the anchor
								anchor is at the centre of the boundary box
	kick_margin         -       size of extra margin given to rotating shape
	last_move			-		last movement of the shape
	bounding_size       -       size of the square boundary of the pieces
	c_margin            -       current offset of shape from original position
	schematic           -       array of objects containing coordinates for the blocks in default rotation
								0 is the bottom-left box
								usually defined starting from the top of the shape, left to right
*/

//Array of all the shapes
let Shapes = [Shape_t, Shape_l, Shape_il, Shape_s, Shape_z, Shape_i, Shape_sq];

//T-shape
function Shape_t(x, y) {
	this.name = "T";
	this.c_rotation = 0;
	this.x = x;
	this.y = y;
	this.kick_margin = 1;
	this.bounding_size = 3;
	this.last_move = SPAWN;
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
	this.last_move = SPAWN;
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
	this.last_move = SPAWN;
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
	this.last_move = SPAWN;
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
	this.last_move = SPAWN;
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
	this.last_move = SPAWN;
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
	this.last_move = SPAWN;
	this.c_margin = {x: 0, y: 0};
	this.schematic = [
		{x: 0, y: 1},
		{x: 1, y: 1},
		{x: 0, y: 0},
		{x: 1, y: 0}
		];
}




/* Actual stuff working */


//Main grid container
main_grid.container = new PIXI.Container();
app.stage.addChild(main_grid.container);
main_grid.container.x = unit_length;
main_grid.container.y = app.renderer.height - 100;

//Main 2d array
main_grid.grid = generate2dGrid(main_grid);

//Main border
main_grid.boundary = new PIXI.Graphics();
//Define stroke width and colour
main_grid.boundary.lineStyle(boundary_thicc, c_filled, 1);
//Draw rectangle border
main_grid.boundary.drawRoundedRect(
	-boundary_padding,
	-boundary_padding,
	main_grid.width * (unit_length + 2*unit_margin) + 2*boundary_padding,
	main_grid.height * (unit_length + 2*unit_margin) + 2*boundary_padding,
	boundary_round);
//Move anchor point to bottom-left
main_grid.boundary.pivot.set(0, main_grid.height * (unit_length + 2*unit_margin));
main_grid.container.addChild(main_grid.boundary);


//Next up grid container
next_grid.container = new PIXI.Container();
app.stage.addChild(next_grid.container);
next_grid.container.x = app.renderer.width
	- main_grid.container.x
	- (next_grid.width * (unit_length + 2*unit_margin));
next_grid.container.y =
	(app.renderer.height - 100 - (main_grid.height * (unit_length + 2*unit_margin)))
	+ next_grid.height * (unit_length + 2*unit_margin);

next_grid.grid = generate2dGrid(next_grid);

next_grid.boundary = new PIXI.Graphics();
next_grid.boundary.lineStyle(boundary_thicc, c_filled, 1);
next_grid.boundary.drawRoundedRect(
	-boundary_padding,
	-boundary_padding,
	next_grid.width * (unit_length + 2*unit_margin) + 2*boundary_padding,
	next_grid.height * (unit_length + 2*unit_margin) + 2*boundary_padding,
	boundary_round);
next_grid.boundary.pivot.set(0, next_grid.height * (unit_length + 2*unit_margin));
next_grid.container.addChild(next_grid.boundary);



/* Update loop */


//KB Variables
let left_arrow = {pressed: false, press_duration: 0, ini_rep: true};
let right_arrow = {pressed: false, press_duration: 0, ini_rep: true};
let up_arrow = {pressed: false, press_duration: 0, ini_rep: true};
let down_arrow = {pressed: false, press_duration: 0, ini_rep: true};
let l_key = {pressed: false, press_duration: 0, ini_rep: true};

//Array of all keys
let keys = [left_arrow, right_arrow, up_arrow, down_arrow, l_key];

//player data
let highscores = [];			//array of high score objects incl name, score, time played
let stats = {
	score: 0,					//current score
	level: 1,					//current level
	base_level: 1,				//starting level
	total_lines: 0,				//total number of lines cleared the game
	consec_clears: 0,			//number of non-stop consecutive clears
	consec_tetris: 0,			//number of tetrises in a row
	consec_t_spin_mini: 0,		//number of t-spin mini clear in a row (no wall-kick)
	consec_t_spin_combo: 0		//number of t-spin clears in a row (wall-kick)
};

//Other variables
let elapsed_time = 0;			//elapsed time from start of game
let block_present = false;		//if there is a player-controlled tetromino in the game right now
let gravity = 1;				//number of gravity drops per second
let gravity_time = 1 / gravity;	//cooldown time for gravity to happen
let c_gravity_timer = 0;		//countdown timer for gravity to happen
let c_drop_timer = 0;			//countdown timer to next drop
let c_block_obj;				//current block object
let isSet = false;				//if tetromino is already at setting position
let c_set_timer = 0;			//set countdown timer
let set_time = 2; 				//time to set the block once at setting position
let next_shape = [];			//next coming shapes ids
let next_shape_generate = 4;	//how many previews to generate

let dt = 0;

//Generate next_shape ids
for (var n = 0; n < next_shape_generate; n++) {
	next_shape.push(Math.floor((Math.random() * Shapes.length) + 0));
}


//Set active shape
c_block_obj = new Shapes[next_shape[0]](Math.floor(main_grid.width/2), main_grid.height);
shiftPreview(next_shape, next_grid);

//Spawn shape into main_grid
drawShape(main_grid, -1, c_block_obj);
block_present = true;

//Define deltaTime ticker -- update function
app.ticker.add(function(deltaTime) {

	//dt change to per second
	dt = deltaTime / 60;
	elapsed_time += dt;
	if (isSet) {
		c_set_timer -= dt;
	} else {
		c_gravity_timer -= dt;
	}

	//Use timer for gravity, or if block is going to be set, use set timer
	c_drop_timer = isSet ? c_set_timer : c_gravity_timer;

	//Test for drop
	if (c_drop_timer <= 0) {

		let moved = moveShape(main_grid, -1, c_block_obj, "down");
		let moveable = testShape(main_grid, c_block_obj, "down"); //returns false if unable to drop further

		//If the shape moved
		if (moved) {
			//If it was in set mode
			if (isSet) {
				//Reset its status
				isSet = false;
			}

			//Reset gravity timer since block moved
			c_gravity_timer = c_drop_timer + gravity_time;
		}

		//Test if the shape can move down
		if (!moveable) {

			//If is in set mode
			if (isSet) {
				//reset set settings for new block
				isSet = false;

				//Set the shape (turn id to 1)
				drawShape(main_grid, 1, c_block_obj);

				//Clear lines
				clearLines(main_grid, c_block_obj, stats);

				//Set active shape
				c_block_obj = new Shapes[next_shape[0]](Math.floor(main_grid.width/2), main_grid.height);
				shiftPreview(next_shape, next_grid);

				//Spawn shape into main_grid
				drawShape(main_grid, -1, c_block_obj);
				block_present = true;

				//Reset gravity timer for new block
				c_gravity_timer = c_drop_timer + gravity_time;
			} else {
				//If not in set mode
				//enables the block to be set
				isSet = true;
				c_set_timer = c_drop_timer + set_time;	//reset set timer
			}
		} else {
			//If shape is moved out of the way or not at setting position
			if (isSet) {
				isSet = false;
			}
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
	//console.log(c_drop_timer);
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
		moveShape(main_grid, -1, c_block_obj, "left");

		let moveable = testShape(main_grid, c_block_obj, "down"); //returns false if unable to drop further
		if (moveable) {
			//Change to gravity timer
			isSet = false;
		} else {
			//Change to set timer
			isSet = true;
		}
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
		moveShape(main_grid, -1, c_block_obj, "right");

		let moveable = testShape(main_grid, c_block_obj, "down"); //returns false if unable to drop further
		if (moveable) {
			//Change to gravity timer
			isSet = false;
		} else {
			//Change to set timer
			isSet = true;
		}
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
		rotateShape(main_grid, -1, c_block_obj, CLOCKWISE);
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
		let moved = moveShape(main_grid, -1, c_block_obj, "down");
		let moveable = testShape(main_grid, c_block_obj, "down"); //will return false if unable to drop further

		//Test if shape managed to move
		if (moved) {
			//Reset movement cooldown
			c_gravity_timer = gravity_time;
		}

		//Test if the block cannot move anymore
		if (!moveable) {
			//If is in set mode
			if (isSet) {
				c_set_timer -= set_time / 4;
			} else {
				//If not in set mode
				//enables the block to be set
				isSet = true;
				c_set_timer = set_time;	//reset set timer
			}
		} else if (isSet) {	//if moveable and is in set mode
			isSet = false;
		}
	}
}

//l key for line cheat
l_key.event = keyboard(76);
l_key.event.press = () => {
	l_key.func();
	l_key.pressed = true;
};
l_key.event.release = () => {l_key.pressed = false;};
l_key.func = function() {
	if (DEBUG_MODE) {
		next_shape[0] = 5;
		console.log("Next shape set to I");
	}
}




/* Functions */


//Generate a grid initialized with objects
function generate2dGrid(grid) {

	//Target grid
	let arr = [];

	//Grid unit object
	function GridUnit() {this.id = 0;}

	//Generate x (column) first then y (row), so cells can be called by grid.grid[x][y]
	for (var x = 0; x < grid.width; x++) {

		//Create an empty column
		arr.push([]);

		//Filling the column
		for (var y = 0; y < grid.height + grid.hidden; y++) {

			let obj = new GridUnit();

			//Generate sprite of cell by supplying their x and y coordinates
			//coordinate = row|column * cell length + offset
			obj.sprite = generateCell(
				x * (unit_length + (unit_margin * 2)) + (unit_margin + (unit_length/2)),
				-(y * (unit_length + (unit_margin * 2)) + (unit_margin + (unit_length/2))));

			//only display the visible cells
			if (y < grid.height) {
				grid.container.addChild(obj.sprite);
				obj.sprite.tint = c_empty;
			}

			arr[x].push(obj);
		}
	}

	return arr;
}

//Creates the sprite for a unit cell
function generateCell(x, y) {

	//Start with a graphic object
	let obj = new PIXI.Graphics();

	//Define stroke width and colour
	obj.lineStyle(unit_thicc, 0xFFFFFF, 1);
	//Draw rectangle border
	obj.drawRoundedRect(
		x,
		y,
		unit_length,
		unit_length,
		unit_round);
	
	let inner_mar_ratio = 1;
	let inner_mar_size = 4;
	obj.beginFill(0xFFFFFF, 1);
	obj.drawRoundedRect(
		x + (inner_mar_ratio * unit_length) / inner_mar_size,
		y + (inner_mar_ratio * unit_length) / inner_mar_size,
		(inner_mar_size - (2*inner_mar_ratio)) * unit_length / inner_mar_size,
		(inner_mar_size - (2*inner_mar_ratio)) * unit_length / inner_mar_size,
		unit_round * (2 * inner_mar_ratio / inner_mar_size));
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
function tintCell(grid, x, y) {
	//If target cell is in hidden rows
	if (y >= grid.height) {return;}

	//Test if cell to be tinted is within grid boundaries. If not, return.
	if (x >= grid.width && x < 0 &&
		y >= grid.height && y < 0) {
		return;
	}

	//Paint cell
	switch(grid.grid[x][y].id) {

		//Falling block
		case -1:
			grid.grid[x][y].sprite.tint = c_filled;
			break;

		//Empty
		case 0:
			grid.grid[x][y].sprite.tint = c_empty;
			break;

		//Filled
		case 1:
			grid.grid[x][y].sprite.tint = c_filled;
			break;
	}
}

//Draw a shape onto the grid
function drawShape(grid, id, shape) {

	//Get anchor coords
	let anchor = anchorCoordinates(shape);

	//Accessing the relative coordinates of each segment in the shape
	shape.schematic.forEach(
		function(coordinates) {

			//Get coordinates of segment relative to grid
			let seg = rotateCoordinates(shape, shape.c_rotation, coordinates, anchor);

			//Test if cell to be drawn is within grid boundaries
			if (seg.x < grid.width && seg.x >= 0 &&
				seg.y < grid.height && seg.y >= 0) {

				grid.grid[seg.x][seg.y].id = id;

				//Print shape
				tintCell(grid, seg.x, seg.y);
			}
		}
	);
}

//Checks for positions during rotations and rotate if possible
function rotateShape(grid, id, shape, direction) {

	//Saving original settings before rotating in case all rotates are invalid
	const ori_margin = shape.c_margin;
	const ori_rotation = shape.c_rotation;

	//Default rotation to valid
	let valid = true;

	//Erase shape first
	drawShape(grid, 0, shape);

	//Going through various rotations
	for (var rot = 0; rot < 3; rot++) {

		//Add a rotation
		if (direction == CLOCKWISE) {
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
		for (var mar_y = 0; mar_y >= -shape.kick_margin; ) {
			
			//Testing x-margin
			for (var mar_x = 0; mar_x <= shape.kick_margin; ) {

				//Setting margins of the shape
				shape.c_margin.x = mar_x;
				shape.c_margin.y = mar_y;

				//Get anchor coords
				let anchor = anchorCoordinates(shape);

				//Default rotation to valid
				valid = true;

				//Accessing the relative coordinates of each segment in the shape
				for (var i = 0; i < shape.schematic.length; i++) {

					//Get coordinates of segment relative to grid
					let seg = rotateCoordinates(shape, shape.c_rotation, shape.schematic[i], anchor);

					//Test if cell to be drawn is within grid boundaries
					if (seg.x < grid.width && seg.x >= 0 &&
						seg.y < grid.height + grid.hidden && seg.y >= 0) {

						//Within boundary

						//Exclude id check on hidden grid
						if (seg.y < grid.height) {
							switch(grid.grid[seg.x][seg.y].id) {

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

			//Alternate margin y down and up (down first - essential for t-spins)
			if (mar_y < 0) {
				//If it is negative, make it positive
				mar_y = -mar_y;
			} else {
				//If is positive or zero, make it negative and minus one
				mar_y = -mar_y - 1;
			}
		}

		//If a rotation is possible
		if (valid) {
			break;
		}
	}

	//If a rotation is possible
	if (valid) {
		drawShape(grid, id, shape);

		shape.last_move = ROTATE;
	} else {
		shape.c_margin = ori_margin;
		shape.c_rotation = ori_rotation;

		//redraw shape
		drawShape(grid, id, shape);
	}
}

//Checks for position during movement and moves if possible
function moveShape(grid, id, shape, direction) {

	//Saving original settings before moving in case movement is invalid
	const ori_x = shape.x;
	const ori_y = shape.y;

	//Default movement to valid
	let valid = true;

	//Erase shape first
	drawShape(grid, 0, shape);

	if (direction == "left") {
		shape.x--;
	} else if (direction == "right") {
		shape.x++;
	} else if (direction == "down") {
		shape.y--;
	}

	//Get anchor coords
	let anchor = anchorCoordinates(shape);

	//Accessing the relative coordinates of each segment in the shape
	for (var i = 0; i < shape.schematic.length; i++) {

		//Get coordinates of segment relative to grid
		let seg = rotateCoordinates(shape, shape.c_rotation, shape.schematic[i], anchor);


		//Test if cell to be drawn is within grid boundaries
		if (seg.x < grid.width && seg.x >= 0 &&
			seg.y < grid.height + grid.hidden && seg.y >= 0) {

			//Within boundary

			//Exclude id check on hidden grid
			if (seg.y < grid.height) {
				switch(grid.grid[seg.x][seg.y].id) {

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
		
		drawShape(grid, id, shape);

		shape.last_move = MOVE;
		return true;
	} else {
		shape.x = ori_x;
		shape.y = ori_y

		drawShape(grid, id, shape);
		return false;
	}
}

//Test for position but does not move anything
function testShape(grid, shape, direction) {

	//Saving original settings before moving in case movement is invalid
	const ori_x = shape.x;
	const ori_y = shape.y;

	//Default movement to valid
	let valid = true;

	if (direction == "left") {
		shape.x--;
	} else if (direction == "right") {
		shape.x++;
	} else if (direction == "down") {
		shape.y--;
	}

	//Get anchor coords
	let anchor = anchorCoordinates(shape);

	//Accessing the relative coordinates of each segment in the shape
	for (var i = 0; i < shape.schematic.length; i++) {

		//Get coordinates of segment relative to grid
		let seg = rotateCoordinates(shape, shape.c_rotation, shape.schematic[i], anchor);


		//Test if cell to be drawn is within grid boundaries
		if (seg.x < grid.width && seg.x >= 0 &&
			seg.y < grid.height + grid.hidden && seg.y >= 0) {

			//Within boundary

			//Exclude id check on hidden grid
			if (seg.y < grid.height) {
				switch(grid.grid[seg.x][seg.y].id) {

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

	shape.x = ori_x;
	shape.y = ori_y;

	return valid;
}

//Calculate anchor coordinates - anchor is the shape's 0, 0 coordinate, relative to grid coordinates
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

//Check for lines to be cleared within specified rows
function clearLines(grid, shape, stats) {

	let anchor = anchorCoordinates(shape);

	let n_cleared = [];	//list of cleared lines in this clearing

	//let h start from the bottom possible point of a shape, then work upwards
	for (var h = anchor.y; h < anchor.y + shape.bounding_size && h < grid.height - 1; h++) {
		//skip check if row getting checked is not in grid
		if (h < 0) continue;

		let n_filled = 0;	//number of filled cells

		//go through each item in a row
		for (var x = 0; x < grid.width; x++) {
			//if it is occupied
			if (grid.grid[x][h].id == 1) {
				n_filled++;
			}
		}

		//if line is full
		if (n_filled == grid.width) {
			//go through each item in the row again
			for (var x = 0; x < grid.width; x++) {
				grid.grid[x][h].id = 0;		//marked empty
			}

			//mark line to be cleared
			n_cleared.push(h);
		}
	}

	gravitiseGrid(grid, n_cleared);

	calcScore(shape, n_cleared, stats);
}

//Gravitise grid - shifts grid values down
/*
	Array is shifted by these steps:
	1. Push id values into an array from top grid cell to lowest line cleared, excluding the lines cleared
	2. While pushing said values, set original id to empty cell value
	3. Start from the lowest line cleared, replace id values of grid cells according to the array previously obtained

*/
function gravitiseGrid(grid, lines) {
	//check if there are lines
	if (lines.length == 0) return;

	//sort the order of lines to be shifted in ascending order
	lines.sort();

	//Since the grid 2d grid goes by column then row, we need to access each individual column then shift them down
	for (var x = 0; x < grid.width; x++) {
		let n_lines = 0;	//number of cleared lines already passed through
		let n = 0;			//current number of line shifts
		let n_proc = 0;		//current number of lines processed
		let arr = [];		//temp array

		//Start from top of grid
		for (var y = grid.height - 1; y >= lines[0]; y--) {
			//If is not empty row
			if (y != lines[lines.length - 1 - n_lines]) {
				//put cell id into temp array
				arr.push(grid.grid[x][y].id);

				//reset cell id
				grid.grid[x][y].id = 0;
			} else {
				//Is empty row
				n_lines++;
			}

			//Set cell value down
			if (n >= lines.length) {
				grid.grid[x][y].id = arr[n_proc];
				n_proc++;
			} else {
				n++;
			}

			tintCell(grid, x, y);
		}
	}

}

//Calculates and updates score
function calcScore(shape, lines, stats) {
	//If nothing is cleared
	if (lines.length == 0) {
		stats.consec_clears = 0;
		return;
	}

	//score obtained
	let score = 0;

	//First, check for t-spins
	if (shape.name == "T") {
		//Check for any t-spin (rotation)
		if (shape.last_move == ROTATE) {
			//Check for mini t-spin (no wall-kick)
			if (shape.c_margin.x == 0 && shape.c_margin.y == 0) {
				score += (100 + (stats.consec_t_spin_mini * 30) + (200 * (lines.length - 1))) * stats.level;
				stats.consec_t_spin_mini++;
				stats.consec_t_spin_combo = 0;
			} else {
				//Wall kick - proper t-spin
				switch(lines.length) {
					//single
					case 1:
						console.log("t-spin single");
						score += (800 + (300 * stats.consec_t_spin_combo)) * stats.level;
						break;

					//double
					case 2:
						console.log("t-spin double");
						score += (1200 + (400 * stats.consec_t_spin_combo)) * stats.level;
						break;

					//triple
					case 3:
						console.log("t-spin triple");
						score += (1600 + (500 * stats.consec_t_spin_combo)) * stats.level;
						break;
				}

				stats.consec_t_spin_combo++;
				stats.consec_t_spin_mini = 0;
			}

			//Reset tetris combo count
			stats.consec_tetris = 0;
		}
	} else if (shape.name == "I") {
		//Check for tetrises
		if (lines.length >= 4) {

			score += (800 + (300 * stats.consec_tetris)) * stats.level;

			stats.consec_tetris++;

			//Reset t-spin combo count
			stats.consec_t_spin_mini = 0;
			stats.consec_t_spin_combo = 0;
		}
	}

	if (score <= 0) {
		//If any of the above condition is not fulfilled, fall back to standard scoring

		score += (100 + (200 * (lines.length - 1))) * stats.level;

		//Reset special combo counts
		stats.consec_tetris = 0;
		stats.consec_t_spin_mini = 0;
		stats.consec_t_spin_combo = 0;
	}

	//Add combo counts
	if (lines.length == 1) {
		//Single clear combo gives less points
		score += (20 * stats.consec_clears) * stats.level
	} else {
		score += (50 * stats.consec_clears) * stats.level
	}

	//Add to score
	stats.score += score;

	console.log(stats.score + " | " + score);

	//Add to total lines cleared
	stats.total_lines += lines.length;
	stats.consec_clears++;
}

//Shift preview ids and shape
function shiftPreview(array, grid_next) {
	console.log(grid_next.grid);
	drawShape(grid_next, 0, new Shapes[array[0]](Math.ceil(grid_next.width / 2), Math.floor(grid_next.height / 2)));

	array.shift();
	array.push(Math.floor((Math.random() * Shapes.length) + 0));

	drawShape(grid_next, 1, new Shapes[array[0]](Math.ceil(grid_next.width / 2), Math.floor(grid_next.height / 2)));

	return array;
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
		//event.preventDefault();
	};

	//The `upHandler`
	key.upHandler = event => {
		if (event.keyCode === key.code) {
			if (key.isDown && key.release) key.release();
			key.isDown = false;
			key.isUp = true;
		}
		//event.preventDefault();
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
