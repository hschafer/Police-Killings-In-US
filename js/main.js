const topojson = require('topojson');

$(document).ready(function () {
    $('#fullpage').fullpage({
        autoScrolling: false,
        navigation: true,
        navigationPosition: 'left',
        menu: '#menu'

    });

    // NOTE: d3.geo functions all have new syntax as of D3 4.0 release
    // d3.geo.albersUsa() call from example site is now d3.geoAlbersUsa
    // see details of recent changes here: https://github.com/d3/d3/blob/master/CHANGES.md

    d3.queue()
        .defer(d3.json, "us-states.json")
        .defer(d3.csv, "us-cities.csv")
        .await(ready);

    /*
       d3.json("", function(error, us) {
       if (error) throw error;
    // append states
    //svg.append("g")
    //    .attr("class", "states")
    //    .selectAll("path")
    //    .data(topojson.feature(us, us.objects.states).features)
    //    .enter().append("path")
    //    .attr("d", path);

    svg.append("path")
    .attr("class", "states")
    .datum(topojson.feature(us, us.objects.states))
    .attr("d", path);

    //svg.append("path")
    //    .attr("class", "state-borders")
    //    .attr("d", path(topojson.mesh(us, us.objects.states, function (a, b) {
    //        // don't append paths that are the same line
    //        // i.e. don't append washington's south border AND
    //        // orgegon's north border where they overlap
    //        return a !== b;
    //    })));

    //// append outline of whole country
    //svg.append("path")
    //    .attr("class", "us-outline")
    //    .attr("d", path(topojson.mesh(us, us.objects.nation)));
    });

    var geoJSON = toGeoJSON(data);

    svg.selectAll(".symbol")
    .data(geoJSON.features.sort(function(a, b) { return b.properties.size - a.properties.size; }))
    .enter().append("path")
    .attr("class", "symbol")
    .attr("d", path);

    //svg.selectAll("circle")
    //    .data(data)
    //    .enter()
    //    .append("circle")
    //    .attr("cx", function(d) { return d3.geoAlbersUsa([d.computed_long, d.computed_lat])[0]; })
    //    .attr("cy", function(d) { return d3.geoAlbersUsa([d.computed_long, d.computed_lat])[1]; })
    //    .attr("r", "8px")
    //    .attr("fill", "red");
});*/
});

function ready(error, us, data) {
    if (error) throw error;

    var w = 1200;
    var h = 500;
    var projection = d3.geoAlbersUsa()
            .translate([w / 2, h / 2])
            .scale([900]);

    var path = d3.geoPath()
            .projection(projection);

    var svg = d3.select("#section2").select(".fp-tableCell")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

    svg.selectAll("path")
                .data(us.features)
                .enter()
                .append("path")
                .attr("class", "states")
                .attr("d", path);


    svg.selectAll("circle")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("cx", function (d) {
                        return projection([d.lon, d.lat])[0];
                    })
                    .attr("cy", function (d) {
                        return projection([d.lon, d.lat])[1];
                    })
                    .attr("r", function (d) {
                        return Math.sqrt(parseInt(d.population) * 0.00004);
                    })
                    .style("fill", "steelblue")
                    .style("opacity", 0.8);

}

function toGeoJSON(data) {
    var groupedData = d3.nest()
        .key(function(d) { return d.city + ", " + d.state + "," + d.computed_long + "," + d.computed_lat; })
        .entries(data);

    console.log(groupedData);
    var locations = groupedData.map(function(val, index) {
        var key = val["key"];
        var parts = key.split(",");

        return {
            "type": "Feature",
            "id": "" + index,
            "geometry": {
                "type": "Point",
                "coordinates": [parseFloat(parts[2]), parseFloat(parts[3])]
            },
            "properties": {
                "name": parts[0] + ", " + parts[1],
                "size": val["values"].length
            }
        }
    });

    return {"type": "FeatureCollection", "features": locations};
}
