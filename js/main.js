const topojson = require('topojson');

$(document).ready(function () {
    $('#fullpage').fullpage({
        autoScrolling: false,
        navigation: true,
        navigationPosition: 'left',
        menu: '#menu'

    });

    // here's how we get our csv files in d3
    d3.csv("data/thecounted-data/the-counted-2015.csv", function (data) {
        console.log(data[0]);
    });

    // NOTE: d3.geo functions all have new syntax as of D3 4.0 release
    // d3.geo.albersUsa() call from example site is now d3.geoAlbersUsa
    // see details of recent changes here: https://github.com/d3/d3/blob/master/CHANGES.md

    //Width and height of map
    var width = 960;
    var height = 600;

    //Create SVG element and append map to the SVG
    var svg = d3.select("#section2").select(".fp-tableCell")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var path = d3.geoPath();

    d3.json("https://d3js.org/us-10m.v1.json", function(error, us) {
        if (error) throw error;

        // append states
        svg.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .enter().append("path")
            .attr("d", path);

        svg.append("path")
            .attr("class", "state-borders")
            .attr("d", path(topojson.mesh(us, us.objects.states, function (a, b) {
                // don't append paths that are the same line
                // i.e. don't append washington's south border AND
                // orgegon's north border where they overlap
                return a !== b;
            })));

        // append outline of whole country
        svg.append("path")
            .attr("class", "us-outline")
            .attr("d", path(topojson.mesh(us, us.objects.nation)));
    });

});
