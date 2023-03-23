d3.json("data/dataset_usa_geo_pop_list.json").then(data => {
    const choroplethMap = new ChoroplethMap({
        parentElement: '#map'
      }, data);
  })