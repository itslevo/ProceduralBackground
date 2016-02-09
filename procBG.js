function ProceduralBackground(user_settings){
  "use strict";

  var Main = {
    _settings: {
      cell_width       : 5,
      cell_height      : 5,
      cell_gap         : 0,
      variance         : 10,
      variance_fulcrum : 0.5,
      fill_percentage  : 50,
      base_alpha       : 100,
      algo             : "branch", //"branch"/"diffuse"
      render_method    : "square",
      parent           : document.body,

      canvas_styling : {
        "position" : "fixed",
        "top"      : 0,
        "bottom"   : 0,
        "right"    : 0,
        "left"     : 0,
        "width"    : "99.5%",
        "height"   : "99.5%",
        "border-width"   : "1px",
        "border-style"   : "solid",
        "border-color"   : "yellow red yellow red"
      },
      background_grid: false
    },

    importSettings: function importSettings(external_settings){
      external_settings = external_settings || {};
      var _settings = this._settings;
      for (var setting in _settings){
        if (typeof external_settings[setting] !== "undefined")
          _settings[setting] = external_settings[setting];
      }

      return _settings;
    },

    createNewCanvasEl: function createNewCanvasEl(settings){
      var canvas = document.createElement("canvas"),
          styles = settings.canvas_styling,
          parent = settings.parent;

      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;

      for (var setting in styles) {
        canvas.style[setting] = styles[setting];
      }

      if (parent && parent instanceof HTMLElement) {
        parent.appendChild(canvas);
      } else {
        throw "Error: incorrect parent element specified for canvas to be appended to";
      }

      settings.canvas = canvas;

      return canvas;
    },

    bootstrap : function bootstrap(settings){
      var canvas = settings.canvas || this.createNewCanvasEl(settings);

      settings.grid_width = Math.floor(canvas.width / (settings.cell_width + settings.cell_gap) + 1),
      settings.grid_height = Math.floor(canvas.height / (settings.cell_height + settings.cell_gap) + 1);

      //Todo: attach resize events/ any other events
    }
  };

  var Generator = {
  /* Get coordinates and rgb of random seed to use as starting point */
    getSeed: function getSeed(grid_height, grid_width){
      var seed = {
        x: Math.floor(Math.random() * grid_width),
        y: Math.floor(Math.random() * grid_height),
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256)
      };

      console.log("Seeded : ");
      console.log(seed);
      return seed;
    },


    /* Insert cell into specified grid */
    createCell: function createCell(grid_object, x, y, r, g, b, settings){
      var index = this.getCellIndex(x, y, grid_object.width, grid_object.height);

      grid_object.state[index] = 1;
      grid_object.r[index] = r || 0;
      grid_object.g[index] = g || 0;
      grid_object.b[index] = b || 0;
      grid_object.a[index] = settings.base_alpha || 100;

      return grid_object;
    },


    getCellXY: function getCellXY(grid_object, index){
      var modulo = index % grid_object.width;
      return {
        x : index < grid_object.width ? index : modulo,
        y : index < grid_object.width ? 0 : (index - modulo) / grid_object.width,
      }
    },


    getCellIndex: function getCellIndex(x, y, grid_width, grid_height){
      if ((x < 0 || x >= grid_width) || (y < 0 || y >= grid_height))
        return Infinity;
      else
        return y * grid_width + x;
    },


    /* Create list of  cells adjacent to coords (horizontally and diagonally)*/
    getListOfAdjacentIndices: function getListOfAdjacentIndices(grid_object, x, y, return_filled){

      var initial_list = new Array(8);

      initial_list[0] = this.getCellIndex(x + 1, y,     grid_object.width, grid_object.height);
      initial_list[1] = this.getCellIndex(x + 1, y + 1, grid_object.width, grid_object.height);
      initial_list[2] = this.getCellIndex(x,     y + 1, grid_object.width, grid_object.height);
      initial_list[3] = this.getCellIndex(x - 1, y,     grid_object.width, grid_object.height);
      initial_list[4] = this.getCellIndex(x - 1, y - 1, grid_object.width, grid_object.height);
      initial_list[5] = this.getCellIndex(x,     y - 1, grid_object.width, grid_object.heighth);
      initial_list[6] = this.getCellIndex(x - 1, y + 1, grid_object.width, grid_object.height);
      initial_list[7] = this.getCellIndex(x + 1, y - 1, grid_object.width, grid_object.height);

      var filtered_list = new Array(initial_list.length),
      index = 0,
      comparison = ~~return_filled,
      cutoff = 0,
      i = 0;

      for (i; i < initial_list.length; i++) {
        index = initial_list[i];

        if (index !== Infinity && grid_object.state[index] === comparison)
          filtered_list[cutoff++] = initial_list[i];
      };

      return filtered_list.slice(0, cutoff);
    },

    /* Algorithm to find list of all cells that are at the bounds of the currently generated shape */
    getListOfBoundingCells: function getListOfBoundingCells(grid_object, old_bounding_cell_indices, last_added_xy, last_added_index){

      var width = grid_object.width,
          state = grid_object.state,
          curr_index,
          cell_x,
          cell_y,
          modulo,
          no_longer_bounding_index,
          i,
          all_adjacent_indices = Array(5);
          i;

      var all_adjacent_indices = [
        this.getCellIndex(last_added_xy.x + 1, last_added_xy.y,     grid_object.width, grid_object.height),
        this.getCellIndex(last_added_xy.x,     last_added_xy.y + 1, grid_object.width, grid_object.height),
        this.getCellIndex(last_added_xy.x - 1, last_added_xy.y,     grid_object.width, grid_object.height),
        this.getCellIndex(last_added_xy.x,     last_added_xy.y - 1, grid_object.width, grid_object.heighth),
        last_added_index
      ];

      // all_adjacent_indices[0] = getCellIndex(last_added_xy.x + 1, last_added_xy.y,     grid_object.width, grid_object.height);
      // all_adjacent_indices[1] = getCellIndex(last_added_xy.x,     last_added_xy.y + 1, grid_object.width, grid_object.height);
      // all_adjacent_indices[2] = getCellIndex(last_added_xy.x - 1, last_added_xy.y,     grid_object.width, grid_object.height);
      // all_adjacent_indices[3] = getCellIndex(last_added_xy.x,     last_added_xy.y - 1, grid_object.width, grid_object.heighth);
      // all_adjacent_indices[4] = last_added_index;

      for (i = 0; i < all_adjacent_indices.length; i++) {
        curr_index = all_adjacent_indices[i];

        if (state[curr_index] !== 1){
          continue;
        }

        modulo = curr_index % width;
        cell_x = curr_index < width ? curr_index : modulo;
        cell_y = curr_index < width ? 0 : (curr_index - modulo) / width;

        if (cell_x - 1 >= 0 && state[cell_y * width + cell_x - 1] === 0){ // previous x index
          continue;
        }

        if (cell_x + 1 < width && state[cell_y * width + cell_x + 1] === 0){ // next x index
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
    },


    /* get average colour with slight variance shift for all listed colours */
    getAvgColour: function getAvgColour(base_cell_index, adjacent_cell_indices, grid_object, settings){
      var colour = "",
        reds = 0,
        greens = 0, 
        blues = 0,
        total = 0,
        variance = settings.variance,
        fulcrum_point = settings.variance_fulcrum;

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

      var r_rand = Math.random() <= fulcrum_point ? -variance : variance,
          g_rand = Math.random() <= fulcrum_point ? -variance : variance,
          b_rand = Math.random() <= fulcrum_point ? -variance : variance;

      var r = r_avg, g = g_avg, b = b_avg;

      if (r_avg + r_rand > 0){
        r = r_avg + r_rand > 255 ? 255 : r_avg + r_rand;
      }

      if (g_avg + g_rand > 0){
        g = g_avg + g_rand > 255 ? 255 : g_avg + g_rand;
      }

      if (b_avg + b_rand > 0){
        b = b_avg + b_rand > 255 ? 255 : b_avg + b_rand;
      }

      return {r: r, g: g, b: b};
    },

    /* Generate initial representation of our grid */
    generateSkeletonGrid: function generateSkeletonGrid(height, width){
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
    },

    generateMainBackgroundGrid: function generateMainBackgroundGrid(settings){
      var startTime = new Date().getTime();

      var generation_cycles = 0,
          generation_cycles_MAX = Math.floor(settings.grid_height * settings.grid_width / 100 * settings.fill_percentage) - 1,

          _STORE = {
            bounding_cell_indices      : [],
            empty_cell_not_found       : true,
            empty_cell_search_cycles   : 0,
            next_generated_cell_colour : {},
            next_generated_cell_index  : Infinity,
            next_generated_cell_xy     : {},
            base_cell_index            : Infinity,
            base_cell_xy               : {},
            adjacent_cell_indices      : [],
            copy                       : {}
          },
          render_queue = [],

          MAIN_GRID_OBJECT = this.generateSkeletonGrid(settings.grid_height, settings.grid_width);


      var seed = settings.seed || this.getSeed(settings.grid_height, settings.grid_width);
      MAIN_GRID_OBJECT = this.createCell(MAIN_GRID_OBJECT, seed.x, seed.y, seed.r, seed.g, seed.b, settings);
      _STORE.bounding_cell_indices[0] = this.getCellIndex(seed.x, seed.y, settings.grid_width, settings.grid_height);
      _STORE.next_generated_cell_index = this.getCellIndex(seed.x, seed.y, settings.grid_width, settings.grid_height); // BAD
      _STORE.next_generated_cell_xy = {x: seed.x, y: seed.y};

      console.log(settings);
      console.log("Generation cycles: " + generation_cycles_MAX);
      while (generation_cycles < generation_cycles_MAX){
        // Find list of all cells forming the outline of the ccurrent shape
        _STORE.bounding_cell_indices =  this.getListOfBoundingCells(MAIN_GRID_OBJECT, _STORE.bounding_cell_indices, _STORE.next_generated_cell_xy, _STORE.next_generated_cell_index);
        _STORE.empty_cell_not_found = true;
        _STORE.empty_cell_search_cycles = 0;
        _STORE.next_generated_cell_colour = {r: 0, g: 0 , b: 0, a: 100};
        _STORE.next_generated_cell_index;
        _STORE.base_cell_index;
        _STORE.base_cell_xy;
        _STORE.adjacent_cell_indices;  

        if (_STORE.bounding_cell_indices.length === 0){
          // If no more bounding cells left (i.e. we've reached the edges of the screen), terminate loop
          _STORE.empty_cell_not_found = false;
          generation_cycles = generation_cycles_MAX;
          continue;
        }
   
        while (_STORE.empty_cell_not_found && _STORE.empty_cell_search_cycles< 100) {
          // Find random cell from overall list of bounding cells. This will be a jumping off point for the creation of our next cell
          _STORE.base_cell_index = _STORE.bounding_cell_indices[Math.floor(Math.random() * _STORE.bounding_cell_indices.length)],
          _STORE.base_cell_xy = this.getCellXY(MAIN_GRID_OBJECT, _STORE.base_cell_index);

          // Find all empty cells that are in a 3x3 grid around our base cell
          _STORE.adjacent_cell_indices = this.getListOfAdjacentIndices(MAIN_GRID_OBJECT, _STORE.base_cell_xy.x, _STORE.base_cell_xy.y, false);    

          if (_STORE.adjacent_cell_indices.length > 0){
            // If there is at least one empty cell adjacent to our base cell, select one from the list
            _STORE.next_generated_cell_index = _STORE.adjacent_cell_indices[Math.floor(Math.random() * _STORE.adjacent_cell_indices.length)];
            _STORE.next_generated_cell_xy = this.getCellXY(MAIN_GRID_OBJECT, _STORE.next_generated_cell_index);

            if (settings.algo === "branch"){
              // Next colour is generated based on a single coloured cell -- the base cell
              _STORE.next_generated_cell_colour = this.getAvgColour(_STORE.base_cell_index, [], MAIN_GRID_OBJECT, settings);
            } else if (settings.algo === "diffuse") {
              // New colour is generated based on an averaged colour of list of other adjacent non-empty cells
              _STORE.next_generated_cell_colour = this.getAvgColour(_STORE.base_cell_index, getListOfAdjacentIndices(MAIN_GRID_OBJECT, _STORE.base_cell_xy.x, _STORE.base_cell_xy.y, true), MAIN_GRID_OBJECT, settings);
            }
            

            if(MAIN_GRID_OBJECT.state[_STORE.next_generated_cell_index] === 0)
              _STORE.empty_cell_not_found = false;
          }
    
          _STORE.empty_cell_search_cycles++; 
          if (_STORE.empty_cell_search_cycles ===  1000){
            // Failsafe: if we're hitting too many search cycles that don't return a viable random base cell, exit
            generation_cycles = generation_cycles_MAX;
          }
        };   

        MAIN_GRID_OBJECT = this.createCell(MAIN_GRID_OBJECT, _STORE.next_generated_cell_xy.x, _STORE.next_generated_cell_xy.y, _STORE.next_generated_cell_colour.r, _STORE.next_generated_cell_colour.g, _STORE.next_generated_cell_colour.b, settings);
        _STORE.bounding_cell_indices[_STORE.bounding_cell_indices.length++] = this.getCellIndex(_STORE.next_generated_cell_xy.x, _STORE.next_generated_cell_xy.y, settings.grid_width, settings.grid_height);

       // MAIN_GRID_OBJECT.bounding_cell_indices = _STORE.bounding_cell_indices;

        // _STORE.copy = JSON.parse(JSON.stringify(MAIN_GRID_OBJECT));
        // render_queue.push(_STORE.copy);

        // // for (var i = 0; i < _STORE.bounding_cell_indices.length; i++) {
        // //   _STORE.bounding_cell_indices[i].bounding = false;
        // // };
        // for (var i = 0; i < _STORE.adjacent_cell_indices.length; i++) {
        //   _STORE.adjacent_cell_indices[i].adjacent = false;
        // };

        generation_cycles++;
      }

      console.log("Generation elapsed time: " + (new Date().getTime() - startTime) + "ms");

      return MAIN_GRID_OBJECT;

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
  };

  var Renderer = {
    renderEmptyCell: function renderEmptyCell(x, y, width, height, ctx){
      ctx.strokeStyle = "gray";
      ctx.lineWidth = 0.3;
      ctx.strokeRect(x, y, width, height);
    },

    renderCircle: function renderCircle(x, y, width, height, ctx){
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 0.1;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + (height / 2), width / 2, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fill();
    },

    renderTriangle: function renderTriangle(x, y, width, height, ctx){
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x + width, y);
      ctx.fill();
    },

    renderCell: function renderCell(x, y, width, height, ctx){
      ctx.fillRect(x, y, width, height);
    },

    renderTriangleSquare: function renderTriangleSquare(x, y, width, height, ctx){
      var rand = Math.random();

      if (rand <= 0.7){
        var pos = Math.random();

        if (pos < 0.25)
          renderTriangle(x, y, width, height, ctx);
        else if (pos < 0.5)
          renderTriangle(x + width, y + height, -width, -height, ctx);
        else if (pos < 0.75)
          renderTriangle(x, y + height, -width, height, ctx);
        else if (pos < 1)
          renderTriangle(x + width, y, width, -height, ctx);
      } else {
        renderCell(x, y, width, height, ctx);
      }
    },

    /* Render the main grid data */
    render: function render(grid_object, settings){
      var cell_width = settings.cell_width,
          cell_height = settings.cell_height,
          gap = settings.cell_gap,
          ctx = settings.canvas.getContext("2d"),
          default_colour = settings.default_colour || "rgba(0,0,0,0)",
          grid_size = grid_object.height * grid_object.width,
          grid_width = grid_object.width,
          render_method = settings.render_method,
          background_grid_method = settings.background_grid ? this.renderEmptyCell : function(){},
          x_pointer = 0,
          y_pointer = 0;

      if (typeof render_method === "string"){
        switch (render_method){
          case "square":
            render_method = this.renderCell;
            break;
          case "circle":
            render_method = this.renderCircle;
            break;
          case "triangle":
            render_method = this.renderTriangle;
            break;
          case "triangle + square":
            render_method = this.renderTriangleSquare;
            break;
          default:
            render_method = this.renderCell;
            break;
        }
      }

      ctx.clearRect(0,0, grid_width * (cell_width + gap), grid_object.height * (cell_height + gap));

      for (var i = 0; i < grid_size; i++){
          if (i > 0 && i % grid_width === 0){
            y_pointer++;
            x_pointer = 0;
          }
          
          if (grid_object.state[i] === 1) {
            ctx.fillStyle = "rgba("+ grid_object.r[i] +","+ grid_object.g[i] +","+ grid_object.b[i] +","+ grid_object.a[i] +")";
            render_method(x_pointer * (cell_width + gap), y_pointer * (cell_height + gap), cell_width, cell_height, ctx);
          } else {
            ctx.fillStyle = default_colour;
            this.renderCell(x_pointer * (cell_width + gap), y_pointer * (cell_height + gap), cell_width, cell_height, ctx);
          }

          background_grid_method(x_pointer * (cell_width + gap), y_pointer * (cell_height + gap), cell_width, cell_height, ctx);

          x_pointer++;
      }

    }
  };


  return {
    init: function(settings){
      Main.bootstrap(Main.importSettings(settings));
    },

    render: function(){
      var gridObj = Generator.generateMainBackgroundGrid(Main._settings);
      Renderer.render(gridObj, Main._settings);
    },

    importSettings: function(settings){
      return JSON.parse(JSON.stringify(Main.importSettings(settings)));
    },

    renderFrames: function(){

    },

    destroy: function(){

    }
  }
}