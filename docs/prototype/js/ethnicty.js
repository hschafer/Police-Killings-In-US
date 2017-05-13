const d3 = require('d3');
const d3Chromatic = require('d3-scale-chromatic');

(function() {
    var w = $(window).width() * 0.5;
    var h = $(window).height() * 0.5;
    var radius = Math.min(w, h) / 3;
    var svg = null;

    var color = d3.scaleOrdinal(d3Chromatic.schemeDark2);
    var pie = d3.pie()
        .sort(compareStrings)
        .value(function(d) { return d.value; });
    var path = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);
    var outerArc = d3.arc()
	    .innerRadius(radius * 0.9)
	    .outerRadius(radius * 0.9);
    var label = d3.arc()
        .outerRadius(radius + 20)
        .innerRadius(radius + 10);


    $(document).ready(function() {
        d3.queue()
            .defer(d3.csv, "data/data-police-shootings-master/computed.csv")
            .defer(d3.json, "data/us-census.json")
            .await(ready);

        var ethnicitySectionContainer = d3.select("#ethnicitySectionContainer");
        var svgContainer = d3.select("#pieSvgContainer");

        svg = svgContainer.append("svg")
            .attr("width", w)
            .attr("height", h)
            .attr("class", "pieSVG");
        svg.append("rect")
            .attr("width", w)
            .attr("height", h)
            .attr("class", "backgroundRect");


        svg.append("g")
            .attr("transform", "translate(" + w / 4 + "," + h / 2 + ")")
            .attr("id", "victimPie");

        svg.append("g")
            .attr("transform", "translate(" + 3 * w / 4 + "," + h / 2 + ")")
            .attr("id", "censusPie")
    });

    function ready(error, victimData, censusData) {
        if (error) throw error;
        for (var i = 0; i < victimData.length; i++) {
            var d = victimData[i];
            if (d.race === "") {
                d.race = "O"; // Other
            }
        }
        var ethnicities = d3.nest()
            .key(function(d) { return d.race; })
            .rollup(function (victims) { return victims.length })
            .entries(victimData);

        var victimPie = svg.select("#victimPie");
        var censusPie = svg.select("#censusPie");
        drawPie(victimPie, ethnicities);
        drawPie(censusPie, censusData);
    }

    function drawPie(g, data) {
        var sorted = data.sort(compareStrings);
        console.log(sorted);
        var arc = g.selectAll(".arc")
            .data(pie(sorted))
            .enter().append("g")
            .attr("class", "arc");
        arc.append("path")
            .attr("d", path)
            .attr("fill", function(_, i) {return color(i); });
        arc.append("text")
            .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
            .attr("dy", "0.35em")
            .text(function(d) { return d.data.key; });
    }

    function compareStrings(s1, s2) {
        if (s1.key < s2.key) {
            return 1;
        } else if (s2.key === s1.key) {
            return 0;
        } else {
            return -1;
        }
    }
}());
