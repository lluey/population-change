d3.json("data/dataset_usa_geo_pop_list.json").then(data => {
    console.log(data.features[2])
    const choroplethMap = new ChoroplethMap({ 
        parentElement: '#map'
      }, data);
    const barchart = new Barchart({
        parentElement: '#barchart'
      }, data);
    barchart.updateVis()
  })