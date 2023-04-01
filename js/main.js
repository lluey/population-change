const dispatcher = d3.dispatch('chor_selectCounty', 'bar_selectCounty');

d3.json("data/dataset_usa_geo_pop_list.json").then(data => {
    let slider = new rSlider({
    target: '#sampleSlider',
    values: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    range: true,
    tooltip: true,
    scale: true,
    labels: true,
    set: [2010, 2015],
    onChange: () => {
      choroplethMap.updateVis()
      barchart.updateVis()
    }
  });
    const choroplethMap = new ChoroplethMap({parentElement: '#map'}, dispatcher, data, slider);
    const barchart = new Barchart({parentElement: '#barchart'}, dispatcher, data, slider);

    choroplethMap.updateVis()
    barchart.updateVis()
  })