charts.chart1 = function() {
  // initialise layout variables
  const margin = {top: 50, right: 20, bottom: 50, left: 60};
  const width = 600;
  const height = 400;

  const parseDateTime = d3.timeParse("%B %d, %Y");

  // initialise charts
  const svg = d3.select('#svg1')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // get data
  const file = 'data/NetflixOriginals.json';
  d3.cachedJson(file, 'chart1', function(data) {
    data.forEach(function(d) {
      d.date = parseDateTime(d.Premiere);
    });
    data = data.filter(d => d.date != null);
    const dataGroupedByYear = Array.from(d3.group(data, d => d.date.getFullYear()));
    const finalData = dataGroupedByYear.map(
        function (item) {
          return {
            year: item[0],
            numOriginals: item[1].length
          };
        }
    ).sort((a, b) => (a.year > b.year) ? 1 : -1);

    draw(finalData);
  });

  function draw(data) {
    // X axis
    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(function (d) {
          return d.year;
        }))
        .padding(0.2);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([0, 200])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Bars
    svg.selectAll("mybar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d.year); })
        .attr("y", function(d) { return y(d.numOriginals); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.numOriginals); })
        .attr("fill", "#69b3a2")

  }

  function drawAnnotation() {
    var annotation = svg.append('g');
    annotation.append('text')
      .attr('x', 60)
      .attr('y', 370)
      .classed('annotation', true)
      .text('Call drops significantly at night, especially during week days');
    annotation.append('rect')
      .attr('x', 60)
      .attr('y', 380)
      .attr('width', 400)
      .attr('height', 20)
      .classed('annotation', true);
  }
}
