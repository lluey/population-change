const dispatcher = d3.dispatch('chor_selectCounty', 'bar_selectCounty');

Promise.all([
    d3.json("data/dataset_usa_geo_pop_list.json"),
    d3.json("data/cb_2018_us_state_20m.geojson")
  ]).then((data) => {
    let slider = new rSlider({
      target: '#sampleSlider',
      values: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
      range: true,
      tooltip: true,
      scale: true,
      labels: true,
      width: 1025,
      set: [2010, 2015],
      onChange: () => {
        choroplethMap.updateVis()
        barchart.updateVis()
      }
    });

      let geo_pop_list = data[0]
      let state_borders = data[1]
  
      const choroplethMap = new ChoroplethMap({parentElement: '#map'}, dispatcher, geo_pop_list, state_borders, slider);
      const barchart = new Barchart({parentElement: '#barchart'}, dispatcher, geo_pop_list, slider);
  
      choroplethMap.updateVis()
      barchart.updateVis()
  })