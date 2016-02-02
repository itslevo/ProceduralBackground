function ProceduralBackground(user_settings){
  "use strict";

  var internal_settings = {
    canvas : document.createElement("canvas")
  },

  _settings = {
    cell_width      : 5,
    cell_height     : 5,
    cell_gap        : 0,
    variance        : 4,
    fill_percentage : 100,
    seed            : {x: 15, y: 10, r: 255, g: 255, b: 255},
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

    settings.grid_width = Math.floor(canvas.width / (settings.cell_width + settings.cell_gap)),
    settings.grid_height = Math.floor(canvas.height / (settings.cell_height + settings.cell_gap));


    generateMainBackground(settings);

    //Todo: attach resize events/ any other events
  };


  /* Generate initial representation of our grid */
  function generateGrid(height, width){
    var size = height * width,
        grid_object = {
          height: height,
          width : width,
          state : new Array(size),
          r     : new Uint8ClampedArray(size),
          g     : new Uint8ClampedArray(size),
          b     : new Uint8ClampedArray(size),
          a     : new Int8Array(size)
        };

    for (var i = 0; i < size; i++) {
      grid_object.state[i] = 0;
    };

    return grid_object;
  }

  /* Get coordinates and rgb of random seed to use as starting point */
  function getSeed(grid_height, grid_width){
    var x = Math.floor(Math.random() * grid_width),
        y = Math.floor(Math.random() * grid_height),
        r = Math.floor(Math.random() * 256),
        g = Math.floor(Math.random() * 256),
        b = Math.floor(Math.random() * 256);

    console.log("Seeded : ");
    console.log({x: x,
            y: y,
            r: r,
            g: g,
            b: b});
    return {x: x,
            y: y,
            r: r,
            g: g,
            b: b};
  }


  /* Insert cell into specified grid */
  function createCell(grid_object, x, y, r, g, b){
    var index = getCellIndex(x, y, grid_object.width, grid_object.height);

    grid_object.state[index] = 1;
    grid_object.r[index] = r;
    grid_object.g[index] = g;
    grid_object.b[index] = b;
    grid_object.a[index] = 100;

    return grid_object;
  }


  function getCellXY(grid_object, index){
    var modulo = index % grid_object.width;
    return {
      x : index < grid_object.width ? index : modulo,
      y : index < grid_object.width ? 0 : (index - modulo) / grid_object.width,
    }
  }


  function getCellIndex(x, y, grid_width, grid_height){
    if ((x < 0 || x >= grid_width) || (y < 0 || y >= grid_height))
      return Infinity;
    else
      return y * grid_width + x;
  }


  /* Create list of  cells adjacent to coords (horizontally and diagonally)*/
  function getListOfAdjacentIndices(grid_object, x, y, return_non_empty){

    var initial_list = [
      getCellIndex(x + 1, y,     grid_object.width, grid_object.height),
      getCellIndex(x + 1, y + 1, grid_object.width, grid_object.height),
      getCellIndex(x,     y + 1, grid_object.width, grid_object.height),
      getCellIndex(x - 1, y,     grid_object.width, grid_object.height),
      getCellIndex(x - 1, y - 1, grid_object.width, grid_object.height),
      getCellIndex(x,     y - 1, grid_object.width, grid_object.heighth),
      getCellIndex(x - 1, y + 1, grid_object.width, grid_object.height),
      getCellIndex(x + 1, y - 1, grid_object.width, grid_object.height),    
    ],
    filtered_list = [],
    index = 0,
    comparison = ~~return_non_empty,
    i = 0;

    for (i; i < initial_list.length; i++) {
      index = initial_list[i];

      if (index !== Infinity && grid_object.state[index] === comparison)
        filtered_list[filtered_list.length++] = initial_list[i];
    };

    return filtered_list;
  }


  /* Algorithm to find list of all cells that are at the bounds of the currently generated shape */
  function getListOfBoundingCells(grid_object, old_bounding_cell_indices, last_added_xy, last_added_index){
    var width = grid_object.width,
        state = grid_object.state,
        curr_index,
        cell_x,
        cell_y,
        modulo,
        no_longer_bounding_index,
        i;

    var all_adjacent_indices = [
      getCellIndex(last_added_xy.x + 1, last_added_xy.y,     grid_object.width, grid_object.height),
      getCellIndex(last_added_xy.x,     last_added_xy.y + 1, grid_object.width, grid_object.height),
      getCellIndex(last_added_xy.x - 1, last_added_xy.y,     grid_object.width, grid_object.height),
      getCellIndex(last_added_xy.x,     last_added_xy.y - 1, grid_object.width, grid_object.heighth)   
    ];

    all_adjacent_indices[++all_adjacent_indices.length] = last_added_index;

    for (i = 0; i < all_adjacent_indices.length; i++) {
      curr_index = all_adjacent_indices[i];

      if (state[curr_index] !== 1){
        continue;
      }

      modulo = curr_index % width;
      cell_x = curr_index < width ? curr_index : modulo;
      cell_y = curr_index < width ? 0 : (curr_index - modulo) / width;

      if (state[cell_y * width + cell_x - 1] === 0){ // previous x index
        continue;
      }

      if (state[cell_y * width + cell_x + 1] === 0){ // next x index
        continue;
      }

      if (state[(cell_y - 1) * width + cell_x] === 0){ // previous y index
        continue;
      }

      if (state[(cell_y + 1) * width + cell_x] === 0){ // next y index
        continue;
      }

      no_longer_bounding_index = old_bounding_cell_indices.indexOf(curr_index);
      if (no_longer_bounding_index >= 0){
        old_bounding_cell_indices.splice(no_longer_bounding_index, 1);
      }
    };

    return old_bounding_cell_indices;
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
  function render(grid_object, ctx, settings){
    var cell_width = settings.cell_width,
        cell_height = settings.cell_height,
        gap = settings.cell_gap,
        default_colour = settings.default_colour || "rgba(0,0,0,0)",
        circle = false,
        grid_size = grid_object.height * grid_object.width,
        grid_width = grid_object.width,
        x_pointer = 0,
        y_pointer = 0;

    ctx.clearRect(0,0, 10000, 10000);

    for (var i = 0; i < grid_size; i++){
        if (i > 0 && i % grid_width === 0){
          y_pointer++;
          x_pointer = 0;
        }
        // if (cell.colour){
        //   console.log(x_pointer + " " + y_pointer);
        //   console.log(cell);
        // }
 
        ctx.fillStyle = grid_object.state[i] === 1 ? "rgba("+ grid_object.r[i] +","+ grid_object.g[i] +","+ grid_object.b[i] +","+ grid_object.a[i] +")" : default_colour;

        //if (Math.random() <= 0.5){
          ctx.fillRect(x_pointer * (cell_width + gap), y_pointer * (cell_height + gap)/*(grid_height * (cell_height + gap)) - ((cell.y + gap) * cell_height)*/, cell_width, cell_height);
        // }else{
        //   ctx.beginPath();
        //   ctx.moveTo(x_pointer * (cell_width + gap), y_pointer * (cell_height + gap));
        //   ctx.lineTo(x_pointer * (cell_width + gap), y_pointer * (cell_height + gap) - cell_height);
        //   ctx.lineTo(x_pointer * (cell_width + gap) + cell_width, y_pointer * (cell_height + gap))
        //   ctx.fill();
        // }
        //console.log(getCell(grid, grid_height, x_pointer, y_pointer));
        // if (circle){
          // ctx.strokeStyle = ctx.fillStyle;
          // ctx.lineWidth = 0.1;
          // ctx.beginPath();
          // ctx.arc(cell.x * (cell_width + (cell_width / 2) + gap), cell.y * (cell_height + (cell_height / 2) + gap), cell_width / 2, 0, 2 * Math.PI);
          // ctx.stroke();
          // ctx.fill();
        // }

        // if (grid_object.bounding_cell_indices && grid_object.bounding_cell_indices.indexOf(i) !== -1){
        //   ctx.strokeStyle = "blue";
        //   ctx.lineWidth = 2;
        //   ctx.strokeRect(x_pointer * cell_width + (ctx.lineWidth / 2), y_pointer * (cell_height + gap) + (ctx.lineWidth / 2), cell_width, cell_height);
        // }
        // if (cell.adjacent){
        //  ctx.strokeStyle = "red";
        //  ctx.lineWidth = 2;
        //  ctx.strokeRect(cell.x * cell_width + (ctx.lineWidth / 2), (grid_height * cell_height - cell.y * cell_height) + (ctx.lineWidth / 2), cell_width, cell_height);
        // }
        x_pointer++;
    }

    if (settings.background_grid)
      renderBg(grid, grid_height, ctx, settings);

  }

  /* get average colour with slight variance shift for all listed colours */
  function getAvgColour(base_cell_index, adjacent_cell_indices, grid_object, settings){
    var colour = "",
      reds = 0,
      greens = 0, 
      blues = 0,
      total = 0,
      variance = settings.variance;

    adjacent_cell_indices.push(base_cell_index);

    for (var i = 0; i < adjacent_cell_indices.length; i++) {
      if (grid_object.state[adjacent_cell_indices[i]] === 1){
        reds   += grid_object.r[adjacent_cell_indices[i]];
        greens += grid_object.g[adjacent_cell_indices[i]];
        blues  += grid_object.b[adjacent_cell_indices[i]];
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

    return {r: r, g: g, b: b};
  }

  function generateMainBackground(settings){
    var generation_cycle = 0,
        generation_cycle_MAX = Math.floor(settings.grid_height * settings.grid_width / 100) * settings.fill_percentage,

        _STORE = {
          bounding_cell_indices   : [],
          empty_cell_not_found    : true,
          empty_cell_search_cycle : 0,
          new_colour              : {},
          random_adjacent_index   : Infinity,
          random_adjacent_xy      : {},
          base_cell_index         : Infinity,
          base_cell_xy            : {},
          adjacent_cell_indices   : [],
          copy                    : {}
        },
        render_queue = [],

        MAIN_GRID_OBJECT = generateGrid(settings.grid_height, settings.grid_width),
        context =  settings.canvas.getContext('2d');


    var seed = settings.seed || getSeed(settings.grid_height, settings.grid_width);
    MAIN_GRID_OBJECT = createCell(MAIN_GRID_OBJECT, seed.x, seed.y, seed.r, seed.g, seed.b);
    _STORE.bounding_cell_indices[0] = getCellIndex(seed.x, seed.y, settings.grid_width, settings.grid_height);
    _STORE.random_adjacent_index = getCellIndex(seed.x, seed.y, settings.grid_width, settings.grid_height); // BAD
    _STORE.random_adjacent_xy = {x: seed.x, y: seed.y};

    console.log(settings);
    console.log(generation_cycle_MAX);
    while (generation_cycle < generation_cycle_MAX){
      _STORE.bounding_cell_indices = getListOfBoundingCells(MAIN_GRID_OBJECT, _STORE.bounding_cell_indices, _STORE.random_adjacent_xy, _STORE.random_adjacent_index);
      _STORE.empty_cell_not_found = true;
      _STORE.empty_cell_search_cycle = 0;
      _STORE.new_colour = {r: 0, g: 0, b: 0, a: 100};
      _STORE.random_adjacent_index;
      _STORE.base_cell;
      _STORE.base_cell_xy;
      _STORE.adjacent_cell_indices;

      if (_STORE.bounding_cell_indices.length === 0){
        _STORE.empty_cell_not_found = false;
        generation_cycle = generation_cycle_MAX;
        continue;
      }

      while (_STORE.empty_cell_not_found && _STORE.empty_cell_search_cycle < 100) {
        _STORE.base_cell_index = _STORE.bounding_cell_indices[Math.floor(Math.random() * _STORE.bounding_cell_indices.length)],
        _STORE.base_cell_xy = getCellXY(MAIN_GRID_OBJECT, _STORE.base_cell_index);
        _STORE.adjacent_cell_indices = getListOfAdjacentIndices(MAIN_GRID_OBJECT, _STORE.base_cell_xy.x, _STORE.base_cell_xy.y, false);

        if (_STORE.adjacent_cell_indices.length > 0){
          _STORE.random_adjacent_index = _STORE.adjacent_cell_indices[Math.floor(Math.random() * _STORE.adjacent_cell_indices.length)];
          _STORE.random_adjacent_xy = getCellXY(MAIN_GRID_OBJECT, _STORE.random_adjacent_index);
          _STORE.new_colour = getAvgColour(_STORE.base_cell_index, _STORE.adjacent_cell_indices, MAIN_GRID_OBJECT, settings);

          if(MAIN_GRID_OBJECT.state[_STORE.random_adjacent_index] === 0)
            _STORE.empty_cell_not_found = false;
        }

        _STORE.empty_cell_search_cycle++;
        if (_STORE.empty_cell_search_cycle ===  1000){
          generation_cycle = generation_cycle_MAX;
        }
      };

      MAIN_GRID_OBJECT = createCell(MAIN_GRID_OBJECT, _STORE.random_adjacent_xy.x, _STORE.random_adjacent_xy.y, _STORE.new_colour.r, _STORE.new_colour.g, _STORE.new_colour.b);
      _STORE.bounding_cell_indices[_STORE.bounding_cell_indices.length++] = getCellIndex(_STORE.random_adjacent_xy.x, _STORE.random_adjacent_xy.y, settings.grid_width, settings.grid_height);

     // MAIN_GRID_OBJECT.bounding_cell_indices = _STORE.bounding_cell_indices;

      // _STORE.copy = JSON.parse(JSON.stringify(MAIN_GRID_OBJECT));
      // render_queue.push(_STORE.copy);

      // // for (var i = 0; i < _STORE.bounding_cell_indices.length; i++) {
      // //   _STORE.bounding_cell_indices[i].bounding = false;
      // // };
      // for (var i = 0; i < _STORE.adjacent_cell_indices.length; i++) {
      //   _STORE.adjacent_cell_indices[i].adjacent = false;
      // };

      generation_cycle++;
    }

    render(MAIN_GRID_OBJECT, context, settings);

    // var frame = 0;

    // var renderFrame = function renderFrame(){
    //     // do some stuff
    //     if (frame === render_queue.length)
    //       return;

    //        //console.log("rendering frame " + frame);
    //   render(render_queue[frame], context, settings);
    //   frame = frame + 1;
    //     setTimeout(renderFrame, 16);
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