/* Generate initial grid */
function generateGrid(l, w){
	var grid = [];

	for (var i = 0; i < l; i++) {
		grid[i] = [];
		for (var ii = 0; ii < w; ii++) {
			grid[i][ii] = {x: ii, y: i, colour: null};
		};
	};

	return grid;
}

/* Get coordinates and rgb of random seed */
function getSeed(grid){
	var length = grid.length,
		width = grid[0].length;

	var x = Math.floor(Math.random() * width),
		y =	Math.floor(Math.random() * length),
		r = Math.floor(Math.random() * 256),
		g = Math.floor(Math.random() * 256),
		b = Math.floor(Math.random() * 256),
		rgb_string = 'rgb('+ r +','+ g +','+ b +')';

	console.log("Seeded at x: "+ x + " y: " + y, " with colour " + rgb_string);
	return {x: x, y: y, rgb: rgb_string};
}


/* Insert cell into specified grid */
function createCell(grid, x, y, rgb){
	grid[y][x] = {x: x, y: y, colour: rgb};

	return grid;
}


/* Get cell at specified coords */
function getCell(grid, x, y){
	var cell = {x: Infinity, y: Infinity, colour: null}; // default cell is "out of bounds"

	if (grid[y] && grid[y][x])
		cell = grid[y][x];

	return cell;
}


/* Create list of  cells adjacent to coords */
function getListOfAdjacentCells(grid, x, y){
	var initial_list = [
		getCell(grid, x + 1, y),
		getCell(grid, x + 1, y + 1),
		getCell(grid, x, y + 1),
		getCell(grid, x - 1, y),
		getCell(grid, x - 1, y - 1),
		getCell(grid, x, y - 1),
		getCell(grid, x - 1, y + 1),
		getCell(grid, x + 1, y - 1),		
	],
		filtered_list = [];

	for (var i = 0; i < initial_list.length; i++) {
		var x = initial_list[i].x,
			y = initial_list[i].y;

		if (x <= grid[0].length && y <= grid.length && initial_list[i].colour === null)
			filtered_list.push(initial_list[i]);
	};

	return filtered_list;
}


function isInList(cell, list){
	for (var i = 0; i < list.length; i++) {
		if(list[i] && list[i].x === cell.x && list[i].y === cell.y)
			return true;
	};

	return false;
}


/* Algorithm to find list of all cells that are at the bounds of the currently generated shape */
function getListOfBoundingCells(grid){
	var list = [],
		gappy_algorithm = false;

	for (var y=0; y < grid.length; y++){
		/* Horizontal sweep */
	  	var x_smallest = Infinity, x_largest = -Infinity;

	    for (var x=0; x < grid[0].length; x++){
	    	var cell = grid[y][x];


	    	// if (cell.colour !== null){
		    // 	if (cell.x < x_smallest){
		    // 		x_smallest = cell.x;
		    // 	}

		    // 	if (cell.x > x_largest){
		    // 		x_largest = cell.x;
		    // 	}
	    	// }

	    	if (cell.colour === null){
	    		if (grid[y][x - 1] && grid[y][x - 1].colour !== null && !isInList(grid[y][x - 1], list))
	    			list.push(grid[y][x - 1]);

	    		if (grid[y][x + 1] && grid[y][x + 1].colour !== null && !isInList(grid[y][x + 1], list))
	    			list.push(grid[y][x + 1]);
	    	}
	    }
	    // if (Math.abs(x_smallest) !== Infinity && Math.abs(x_largest) !== Infinity){
		   //  if (x_smallest === x_largest){
		   //  	list.push(grid[y][x_smallest]);
		   //  } else {
		   //  	list.push(grid[y][x_smallest]);
		   //  	list.push(grid[y][x_largest]);
		   //  }
	    // }
	}

	for (var x = 0; x < grid[0].length; x++) {
		/* Vertical sweep */
	  	var y_smallest = Infinity, y_largest = -Infinity;

		for (var y = 0; y < grid.length; y++) {
			var cell = grid[y][x];

			// if (cell.colour !== null){
		 //    	if (cell.y < y_smallest){
		 //    		y_smallest = cell.y;
		 //    	}

		 //    	if (cell.y > y_largest){
		 //    		y_largest = cell.y;
		 //    	}
			// }


	    	if (cell.colour === null){
	    		if (grid[y - 1] && grid[y - 1][x].colour !== null && !isInList(grid[y - 1][x], list))
	    			list.push(grid[y - 1][x]);

	    		if (grid[y + 1] && grid[y + 1][x].colour !== null && !isInList(grid[y + 1][x], list))
	    			list.push(grid[y + 1][x]);
	    	}
		};
	    // if (Math.abs(y_smallest) !== Infinity && Math.abs(y_largest) !== Infinity){
		   //  if (y_smallest === y_largest){
		   //  	list.push(grid[y_smallest][x]);
		   //  } else {
		   //  	list.push(grid[y_smallest][x]);
		   //  	list.push(grid[y_largest][x]);
		   //  }
	    // }
	};
	
	return list;
}

/* render the background grid */
function renderBg(grid, ctx){
  var cell_width = 20,
  	  cell_height = 20;
  ctx.strokeStyle = "gray";
  ctx.lineWidth = 0.3;

  for (var y = 0; y < grid.length; y++){
    for (var x = 0; x < grid[0].length; x++){
      ctx.strokeRect(x * cell_width, (grid.length * cell_height - y * cell_height), cell_width, cell_height);
    }
  }
}

/* Render the main grid data */
function render(grid, ctx){
  var cell_width = 20,
  	  cell_height = 20,
  	  circle = false;

  ctx.clearRect(0,0, grid.length * cell_height, grid.length * cell_height + cell_height);

  for (var y = 0; y < grid.length; y++){
    for (var x = 0; x < grid[0].length; x++){
      ctx.fillStyle = getCell(grid, x, y).colour || "rgba(0,0,0,.1)";
      ctx.fillRect(x * cell_width, (grid.length * cell_height - y * cell_height), cell_width, cell_height);

      if (circle){
      	  ctx.strokeStyle = ctx.fillStyle;
      	  ctx.lineWidth = 0.1;
	      ctx.beginPath();
		  ctx.arc(x * cell_width + (cell_width / 2), y * cell_width + (cell_width / 2), cell_width / 2, 0, 2 * Math.PI);
		  ctx.stroke();
		  ctx.fill();
      }

      if (getCell(grid, x, y).bounding){
      	ctx.strokeStyle = "blue";
      	ctx.lineWidth = 2;
      	ctx.strokeRect(x * cell_width + (ctx.lineWidth / 2), (grid.length * cell_height - y * cell_height) + (ctx.lineWidth / 2), cell_width, cell_height);
      }
      // if (getCell(grid, x, y).adjacent){
      // 	ctx.strokeStyle = "red";
      // 	ctx.lineWidth = 2;
      // 	ctx.strokeRect(x * cell_width + (ctx.lineWidth / 2), (grid.length * cell_height - y * cell_height) + (ctx.lineWidth / 2), cell_width, cell_height);
      // }
    }
  }
}

/* get average colour with slight variance shift for all listed colours */
function getAvgColour(base_cell, cell_list){
	var colour = "",
		reds = 0,
		greens = 0, 
		blues = 0,
		total = 0,
		variance = 20;

	cell_list.push(base_cell);

	for (var i = 0; i < cell_list.length; i++) {
		if (cell_list[i].colour){
			var colour_rgb = cell_list[i].colour.substring(4, cell_list[i].colour.length - 1).split(",");
			reds += parseInt(colour_rgb[0]);
			greens += parseInt(colour_rgb[1]);
			blues += parseInt(colour_rgb[2]);
			total++;
		}
	};

	var r_avg = Math.floor(reds / total),
		g_avg = Math.floor(greens / total),
		b_avg = Math.floor(blues / total);

	var r_rand = Math.random() <= 0.5 ? -variance : variance,
		g_rand = Math.random() <= 0.5 ? -variance : variance,
		b_rand = Math.random() <= 0.5 ? -variance : variance;

	var r = r_avg, g = g_avg, b = b_avg;

	if (r_avg + r_rand > 0){
		r = r_avg + r_rand > 256 ? 256 : r_avg + r_rand;
	}

	if (g_avg + g_rand > 0){
		g = g_avg + g_rand > 256 ? 256 : g_avg + g_rand;
	}

	if (b_avg + b_rand > 0){
		b = b_avg + b_rand > 256 ? 256 : b_avg + b_rand;
	}

	colour = 'rgb('+ r +','+ g +','+ b +')';

	return colour;
}


var length = 25,
	width = 25,
	rendering_cycle = 0;
	rendering_cycle_MAX = 1000,
	render_queue = [],
	new_grid = generateGrid(length, width),
	bg = document.getElementById('canvasBG').getContext('2d');
	context =  document.getElementById('canvas').getContext('2d');

var seed = getSeed(new_grid);
new_grid = createCell(new_grid, seed.x, seed.y, seed.rgb);

renderBg(new_grid, bg);
render(new_grid, context);

/* ============================== Main loop ==============================  */
while (rendering_cycle < rendering_cycle_MAX){
	var bounding_cells = getListOfBoundingCells(new_grid),
		empty_cell_not_found = true,
		i = 0,
		new_colour = "",
		random_adjacent,
		base_cell,
		adjacent_cells;

	if (bounding_cells.length === 0){
		empty_cell_not_found = false;
		rendering_cycle = rendering_cycle_MAX;
		continue;
	}

	while (empty_cell_not_found && i < 50) {
		base_cell = bounding_cells[Math.floor(Math.random() * bounding_cells.length)],
		adjacent_cells = getListOfAdjacentCells(new_grid, base_cell.x, base_cell.y);

		if (adjacent_cells.length > 0){
			random_adjacent = adjacent_cells[Math.floor(Math.random() * adjacent_cells.length)];
			new_colour = getAvgColour(base_cell, adjacent_cells);
			if(random_adjacent.colour === null)
				empty_cell_not_found = false;
		}
		i++;
		if (i ===  100){
			rendering_cycle = rendering_cycle_MAX;
		}
	};

	new_grid = createCell(new_grid, random_adjacent.x, random_adjacent.y, new_colour);

	for (var i = 0; i < bounding_cells.length; i++) {
		bounding_cells[i].bounding = true;
	};

	for (var i = 0; i < adjacent_cells.length; i++) {
		adjacent_cells[i].adjacent = true;
	};

	var copy = JSON.parse(JSON.stringify(new_grid));
	render_queue.push(copy);

	for (var i = 0; i < bounding_cells.length; i++) {
		bounding_cells[i].bounding = false;
	};
	for (var i = 0; i < adjacent_cells.length; i++) {
		adjacent_cells[i].adjacent = false;
	};

	rendering_cycle++;
}

var frame = 0, paused = false;

document.getElementById("pause").addEventListener("click", function( event ) {
	paused = !paused;

	if (paused === false)
		renderFrame();
}, false);

document.getElementById("grid").addEventListener("click", function( event ) {
	document.getElementById('canvasBG').style.visibility = "hidden";
}, false);

var renderFrame = function renderFrame(){
    // do some stuff
    if (frame === render_queue.length)
    	return;

    if (paused === true)
    	return;
       //console.log("rendering frame " + frame);
	render(render_queue[frame], context);
	frame = frame + 1;
    setTimeout(renderFrame, 10);
};

renderFrame();


