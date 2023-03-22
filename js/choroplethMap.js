class ChoroplethMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1000,
      containerHeight: _config.containerHeight || 800,
      margin: _config.margin || {top: 0, right: 0, bottom: 0, left: 0},
      tooltipPadding: 10,
      legendBottom: 50,
      legendLeft: 50,
      legendRectHeight: 12, 
      legendRectWidth: 150
    }
    this.data = _data;
    this.initVis();
  }
  
  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

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
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Initialize projection and path generator
    vis.projection = d3.geoAlbersUsa();
    vis.geoPath = d3.geoPath().projection(vis.projection);

    // vis.colorScale = d3.scaleLinear()
    //     .range(['#cfe2f2', '#0d306b'])
    //     .interpolate(d3.interpolateHcl);

    vis.colorScale = d3.scaleDiverging()
        .interpolator(d3.interpolatePuOr)


    // Initialize gradient that we will later use for the legend
    vis.linearGradient = vis.svg.append('defs').append('linearGradient')
        .attr("id", "legend-gradient");


    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    const popExtent = d3.extent(vis.data["features"], d => {
      if(d.properties.pop_list) {
        return d.properties.pop_list[10] / d.properties.pop_list[0]
      } else {
        return 1
      }
    });
    

    // Update color scale
    vis.colorScale.domain([popExtent[0], 1, popExtent[1]]);

    vis.renderVis();
  }


  renderVis() {
    let vis = this;


    // Defines the scale of the projection so that the geometry fits within the SVG area
    vis.projection.fitSize([vis.width, vis.height], vis.data);

    // Append us map of counties
    const countyPath = vis.chart.selectAll('.county')
        .data(vis.data["features"])
      .join('path')
        .attr('class', 'county')
        .attr('d', vis.geoPath)
        .attr('fill', d => {
          if (d.properties.pop_list) {
            return vis.colorScale(d.properties.pop_list[10]/d.properties.pop_list[0]);
          } else {
            return 'url(#lightstripe)';
          }
        });

        countyPath
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

  }
}