class Barchart {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _dispatcher, _data) {
    this.config = {
    parentElement: _config.parentElement,
    containerWidth: _config.containerWidth || 500,
    containerHeight: _config.containerHeight || 1000,
    margin: _config.margin || {top: 0, right: 0, bottom: 0, left: 100},
    tooltipPadding: 10,
    legendBottom: 50,
    legendLeft: 50,
    legendRectHeight: 12,
    legendRectWidth: 150
    }
    this.data = _data;
    this.dispatcher = _dispatcher
    this.initVis();
  }

  initVis() {

    let vis = this;

    vis.selected = "01"
    vis.new_data = [];

    vis.dispatcher.on("selectCounty", county => {
      if (county != null) {
        vis.selected = county.properties.STATE
      } else {
        vis.selected = "01"
      }
      vis.updateVis()
      console.log("DISPATCHER")
    });

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
        .attr('class', 'barchart')

    // Initialize scales
    vis.xScale = d3.scaleLinear()
        .range([0, vis.width]);

    vis.yScale = d3.scaleBand()
        .range([0, vis.height])
        .paddingInner(0.15);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale)
        .tickSizeOuter(1);

    vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(3006)
        .tickSizeOuter(1);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);
    
    // Append y-axis group 
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');

    // Append titles, legends and other static elements here
    // ...
  }

  updateVis() {
    let vis = this;

    function popExists(d) {
      if(d.properties.pop_list) {
          return d.properties.pop_list[10] / d.properties.pop_list[0]
      } else {
          return 1
      }
    };

    function aggregateName(d) {
        if(d.properties.NAME && d.properties.STNAME) {
            return d.properties.NAME + ", " + d.properties.STNAME
        }
    }
    console.log("BEFORE:")
    console.log(vis.data.features)
    vis.new_data = [];
    vis.data.features.forEach(feature => {
      if (String(feature.properties.STATE) == vis.selected && popExists(feature)) {
        vis.new_data.push(feature)
        console.log("PUSHED")
      }
    });

    // vis.data = vis.new_data
    console.log("NEW:")
    console.log(vis.data)

    vis.xValue = d => popExists(d)
    vis.yValue = d => aggregateName(d)
    // console.log(vis.data.features[0])
    // Set the scale input domains
    vis.xScale.domain([0, d3.max(vis.new_data, vis.xValue)]);
    vis.yScale.domain(vis.new_data.map(vis.yValue));
    
    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Add rectangles
    vis.chart.selectAll('.bar')
        .data(vis.new_data)
        .join('rect')
        .attr('class', 'bar')
        .attr('width', d => vis.xScale(vis.xValue(d)))
        .attr('height', vis.yScale.bandwidth())
        .attr('y', d => vis.yScale(vis.yValue(d)))
        .attr('x', 0)
        .on('mousemove', (event,d) => {
            const pop = (d.properties.pop_list[10] / d.properties.pop_list[0]) ? `Population: <strong>${(d.properties.pop_list[10]/ d.properties.pop_list[0])}</strong>` : 'No data available';
            d3.select('#tooltip')
              .style('display', 'block')
              .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
              .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
              .html(`
                <div class="tooltip-title">${d.properties.NAME}</div>
                <div>${pop}</div>
              `);
          })
          .on('mouseleave', () => {
            d3.select('#tooltip').style('display', 'none');
          });
    
    // Update the axes because the underlying scales might have changed
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }
}