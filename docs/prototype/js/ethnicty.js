const d3 = require('d3');
(function() {
    var w = $(window).width() * 0.5;
    var h = $(window).height() * 0.5;
    var radius = Math.min(w, h) / 2;
    var svg = null;

    $(document).ready(function() {
        d3.queue()
            .defer(d3.csv, "data/data-police-shootings-master/computed.csv")
            .await(ready);

        var ethnicitySectionContainer = d3.select("#ethnicitySectionContainer");
        var svgContainer = d3.select("#pieSvgContainer");

        svg = svgContainer.append("svg")
            .attr("width", w)
            .attr("height", h)
            .attr("class", "pieSVG");

        svg.append("g")
            .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");
    });

    function ready(error, data) {
        if (error) throw error;

        var ethnicities = d3.nest()
            .key(function(d) { return d.race; })
            .rollup(function (victims) { return victims.length })
            .entries(data);

        var color = d3.scaleOrdinal(d3.schemeCategory10);
        var pie = d3.pie()
            .value(function(d) { return d.value; });
        var path = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);
        var label = d3.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);

        var arc = svg.select("g").selectAll(".arc")
            .data(pie(ethnicities))
            .enter().append("g")
                .attr("class", "arc");
        arc.append("path")
            .attr("d", path)
            .attr("fill", function(_, i) {return color(i); });
    }
}());
