// http://www.cagrimmett.com/til/2016/08/17/d3-lets-make-a-grid.html
// https://engineering.velocityapp.com/building-a-grid-ui-with-d3-js-v4-p1-c2da5ed016
// http://blog.mastermaps.com/2015/11/mapping-grid-based-statistics-with.html
// http://bl.ocks.org/tjdecke/5558084
// http://bl.ocks.org/oyyd/859fafc8122977a3afd6
// https://stackoverflow.com/questions/34608936/select-data-based-on-multiple-attributes-d3

charts.chart4 = function() {

// initialise layout variables
var margin = {top: 0, right: 0, bottom: 0, left: 0};
var width = 500;
var height = 500;

// initialise scale functions
var colorScale = d3.scaleLinear().range(['#ffffff', '#69A7D2', '#1A316B']);

// parse date / time
var strictIsoParse = d3.utcParse('%Y-%m-%dT%H:%M:%S.%LZ');
// format date / time
var hourFormat = d3.utcFormat('%H %p');

// initialise charts
var svg = d3.select('#svg4')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// get data
var url = 'data/output-grouped-times-all-squares-hourly.json';
d3.cachedJson(url, 'chart4', function(data) {
  // parse time to native js date
  data.forEach(function(d) {
    d.time = strictIsoParse(d.time_display);
    d.hour = hourFormat(d.time);
  });

  // draw data after 3 seconds
  d3.timeout(function() {
    toggleGrid();
    draw(data);
  }, 3000);
});

// register filter events
d3.selectAll('#show-grid')
 .on('change', function() {
   toggleGrid();
 });

// draw data
function draw(data) {
  var beginTimeInterval = data[0].time_interval;
  var beginTime = data[0].time;
  var endTime = data[data.length-1].time;
  console.log(beginTimeInterval, beginTime, endTime, hourFormat(beginTime), hourFormat(endTime))

  // scale the range of the data
  colorScale.domain(
    [0, d3.mean(data, function(d) { return d.all; })*1.5, d3.max(data, function(d) { return d.all; })]
  );

  // draw grid
  var gridData = getGridData();
  drawGeoPath(gridData);

  // animate daily usage by hour
  var hourOffset = 0;
  var timer = d3.interval(function() {
    if (hourOffset >= 23) {
      timer.stop();
      // hourOffset = 0;
    }

    var currentTimeInterval = beginTimeInterval + (3600 * hourOffset * 1000);
    var filteredData = data.filter(function(d) {
      return d.time_interval === currentTimeInterval;
    })

    console.log(hourOffset, currentTimeInterval, data.length, filteredData.length);
    displayTime(currentTimeInterval);
    transitionSquares(filteredData);
    hourOffset++;

  }, 1000); // update every 1 seconds

  return timer;
}

function getGridData() {
  var data = new Array();
  var xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
  var ypos = 1;
  var width = 5;
  var height = 5;
  
  // The square id numbering starts from the
  // bottom left corner of the grid and grows till its right top corner
  for (var row = 99; row >= 0; row--) {
    data.push( new Array() );
  }
  // iterate for rows
  for (var row = 99; row >= 0; row--) {
    // iterate for cells/columns inside rows
    for (var column = 0; column < 100; column++) {
      data[row].push({
        id: row * 100 + column + 1,
        x: xpos,
        y: ypos,
        width: width,
        height: height
      })
      // increment the x position. I.e. move it over by 50 (width variable)
      xpos += width;
    }
    // reset the x position after a row is complete
    xpos = 1;
    // increment the y position for the next row. Move it down 50 (height variable)
    ypos += height;	
  }
  return data;
}

function drawGeoPath(gridData) {
  var grid = svg;

  var row = grid.selectAll("g.row")
    .data(gridData)
    .enter()
    .append("g")
      .attr("class", function(d,i) { return 'row' + (i+1); });

  var column = row.selectAll("rect.square")
    .data(function(d) { return d; })
    .enter()
    .append("rect")
      .attr("class", function(d,i) { return 's' + d.id; })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("width", function(d) { return d.width; })
      .attr("height", function(d) { return d.height; })
      .style("fill", "#fff")
      .style("stroke", "#ddd");
}

function displayTime(timeInterval) {
  console.log(hourFormat(timeInterval));
  d3.select('#time')
    .html(hourFormat(timeInterval));
}

function transitionSquares(filteredData) {
  svg.selectAll('rect')
    .transition()
    .duration(2000)
    .ease(d3.easeLinear)
    .filter(function(d, i) {
      return true;
    })
    .style('fill', function(d, i) {
      if (!d) {
        return;
      }
      var record = filteredData.find(function(fd) {
        return d.id == fd.square_id;
      });
      if (!record) {
        return '#fff';
      }
      var color = colorScale(record.all);
      return color;
    });
  }

  function toggleGrid() {
    var showGridChecked = d3.select('#show-grid').property('checked');
    var map = d3.select('#map');
    if (showGridChecked) {
      map.style('opacity', 0.3)
    } else {
      map.style('opacity', 1)
    }
  }

}