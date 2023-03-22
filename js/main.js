d3.json("data/dataset_usa_geo_pop_list.json").then(data => {
    console.log(data)
    console.log("hello")
    const choroplethMap = new ChoroplethMap({ 
        parentElement: '#map'
      }, data);
  })