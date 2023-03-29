class ChoroplethMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _dispatcher, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1000,
      containerHeight: _config.containerHeight || 600,
      margin: _config.margin || {top: 0, right: 0, bottom: 0, left: 0},
      tooltipPadding: 10,
      legendBottom: 50,
      legendLeft: 50,
      legendRectHeight: 12, 
      legendRectWidth: 150
    }
    this.data = _data;
    this.dispatcher = _dispatcher;
    this.startYear = 0;
    this.endYear = 10;
    this.selectedCounty = null;
    this.initVis();
  }

  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    vis.dispatcher.on("bar_selectCounty", county => {
      if (county != null) {
        vis.selectedCounty = county
        d3.select(".county")
          .text(vis.selectedCounty.properties.NAME)
      } else {
        vis.selected = null // placeholder
        d3.select(".county")
          .text("Overall")
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
        .attr('class', 'map')

    // Initialize projection and path generator
    vis.projection = d3.geoAlbersUsa();
    vis.geoPath = d3.geoPath().projection(vis.projection);

    vis.colorScale = d3.scaleDiverging()
        .interpolator(d3.interpolateRdBu)

    // Initialize gradient that we will later use for the legend
    vis.linearGradient = vis.svg.append('defs').append('linearGradient')
        .attr("id", "legend-gradient");

    // Append legend
    vis.legend = vis.chart.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${vis.width-2.5*vis.config.legendRectWidth},${vis.height - vis.config.legendBottom})`);

    vis.legendRect = vis.legend.append('rect')
        .attr('width', vis.config.legendRectWidth)
        .attr('height', vis.config.legendRectHeight);

    vis.legendTitle = vis.legend.append('text')
        .attr('class', 'legend-title')
        .attr('dy', '.35em')
        .attr('y', -10)
        .text('Pop. change per county')

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    vis.validRange = d => d.properties.pop_list && d.properties.pop_list[vis.endYear] && d.properties.pop_list[vis.startYear]
    vis.ratioValue = d => {
      const yearRatio = d.properties.pop_list[vis.endYear] / d.properties.pop_list[vis.startYear];
      if (vis.selectedCounty == null){
        return yearRatio;
      } else {
        const selectedYearRatio = vis.selectedCounty.properties.pop_list[vis.endYear] / vis.selectedCounty.properties.pop_list[vis.startYear];
        return yearRatio/selectedYearRatio;
      }
    };

    vis.fillValue = d => vis.validRange(d)? vis.colorScale(vis.ratioValue(d)) : 'url(#lightstripe)';

    vis.deviation = d3.deviation(vis.data["features"], d => {
      if(vis.validRange(d)) {
        return vis.ratioValue(d)
      } else {
        return 1
      }
    });

    // Update color scale
    vis.colorScale.domain([Math.max(1-3*vis.deviation, 0), 1,  1+3*vis.deviation]);

    // legend using d3 colors from: https://stackoverflow.com/questions/70829892/create-d3-linear-color-legend-using-d3-colors
    // Define begin and end of the color gradient (legend)
    vis.legendStops = d3.range(10).map(d => ({color:d3.interpolateRdBu(d/10), value: d}))

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
        .attr('fill', d => vis.fillValue(d));

        countyPath
        .on('mousemove', (event,d) => {
          const pop = (vis.validRange(d)) ? `Change in Population: <strong>${(vis.ratioValue(d).toFixed(2))}</strong>` : 'No data available';
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

        countyPath
            .on('click', (e, d) => {
              if(vis.validRange(d)) {
                if (d === vis.selectedCounty) {
                  vis.selectedCounty = null;
                  d3.select(".county")
                      .text("Overall")
                } else {
                  vis.selectedCounty = d;
                  d3.select(".county")
                      .text(d.properties.NAME)
                }
                vis.dispatcher.call('chor_selectCounty', e, vis.selectedCounty)
                vis.updateVis()
                d3.select('#tooltip').style('display', 'none');
              }
            })

    // Add legend labels
    vis.legend.selectAll('.legend-label')
        .data(vis.colorScale.domain())
        .join('text')
        .attr('class', 'legend-label')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('y', 20)
        .attr('x', (d,index) => {
          return (index === 0)? 0 : (index === 1)? vis.config.legendRectWidth/2 : vis.config.legendRectWidth;
        })
        .text(d => d.toFixed(2));

    const extent = d3.extent(vis.legendStops, d => d.value)
    // Update gradient for legend
    vis.linearGradient.selectAll('stop')
        .data(vis.legendStops)
        .join('stop')
        .attr('offset', d => ((d.value - extent[0]) / (extent[1]-extent[0]) * 100) + "%")
        .attr('stop-color', d => d.color);

    vis.legendRect.attr('fill', 'url(#legend-gradient)')

  }
}