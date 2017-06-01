function groupData(data) {
    var groupedData = d3.nest()
        .key(function(d) { return d.city + ", " + d.state})
        .entries(data);

    return groupedData.map(function(val, index) {
        var key = val["key"];
        var parts = key.split(",");

        var singleRecord = val["values"][0]; // get a single person to get lat/long
        var latitude = parseFloat(singleRecord.computed_lat);
        var longitude = parseFloat(singleRecord.computed_long);

        return {
            "city": parts[0],
            "state": parts[1],
            "longitude": longitude,
            "latitude" : latitude,
            "num_records": val["values"].length,
            "records": val["values"],
            "id": "" + index
        }
    }).sort(function (a, b) { return d3.descending(a.num_records, b.num_records); });
}
