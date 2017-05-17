const d3 = require('d3');
const d3Chromatic = require('d3-scale-chromatic');
const Chart = require('chart.js');
require('waypoints/lib/jquery.waypoints.js');
require('./chart-extensions.js')

var OUTLINE_COLOR = "#b1b1b1";
var BACKGROUND_COLOR = "#2f394d";

Chart.defaults.global.defaultFontColor = OUTLINE_COLOR;

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
        var canvasContainer = d3.select("#ethnicityCanvasContainer");

        canvasContainer.append("canvas")
            .attr("width", w)
            .attr("height", h)
            .attr("id", "pieCharts");
        canvasContainer.append("canvas")
            .attr("width", w)
            .attr("height", chartH)
            .attr("id", "diffChart")
            .style("display", "none");
    });

    function ready(error, victimData, censusData) {
        if (error) throw error;
        victimData = victimData.sort(compareStrings);
        censusData = censusData.sort(compareStrings);
        var colors = victimData.map(function(_, i) { return color(i); });

        var pieCharts = makePieCharts(victimData, colors);

        // set this up now but it will remain hidden
        var diffs = victimData.map(function(d, i) {
            return { "key": d.key, "value": d.value - censusData[i].value};
        });
        var diffChart = makeDiffChart(diffs, colors);

        var waypoint = new Waypoint({
            element: $("#ethnicityCanvasContainer"),
            handler: function() {
                animatePieChart(pieCharts, censusData);
                waypoint.disable();
            },
            offset: 200
        });
    }

    function makePieCharts(victimData, colors) {
        return new Chart($("#pieCharts"), {
            type: "nestedDoughnut",
            data: {
                labels: victimData.map(function(d) { return d.key; }),
                datasets: [{
                    label: 'Percent of Victims',
                    data: victimData.map(function(d) { return d.value;}),
                    backgroundColor: colors,
                    borderColor: BACKGROUND_COLOR,
                    borderWidth: 2
                }]
            },
            options: {
                rotationIndex: 0,
                elements: {
				    center: {
					    text: "Race of Victims",
                        color: OUTLINE_COLOR, // Default is #000000
                        fontStyle: 'Arial', // Default is Arial
                        sidePadding: 20 // Defualt is 20 (as a percentage)
				    }
                },
                tooltips: {
                    callbacks: {
                        label: tooltipLabel
                    }
                },
                legend: {
                    onClick: rotateChart
                },
                onClick: rotateChart
			}
        });
    }

    function animatePieChart(chart, censusData) {
        var config = chart.config;
        config.data.datasets.unshift({
            label: 'Percentage of Population',
            data: censusData.map(function(d) { return d.value;}),
            backgroundColor: config.data.datasets[0].backgroundColor, // use the same color
            borderColor: BACKGROUND_COLOR,
            borderWidth: 2
        });
        config.options.elements.right = {
            text: "Race of Population",
        }
        chart.update();
        setTimeout(function() { $("#diffChart").fadeIn("slow"); }, 800);
        setTimeout(function() { $("#textReveal").fadeIn("slow"); }, 800);
    }

    function rotateChart(event, clicked) {
        if (clicked.length > 0) {
            var clickedElem = clicked[0];
            var index = clickedElem._index;
            var chart = clickedElem._chart;

            var datasets = chart.config.data.datasets;
            var rotationIndex = chart.config.options.rotationIndex;
            for (var i = 0; i < datasets.length; i++) {
                var data = datasets[i].data;
                var sum = 0;
                if (index < rotationIndex) {
                    for (var j = index; j < rotationIndex; j++) {
                        sum += data[j];
                    }
                    chart.config.options.rotations[i] += sum * 2 * Math.PI;
                } else {
                    for (var j = rotationIndex; j < index; j++) {
                        sum += data[j];
                    }
                    chart.config.options.rotations[i] -= sum * 2 * Math.PI;
                }
            }
            chart.config.options.rotationIndex = index;
            chart.controller.update();
        }
    }

    function makeDiffChart(diffs, colors) {
        return new Chart($("#diffChart"), {
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
                        boxWidth: 0 // make the annoying legend box dissapear
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
        })
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
