import csv, json, copy

with open("data/usa_geo.json", encoding = "ISO-8859-1") as geojson, open("data/co-est2020-alldata.csv", encoding = "ISO-8859-1") as dataset:
    county_boundaries = json.load(geojson)
    pop_data = list(csv.DictReader(dataset))


    for feature in county_boundaries["features"]:
        geojson_geo_id = feature["properties"]["STATE"] + feature["properties"]["COUNTY"]
        for pop_row in pop_data:
            pop_geo_id = pop_row["STATE"] + pop_row["COUNTY"]
            if geojson_geo_id == pop_geo_id:
                output = []
                for i in range(2010, 2021):
                    output.append(int(pop_row[f"POPESTIMATE{i}"]))
                
                feature["properties"]["pop_list"] = output.copy()


    with open("data/dataset_usa_geo_pop_list.json", "w+") as outfile:
        json.dump(county_boundaries, outfile)
