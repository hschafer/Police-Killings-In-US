const d3 = require('d3');
const d3Chromatic = require('d3-scale-chromatic');
const Chart = require('chart.js');
require('waypoints/lib/jquery.waypoints.js');

var OUTLINE_COLOR = "#b1b1b1";
var BACKGROUND_COLOR = "#2f394d";

Chart.defaults.global.defaultFontColor = OUTLINE_COLOR;
Chart.pluginService.register({
    beforeDraw: function (chart) {
        if (chart.config.options.elements.center) {
            //Get ctx from string
            var ctx = chart.chart.ctx;

            //Get options from the center object in options
            var centerConfig = chart.config.options.elements.center;
            var fontStyle = centerConfig.fontStyle || 'Arial';
            var txt = centerConfig.text;
            var color = centerConfig.color || '#000';
            var sidePadding = centerConfig.sidePadding || 20;
            var sidePaddingCalculated = (sidePadding/100) * (chart.innerRadius * 2)
            //Start with a base font of 30px
            ctx.font = "30px " + fontStyle;

            //Get the width of the string and also the width of the element minus 10 to give it 5px side padding
            var stringWidth = ctx.measureText(txt).width;
            var elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;

            // Find out how much the font can grow in width.
            var widthRatio = elementWidth / stringWidth;
            var newFontSize = Math.floor(30 * widthRatio);
            var elementHeight = (chart.innerRadius * 2);

            // Pick a new font size so it will not be larger than the height of label.
            var fontSizeToUse = Math.min(newFontSize, elementHeight);

            //Set font settings to draw it correctly.
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
            var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
            console.log("Center", centerX, centerY);
            ctx.font = fontSizeToUse+"px " + fontStyle;
            ctx.fillStyle = color;

            //Draw text in center
            ctx.fillText(txt, centerX, centerY);
        }
    }
});

Chart.pluginService.register({
    beforeDraw: function(chart) {
        if (chart.config.options.elements.right) {
            //Get ctx from string
            var ctx = chart.chart.ctx;

            //Get options from the center object in options
            var rightConfig = chart.config.options.elements.right;
            var fontStyle = rightConfig.fontStyle || 'Arial';
            var txt = rightConfig.text;
            var centerTxt = rightConfig.centerText;
            var color = rightConfig.color || '#000';
            var sidePadding = rightConfig.sidePadding || 20;
            var sidePaddingCalculated = (sidePadding/100) * (chart.innerRadius * 2)
            var centerPadding = rightConfig.centerPadding || 20;
            var centerPaddingCalclulated = (centerPadding / 100) * (chart.innerRadius * 2);
            //Start with a base font of 30px
            ctx.font = "30px " + fontStyle;

            //Get the width of the string and also the width of the element minus 10 to give it 5px side padding
            var stringWidth = ctx.measureText(txt).width;
            var centerStringWidth = ctx.measureText(centerTxt).width;
            var elementWidth = (chart.innerRadius * 2) - centerPaddingCalclulated;

            // Hack alert: Using the center string to determine size to make them the same size
            var widthRatio = elementWidth / centerStringWidth;
            var newFontSize = Math.floor(30 * widthRatio);
            var elementHeight = (chart.innerRadius * 2);

            // Pick a new font size so it will not be larger than the height of label.
            var fontSizeToUse = Math.min(newFontSize, elementHeight);

            //Set font settings to draw it correctly.
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = fontSizeToUse+ "px " + fontStyle;
            var centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            var x = centerX + chart.outerRadius + ctx.measureText(txt).width / 2 + sidePaddingCalculated;
            var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
            console.log("Right", x, centerY);
            ctx.fillStyle = color;

            //Draw text in center
            ctx.fillText(txt, x, centerY);
        }
    }
});

function tooltipLabel(tooltipItem, data, signed) {
    var val = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
    var formattedVal = Math.round(10000 * val) / 100;
    if (signed) {
        formattedVal = (formattedVal < 0 ? "-" : "+") + Math.abs(formattedVal);
    }
    return data.labels[tooltipItem.index] + ": " + formattedVal + "%";
}


(function() {
    var w = $(window).width() * 0.55;
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

        //svg = svgContainer.append("svg")
        //    .attr("width", w)
        //    .attr("height", h)
        //    .attr("class", "pieSVG");

        svgContainer.append("canvas")
            .attr("width", w)
            .attr("height", h)
            .attr("id", "pieCharts");
        svgContainer.append("canvas")
            .attr("width", w)
            .attr("height", chartH)
            .attr("id", "diffChart")
            .style("display", "none");

        //svg.append("g")
        //    .attr("width", w)
        //    .attr("height", legendHeight)
        //    .attr("id", "legendContainer");

        //svg.append("g")
        //    .attr("transform", "translate(" + w / 4 + "," + verticalTranslate + ")")
        //    .attr("id", "censusPie")
        //svg.append("g")
        //    .attr("transform", "translate(" + w / 4 + "," + verticalTranslate + ")")
        //    .attr("id", "victimPie")
    });

    function ready(error, victimData, censusData) {
        if (error) throw error;
        victimData = victimData.sort(compareStrings);
        censusData = censusData.sort(compareStrings);

        //makeLegend(victimData);

        ///var censusPie = svg.select("#censusPie");
        ///drawPie(censusPie, censusData, false);
        ///var victimPie = svg.select("#victimPie");
        ///drawPie(victimPie, victimData, true);

        // set this up now but it will remain hidden
        var diffs = victimData.map(function(d, i) { return { "key": d.key, "value": d.value - censusData[i].value}; });
        var colors = diffs.map(function(_, i) { return color(i); });
        var diffChart = new Chart($("#diffChart"), {
            type: 'bar',
            data: {
                labels: diffs.map(function(d) { return d.key; }),
                datasets: [{
                    label: 'Percentage Difference Between Victims and Population',
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
                            beginAtZero:true,
                            callback: function(val) {
                                return parseInt(100 * val) + "%"; // floating point is hard
                            }
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) { return tooltipLabel(tooltipItem, data, true); }
                    }
                }
            }
        });

        var centerText = "Race of Victims";
        var rightText = "Race of U.S. Population";
        var centerPadding = 20;
        var pieCanvas = document.getElementById("pieCharts");
        var pieCtx = pieCanvas.getContext("2d");
        var pieConfig = {
            type: "doughnut",
            data: {
                labels: diffs.map(function(d) { return d.key; }),
                datasets: [{
                    label: 'Percent of Victims',
                    data: victimData.map(function(d) { return d.value;}),
                    backgroundColor: colors,
                    borderColor: BACKGROUND_COLOR,
                    borderWidth: 2
                }]
            },
            options: {
                elements: {
				    center: {
					    text: centerText,
                        color: OUTLINE_COLOR, // Default is #000000
                        fontStyle: 'Arial', // Default is Arial
                        sidePadding: centerPadding // Defualt is 20 (as a percentage)
				    }
                },
                tooltips: {
                    callbacks: {
                        label: tooltipLabel
                    }
                }
			}
        };
        var pieCharts = new Chart($("#pieCharts"), pieConfig);

        var waypoint = new Waypoint({
            element: $("#pieSvgContainer"),
            handler: function() {
                animatePieChart(pieCharts, pieConfig, censusData);
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

    function animatePieChart(chart, config, censusData) {
        //var censusPie = svg.select("#censusPie");
        //censusPie.transition().duration(750)
        //    .attr("transform", "translate(" + 3 * w / 4 + "," + verticalTranslate + ")");
        config.data.datasets.unshift({
            label: 'Percentage of Population',
            data: censusData.map(function(d) { return d.value;}),
            backgroundColor: config.data.datasets[0].backgroundColor,
            borderColor: BACKGROUND_COLOR,
            borderWidth: 2
        });
        config.options.elements.right = {
            text: "Race of U.S. Population",
            centerText: config.options.elements.center.text, // kind of a hack to get them to be the same size
            centerPadding: config.options.elements.center.sidePadding,
            sidePadding: 5,
            color: OUTLINE_COLOR,
            fontStyle: 'Arial'
        }
        chart.update();
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
