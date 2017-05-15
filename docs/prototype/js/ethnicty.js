const d3 = require('d3');
const d3Chromatic = require('d3-scale-chromatic');
const Chart = require('chart.js');
require('waypoints/lib/jquery.waypoints.js');

Chart.defaults.global.defaultFontColor = "#b1b1b1";


(function() {
    var w = $(window).width() * 0.5;
    var h = $(window).height() * 0.5;
    var chartH = h / 2;
    var legendHeight = h / 8;
    var verticalTranslate = legendHeight + (h - legendHeight) / 2;

    var radius = Math.min(w, h) / 3;
    var svg = null;

    var color = d3.scaleOrdinal(d3Chromatic.schemeDark2);
    var pie = d3.pie()
        .sort(compareStrings)
        .value(function(d) { return d.value; });
    var path = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    $(document).ready(function() {
        d3.queue()
            .defer(d3.json, "data/victims_percentage.json")
            .defer(d3.json, "data/us-census.json")
            .await(ready);

        var ethnicitySectionContainer = d3.select("#ethnicitySectionContainer");
        var svgContainer = d3.select("#pieSvgContainer");

        svg = svgContainer.append("svg")
            .attr("width", w)
            .attr("height", h)
            .attr("class", "pieSVG");
        svgContainer.append("canvas")
            .attr("width", w)
            .attr("height", chartH)
            .attr("id", "diffChart")
            .style("display", "none");

        svg.append("g")
            .attr("width", w)
            .attr("height", legendHeight)
            .attr("id", "legendContainer");

        svg.append("g")
            .attr("transform", "translate(" + w / 4 + "," + verticalTranslate + ")")
            .attr("id", "censusPie")
        svg.append("g")
            .attr("transform", "translate(" + w / 4 + "," + verticalTranslate + ")")
            .attr("id", "victimPie")
    });

    function ready(error, victimData, censusData) {
        if (error) throw error;
        victimData = victimData.sort(compareStrings);
        censusData = censusData.sort(compareStrings);

        makeLegend(victimData);

        var censusPie = svg.select("#censusPie");
        drawPie(censusPie, censusData, false);
        var victimPie = svg.select("#victimPie");
        drawPie(victimPie, victimData, true);

        // set this up now but it will remain hidden
        var diffs = victimData.map(function(d, i) { return { "key": d.key, "value": d.value - censusData[i].value}; });
        var colors = diffs.map(function(_, i) { return color(i); });
        var diffChart = new Chart($("#diffChart"), {
            type: 'bar',
            data: {
                labels: diffs.map(function(d) { return d.key; }),
                datasets: [{
                    label: 'Difference Between Census and Victims',
                    data: diffs.map(function(d) { return d.value; }),
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                legend: {
                    labels: {
                        boxWidth: 0
                    }
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero:true
                        }
                    }]
                }
            }
        });

        var waypoint = new Waypoint({
            element: $("#pieSvgContainer"),
            handler: function() {
                animatePieChart(victimData, censusData);
                waypoint.disable();
            },
            offset: 200
        });
    }

    function makeLegend(ethnicities) {
        var padding = 5;
        var legendMarkerWidth = (w - padding * (ethnicities.length + 1)) / ethnicities.length;
        svg.select("#legendContainer").selectAll("rect")
            .data(ethnicities)
            .enter()
            .append("rect")
            .attr("width", legendMarkerWidth)
            .attr("height", h / 8)
            .attr("fill", function(_, i) { console.log(color(i)); return color(i); })
            .attr("transform", function(_, i) {
                return "translate(" + ((legendMarkerWidth + padding) * i + padding)  + ", " + padding + ")"
            })
            .append("text")
            .text(function(d) { return d.key; });

        // failed attempt 1
        //var legend= svg.select('#legendContainer').selectAll(".legend")
        //    .data(ethnicities)
        //var div = legend.enter().append("div")
        //    .attr("class", "legends")
        //var p = div.append("p")
        //    .attr("class", "legendLabel")
        //p.append("span")
        //    .attr("class","key-dot")
        //    .style("background", function(d,i) { return color(i); } )
        //p.insert("text")
        //    .text(function(d,i) { return d.key; } )

        // failed attempt 2
        //var dataL = 0;
        //var offset = 100;
        //var legend = svg.select("#legendContainer").selectAll(".legend")
        //    .data(ethnicities)
        //    .enter()
        //    .append("g")
        //    .attr("class", "legend")
        //    .attr("transform", function(d, i) {
        //        var oldDataL = dataL;
        //        dataL +=  d.key.length + offset
        //        if (i == 0) {
        //            return "translate(0,0)"
        //        } else {
        //            return "translate(" + (oldDataL) + ",0)"
        //        }
        //    });

        //legend.append('rect')
        //    .attr("x", 0)
        //    .attr("y", 0)
        //    .attr("width", 10)
        //    .attr("height", 10)
        //    .style("fill", function (d, i) {
        //        return color(i)
        //    });

        //legend.append('text')
        //    .attr("x", 20)
        //    .attr("y", 10)
        //    .text(function (d, i) {
        //        return d.key
        //    })
        //    .attr("class", "textselected")
        //    .style("text-anchor", "start")
        //    .style("font-size", 15);
    }

    function drawPie(g, data, showLabel) {
        var arc = g.selectAll(".arc")
            .data(pie(data))
            .enter().append("g")
            .attr("class", "arc");
        arc.append("path")
            .attr("d", path)
            .attr("fill", function(_, i) {return color(i); });
    }

    function animatePieChart(victimData, censusData) {
        var censusPie = svg.select("#censusPie");
        censusPie.transition().duration(750)
            .attr("transform", "translate(" + 3 * w / 4 + "," + verticalTranslate + ")");
        setTimeout(function() { $("#diffChart").fadeIn("slow"); }, 800);
    }

    function compareStrings(s1, s2) {
        if (s1.key < s2.key) {
            return -1;
        } else if (s2.key === s1.key) {
            return 0;
        } else {
            return 1;
        }
    }
}());
