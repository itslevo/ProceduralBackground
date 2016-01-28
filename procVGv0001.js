function ProceduralBackground(user_settings){
  "use strict";

  var internal_settings = {
    canvas : document.createElement("canvas")
  },

  _settings = {
    cell_width      : 1,
    cell_height     : 1,
    cell_gap        : 0,
    variance        : 5,
    fill_percentage : 20,
    parent          : document.body,
    canvas          : document.createElement("canvas"),

    canvas_styling : {
      "position" : "fixed",
      "top"      : 0,
      "bottom"   : 0,
      "right"    : 0,
      "left"     : 0,
      "width"    : "99%",
      "height"   : "99%",
      "border-width"   : "1px",
      "border-style"   : "solid",
      "border-color"   : "yellow red yellow red"
    },
    background_grid: false
  },

  render_queue = [];

  // for (var setting in _settings){
  //   if (typeof user_settings[setting] !== "undefined")
  //     _settings[setting] = user_settings[setting];
  // }

  function bootStrap(settings){
    var canvas = settings.canvas,
        styles = settings.canvas_styling;

    for (var setting in styles) {
      canvas.style[setting] = styles[setting];
    }

    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    settings.parent.appendChild(canvas);

    settings.grid_width = Math.floor(canvas.width / settings.cell_width + settings.cell_gap),
    settings.grid_height = Math.floor(canvas.height / settings.cell_height + settings.cell_gap);


    //generateMainBackground(settings);
    // generate grid based on window size, cell size and "grain"
    // run algo
    // output to canvas
    // attach resize events/ any other events
  };


  /* Generate initial representation of our grid */
  function generateGrid(height, width){
    var grid = [],
        x_pointer = 0,
        y_pointer = 0;

    grid.length = height * width;

    for (var i = 0; i < grid.length; i++) {
      if (i > 0 && i % width === 0){
        y_pointer++;
        x_pointer = 0;
      }
      //console.log(i+ ": " + x_pointer + " " + y_pointer);
       grid[i] = {x: x_pointer, y: y_pointer, colour: null};
       x_pointer++;
    };

    return grid;
  }

  /* Get coordinates and rgb of random seed to use as starting point */
  function getSeed(grid_height, grid_width){
    var x = Math.floor(Math.random() * grid_width),
        y = Math.floor(Math.random() * grid_height),
        r = Math.floor(Math.random() * 256),
        g = Math.floor(Math.random() * 256),
        b = Math.floor(Math.random() * 256),
        rgb_string = 'rgb('+ r +','+ g +','+ b +')';

    console.log("Seeded at x: "+ x + " y: " + y, " with colour " + rgb_string);
    return {x: x, y: y, rgb: rgb_string};
  }


  /* Insert cell into specified grid */
  function createCell(grid, grid_height, grid_width, x, y, rgb){
    grid[y * grid_width + x] = {x: x, y: y, colour: rgb};

    return grid;
  }


  /* Get cell at specified coords */
  function getCell(grid, grid_height, x, y){
    var cell = {x: Infinity, y: Infinity, colour: null}, // default cell is "out of bounds"
        grid_width = grid.length / grid_height;

    if ((x > 0 && x < grid_width) &&
        (y > 0 && y < grid_height) &&
         grid[y * grid_width + x]){
      cell = grid[y * grid_width + x];
    }

    return cell;
  }


  /* Create list of  cells adjacent to coords (horizontally and diagonally)*/
  function getListOfAdjacentCells(grid, grid_height, x, y){

    var initial_list = [
      getCell(grid, grid_height, x + 1, y),
      getCell(grid, grid_height, x + 1, y + 1),
      getCell(grid, grid_height, x, y + 1),
      getCell(grid, grid_height, x - 1, y),
      getCell(grid, grid_height, x - 1, y - 1),
      getCell(grid, grid_height, x, y - 1),
      getCell(grid, grid_height, x - 1, y + 1),
      getCell(grid, grid_height, x + 1, y - 1),    
    ],
    filtered_list = [],
    grid_width = grid.length / grid_height;

    for (var i = 0; i < initial_list.length; i++) {
      var cell_x = initial_list[i].x,
          cell_y = initial_list[i].y;

      if (cell_x !== Infinity && cell_y !== Infinity && initial_list[i].colour === null)
        filtered_list[filtered_list.length++] = initial_list[i];
    };

    return filtered_list;
  }


  function isInList(cell, list){
    for (var i = 0; i < list.length; i++) {
      if(list[i].x === cell.x && list[i].y === cell.y)
        return true;
    };

    return false;
  }


  /* Algorithm to find list of all cells that are at the bounds of the currently generated shape */
  function getListOfBoundingCells(grid, grid_height, lowest_index_cell_x, highest_index_cell_x, lowest_index_cell_y, highest_index_cell_y){
    lowest_index_cell_y = lowest_index_cell_y - 1 < 0 ? 0 : lowest_index_cell_y - 1;
    lowest_index_cell_x = lowest_index_cell_x - 1 < 0 ? 0 : lowest_index_cell_x - 1;
    highest_index_cell_y = highest_index_cell_y + 1 > grid_height ? grid_height : highest_index_cell_y + 1;
    highest_index_cell_x = highest_index_cell_x + 1 > (grid.length / grid_height) ? (grid.length / grid_height) : highest_index_cell_x + 1;

    var list = [],
        gappy_algorithm = false,
        grid_width = grid.length / grid_height,
        initial_index = lowest_index_cell_y * grid_width + lowest_index_cell_x,
        final_index = highest_index_cell_y * grid_width + highest_index_cell_x;

    var y_pointer = lowest_index_cell_y,
        x_pointer = lowest_index_cell_x,
        prev_index_x,
        next_index_x,
        prev_index_y,
        next_index_y;



    for (var i = initial_index; i <= final_index; i++){
      /* Horizontal sweep */
        //var x_smallest = Infinity, x_largest = -Infinity;
        if (i > 0 && i % grid_width === 0){
          y_pointer++;
          x_pointer = 0;
        }

          // if (cell.colour !== null){
          //  if (cell.x < x_smallest){
          //    x_smallest = cell.x;
          //  }

          //  if (cell.x > x_largest){
          //    x_largest = cell.x;
          //  }
          // }

        if (grid[i].colour === null){
          prev_index_x = y_pointer * grid_width + (x_pointer > 0 ? grid_width : x_pointer - 1);
          next_index_x = y_pointer * grid_width + (x_pointer < grid_width ? x_pointer + 1 : 0);
          prev_index_y = (y_pointer > 0 ? y_pointer - 1 : 0) * grid_width + x_pointer;
          next_index_y = (y_pointer < grid_height - 1 ? y_pointer + 1 : grid_height) * grid_width + x_pointer;

          if (grid[prev_index_x] && grid[prev_index_x].colour !== null && !isInList(grid[prev_index_x], list))
            list[list.length++] = grid[prev_index_x];

          if (grid[next_index_x] && grid[next_index_x].colour !== null && !isInList(grid[next_index_x], list))
            list[list.length++] = grid[next_index_x];

          if (grid[prev_index_y] && grid[prev_index_y].colour !== null && !isInList(grid[prev_index_y], list))
            list[list.length++] = grid[prev_index_y];

          if (grid[next_index_y] && grid[next_index_y].colour !== null && !isInList(grid[next_index_y], list))
            list[list.length++] = grid[next_index_y];
        }

        x_pointer++;
        // if (Math.abs(x_smallest) !== Infinity && Math.abs(x_largest) !== Infinity){
        //   if (x_smallest === x_largest){
        //    list[list.length++] = grid[y][x_smallest];
        //   } else {
        //    list[list.length++] = grid[y][x_smallest];
        //    list[list.length++] = grid[y][x_largest];
        //   }
        // }
    }
    // for (var x = 0; x < grid[0].length; x++) {
    //   /* Vertical sweep */
    //     var y_smallest = Infinity, y_largest = -Infinity;

    //   for (var y = 0; y < grid.length; y++) {
    //     var cell = grid[y][x];

    //     if (cell.colour !== null){
    //        if (cell.y < y_smallest){
    //          y_smallest = cell.y;
    //        }

    //        if (cell.y > y_largest){
    //          y_largest = cell.y;
    //        }
    //     }


    //     // if (cell.colour === null){
    //     //   if (grid[y - 1] && grid[y - 1][x].colour !== null && !isInList(grid[y - 1][x], list))
    //     //     list.push(grid[y - 1][x]);

    //     //   if (grid[y + 1] && grid[y + 1][x].colour !== null && !isInList(grid[y + 1][x], list))
    //     //     list.push(grid[y + 1][x]);
    //     // }
    //   };
    //     if (Math.abs(y_smallest) !== Infinity && Math.abs(y_largest) !== Infinity){
    //       if (y_smallest === y_largest){
    //         list[list.length++] = grid[y_smallest][x];
    //       } else {
    //        list[list.length++] = grid[y_smallest][x];
    //        list[list.length++] = grid[y_largest][x];
    //       }
    //     }
    
    return list;
  }

  /* render the background grid */
  function renderBg(grid, grid_height, ctx, settings){
    var cell_width = settings.cell_width,
        cell_height = settings.cell_height,
        grid_width = grid.length / grid_height,
        x_pointer = 0,
        y_pointer = 0;

    ctx.strokeStyle = "gray";
    ctx.lineWidth = 0.3;

    for (var i = 0; i < grid.length; i++){
        if (i > 0 && i % grid_width === 0){
          y_pointer++;
          x_pointer = 0;
        }

        ctx.strokeRect(x_pointer * cell_width, y_pointer * cell_height, cell_width, cell_height);
        x_pointer++; 
    }
  }

  /* Render the main grid data */
  function render(grid, grid_height, ctx, settings){
    var cell_width = settings.cell_width,
        cell_height = settings.cell_height,
        gap = settings.cell_gap,
        default_colour = settings.default_colour || "rgba(0,0,0,0)",
        circle = false,
        grid_width = grid.length / grid_height,
        x_pointer = 0,
        y_pointer = 0;

    ctx.clearRect(0,0, grid.length * cell_height, grid.length * cell_height + cell_height);

    for (var i = 0; i < grid.length; i++){
        if (i > 0 && i % grid_width === 0){
          y_pointer++;
          x_pointer = 0;
        }
        var cell = getCell(grid, grid_height, x_pointer, y_pointer);

        // if (cell.colour){
        //   console.log(x_pointer + " " + y_pointer);
        //   console.log(cell);
        // }
 
        ctx.fillStyle = cell.colour || default_colour;
        //console.log(x_pointer * cell_width + " " + y_pointer * cell_height);

        ctx.fillRect(cell.x * cell_width, (grid_height * cell_height - cell.y * cell_height), cell_width, cell_height);


        //console.log(getCell(grid, grid_height, x_pointer, y_pointer));
        // if (circle){
        //   ctx.strokeStyle = ctx.fillStyle;
        //   ctx.lineWidth = 0.1;
        //   ctx.beginPath();
        //   ctx.arc(x * cell_width + (cell_width / 2), y * cell_width + (cell_width / 2), cell_width / 2, 0, 2 * Math.PI);
        //   ctx.stroke();
        //   ctx.fill();
        // }

        // if (cell.bounding){
        //   ctx.strokeStyle = "blue";
        //   ctx.lineWidth = 2;
        //   ctx.strokeRect(cell.x * cell_width + (ctx.lineWidth / 2), (grid_height * cell_height - cell.y * cell_height) + (ctx.lineWidth / 2), cell_width, cell_height);
        // }
        if (cell.adjacent){
         ctx.strokeStyle = "red";
         ctx.lineWidth = 2;
         ctx.strokeRect(cell.x * cell_width + (ctx.lineWidth / 2), (grid_height * cell_height - cell.y * cell_height) + (ctx.lineWidth / 2), cell_width, cell_height);
        }
        x_pointer++;
    }

    if (settings.background_grid)
      renderBg(grid, grid_height, ctx, settings);

  }

  /* get average colour with slight variance shift for all listed colours */
  function getAvgColour(base_cell, cell_list, settings){
    var colour = "",
      reds = 0,
      greens = 0, 
      blues = 0,
      total = 0,
      variance = settings.variance;

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

  function generateMainBackground(settings){
    var generation_cycle = 0,
        generation_cycle_MAX = Math.floor(settings.grid_height * settings.grid_width / 100) * settings.fill_percentage,

        _STORE = {
          bounding_cells          : [],
          empty_cell_not_found    : true,
          empty_cell_search_cycle : 0,
          new_colour              : "",
          random_adjacent         : "",
          base_cell               : "",
          adjacent_cells          : "",
          copy                    : {},
          lowest_index_cell_x     : Infinity,
          highest_index_cell_x    : -Infinity,
          lowest_index_cell_y     : Infinity,
          highest_index_cell_y    : -Infinity
        },

        MAIN_GRID = generateGrid(settings.grid_height, settings.grid_width),
        context =  settings.canvas.getContext('2d'),
        seed = getSeed(settings.grid_height, settings.grid_width);

    MAIN_GRID = createCell(MAIN_GRID, settings.grid_height, settings.grid_width, seed.x, seed.y, seed.rgb);

    var seed_cell = getCell(MAIN_GRID, settings.grid_height, seed.x, seed.y);

    _STORE.lowest_index_cell_x = seed_cell.x;
    _STORE.highest_index_cell_x = seed_cell.x;
    _STORE.lowest_index_cell_y = seed_cell.y;
    _STORE.highest_index_cell_y = seed_cell.y;
    //render_queue.push(MAIN_GRID);
    //renderBg(MAIN_GRID, bg);
    console.log(settings);
    console.log(generation_cycle_MAX);
    while (generation_cycle < generation_cycle_MAX){
      _STORE.bounding_cells = getListOfBoundingCells(
        MAIN_GRID,
        settings.grid_height,
        _STORE.lowest_index_cell_x,
        _STORE.highest_index_cell_x,
        _STORE.lowest_index_cell_y,
        _STORE.highest_index_cell_y
        );

      _STORE.empty_cell_not_found = true;
      _STORE.empty_cell_search_cycle = 0;
      _STORE.new_colour = "";
      _STORE.random_adjacent;
      _STORE.base_cell;
      _STORE.adjacent_cells;

      if (_STORE.bounding_cells.length === 0){
        _STORE.empty_cell_not_found = false;
        generation_cycle = generation_cycle_MAX;
        continue;
      }

      while (_STORE.empty_cell_not_found && _STORE.empty_cell_search_cycle < 100) {
        _STORE.base_cell = _STORE.bounding_cells[Math.floor(Math.random() * _STORE.bounding_cells.length)],
        _STORE.adjacent_cells = getListOfAdjacentCells(MAIN_GRID, settings.grid_height, _STORE.base_cell.x, _STORE.base_cell.y);
        // console.log(_STORE.base_cell);
        // console.log(_STORE.adjacent_cells);
        if (_STORE.adjacent_cells.length > 0){
          _STORE.random_adjacent = _STORE.adjacent_cells[Math.floor(Math.random() * _STORE.adjacent_cells.length)];
          _STORE.new_colour = getAvgColour(_STORE.base_cell, _STORE.adjacent_cells, settings);

          if(_STORE.random_adjacent.colour === null)
            _STORE.empty_cell_not_found = false;
        }

        _STORE.empty_cell_search_cycle++;
        if (_STORE.empty_cell_search_cycle ===  100){
          generation_cycle = generation_cycle_MAX;
        }
      };
      //put some shit with highest/lowest indices to date here
      MAIN_GRID = createCell(MAIN_GRID, settings.grid_height, settings.grid_width, _STORE.random_adjacent.x, _STORE.random_adjacent.y, _STORE.new_colour);

      if (_STORE.random_adjacent.x < _STORE.lowest_index_cell_x)
        _STORE.lowest_index_cell_x = _STORE.random_adjacent.x;

      if (_STORE.random_adjacent.y < _STORE.lowest_index_cell_y)
        _STORE.lowest_index_cell_y = _STORE.random_adjacent.y;

      if (_STORE.random_adjacent.x > _STORE.highest_index_cell_x)
        _STORE.highest_index_cell_x = _STORE.random_adjacent.x;

      if (_STORE.random_adjacent.y > _STORE.highest_index_cell_y)
        _STORE.highest_index_cell_y = _STORE.random_adjacent.y;
      // for (var i = 0; i < _STORE.bounding_cells.length; i++) {
      //   _STORE.bounding_cells[i].bounding = true;
      // };

      // for (var i = 0; i < _STORE.adjacent_cells.length; i++) {
      //   _STORE.adjacent_cells[i].adjacent = true;
      // }; 

      // _STORE.copy = JSON.parse(JSON.stringify(MAIN_GRID));
      // render_queue.push(_STORE.copy);

      // // for (var i = 0; i < _STORE.bounding_cells.length; i++) {
      // //   _STORE.bounding_cells[i].bounding = false;
      // // };
      // for (var i = 0; i < _STORE.adjacent_cells.length; i++) {
      //   _STORE.adjacent_cells[i].adjacent = false;
      // };

      generation_cycle++;
    }

    render(MAIN_GRID, settings.grid_height, context, settings);

    // var frame = 0;

    // var renderFrame = function renderFrame(){
    //     // do some stuff
    //     if (frame === render_queue.length)
    //       return;

    //        //console.log("rendering frame " + frame);
    //   render(render_queue[frame], settings.grid_height, context, settings);
    //   frame = frame + 1;
    //     setTimeout(renderFrame, 10);
    // };

    // renderFrame();
  }


  return {
    generate: function(){
      bootStrap(_settings);
    },

    render: function(){
      generateMainBackground(_settings);
    },

    renderFrames: function(){

    },

    destroy: function(){

    }
  }
}