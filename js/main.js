const dispatcher = d3.dispatch('selectCounty');

d3.json("data/dataset_usa_geo_pop_list.json").then(data => {
    const choroplethMap = new ChoroplethMap({parentElement: '#map'}, dispatcher, data);
    const barchart = new Barchart({parentElement: '#barchart'}, dispatcher, data);
    barchart.updateVis()
  })