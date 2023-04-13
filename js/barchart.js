class Barchart {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _dispatcher, _data, _slider) {
    this.config = {
    parentElement: _config.parentElement,
    containerWidth: _config.containerWidth || 500,
    containerHeight: _config.containerHeight || 675,
    margin: _config.margin || {top: 30, right: 15, bottom: 15, left: 125},
    tooltipPadding: 10,
    legendBottom: 50,
    legendLeft: 50,
    legendRectHeight: 12,
    legendRectWidth: 150
    }
    this.data = _data;
    this.dispatcher = _dispatcher
    this.startYear = 0;
    this.endYear = 10;
    this.selectedCounty = null;
    this.slider = _slider;
    this.initVis();
  }

  initVis() {

    let vis = this;

    vis.selectedCounty = null;
    vis.selected = null;
    vis.new_data = [];

    vis.dispatcher.on("chor_selectCounty", county => {
      if (county != null) {
        vis.selected = county.properties.STATE
        vis.selectedCounty = county
        d3.select(".state")
            .text(vis.selectedCounty.properties.STNAME)
      } else {
        vis.selected = null
        vis.selectedCounty = null
        d3.select(".state")
            .text("All States")
      }
      vis.updateVis()
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

    vis.colorScale = d3.scaleDiverging()
      .interpolator(d3.interpolateRdBu)

    // Initialize scales
    vis.xScale = d3.scaleLinear()
        .range([0, vis.width]);

    vis.yScale = d3.scaleBand()
        .paddingInner(0.15);

    // Initialize axes
    vis.xAxis = d3.axisTop(vis.xScale)
        .tickSizeOuter(1);

    vis.yAxis = d3.axisLeft(vis.yScale)
        .tickSizeOuter(1);

    // Append x-axis group
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis');

    // Append y-axis group 
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');

  }

  updateVis() {
    let vis = this;

    let startYear = parseInt(this.slider.getValue().split(",")[0]) - 2010
    let endYear = parseInt(this.slider.getValue().split(",")[1]) - 2010

    vis.startYear = startYear
    vis.endYear = endYear

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

    function popExists(d) {
      if(vis.validRange(d)) {
          return d.properties.pop_list[vis.endYear] / d.properties.pop_list[vis.startYear]
      } else {
          return 1
      }
    }

    function aggregateName(d) {
        if(d.properties.NAME && d.properties.STNAME) {
            return d.properties.NAME + ", " + d.properties.STNAME
        }
    }

    vis.new_data = [];
    vis.data.features.forEach(feature => {
      if ((vis.selected == null || feature.properties.STATE === vis.selected)
          && vis.validRange(feature)
          && (feature.properties.LSAD === 'County' || feature.properties.STATE === "22")) {
        vis.new_data.push(feature)
      }
    });

    vis.new_data.sort(function(x, y){
      if (vis.validRange(x) && vis.validRange(y)) {
        return d3.ascending(vis.ratioValue(y), vis.ratioValue(x));
      }
    })

    vis.fillValue = d => {
      if (vis.validRange(d)) {
        if (d === vis.selectedCounty) {
          return 'yellow';
        } else {
          return vis.colorScale(vis.ratioValue(d));
        }
      } else {
        return 'url(#lightstripe)';
      }
    };

    vis.deviation = d3.deviation(vis.new_data, d => {
      if(vis.validRange(d)) {
        return vis.ratioValue(d)
      } else {
        return 1
      }
    });

    // Update color scale
    vis.colorScale.domain([Math.max(1-3*vis.deviation, 0), 1,  1+3*vis.deviation]);

    vis.xValue = d => popExists(d)
    vis.yValue = d => aggregateName(d)

    // Set the scale input domains
    vis.xScale.domain([0, d3.max(vis.new_data, vis.xValue)]);
    vis.yScale.domain(vis.new_data.map(vis.yValue))
      .range([0, vis.new_data.length * 15])

    // Update scroll height
    vis.svg.attr('height', vis.new_data.length*15+vis.yScale.bandwidth()*2.5)
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
        .attr('fill', d => vis.fillValue(d))
        .on('click', (e, d) => {
          if(vis.validRange(d)) {
            if (d === vis.selectedCounty) {
              vis.selectedCounty = null;
              vis.selected = null;

            } else {
              vis.selectedCounty = d;
              vis.selected = vis.selectedCounty.properties.STATE
            }
            vis.dispatcher.call('bar_selectCounty', e, vis.selectedCounty)
            vis.updateVis()
            d3.select('#tooltip').style('display', 'none');
          }
        })
        .on('mousemove', (event,d) => {
          const pop = (vis.validRange(d)) ? `Change in Population: <strong>${(vis.ratioValue(d).toFixed(2))}</strong>` : 'No data available';
          d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
              <div class="tooltip-title">${d.properties.NAME}, ${d.properties.STNAME}</div>
              <div>${pop}</div>
              <ul>
                <li>${vis.startYear+2010} Population: ${d.properties.pop_list[vis.startYear]}</li>
                <li>${vis.endYear+2010} Population: ${d.properties.pop_list[vis.endYear]}</li>
              </ul>
            `);
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('display', 'none');
        });

    // Update the axes because the underlying scales might have changed
    vis.xAxis.tickSize(-vis.svg.attr('height'))
    vis.xAxisG.call(vis.xAxis).raise();

    vis.yAxisG.call(vis.yAxis);

  }
}