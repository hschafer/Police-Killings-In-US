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
            var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
            var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = fontSizeToUse+"px " + fontStyle;
            ctx.fillStyle = color;
            ctx.fillText(txt, centerX, centerY);

            // If we have a config for the right, use the same stuff as the center except for the text
            if (chart.config.options.elements.right) {
                var rightTxt = chart.config.options.elements.right.text;
                var rightStringWidth = ctx.measureText(rightTxt).width;
                var rightX = centerX + chart.outerRadius + rightStringWidth / 2 + sidePaddingCalculated / 4;
                ctx.fillText(rightTxt, rightX, centerY);
            }
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

        var pieCharts = makePieCharts(victimData, colors.slice()); // bug-fix: rotation same array twice

        // set this up now but it will remain hidden
        var diffs = victimData.map(function(d, i) {
            return { "key": d.key, "value": d.value - censusData[i].value};
        });
        var diffChart = makeDiffChart(diffs, colors.slice());

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
            type: "doughnut",
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
                indexRotation: 0, // this is my own field that I want it to keep track of
                originalColors: colors.slice(), // this is also my own field
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
                    onClick: rotateChart,
                    labels: {
                        generateLabels: function(chart) {
                            var label = Chart.defaults.doughnut.legend.labels.generateLabels(chart);
                            var defaultColors = chart.config.options.originalColors;
                            for (var i = 0; i < label.length; i++) {
                                label[i].fillStyle = defaultColors[i];
                            }
                            return label;
                        }
                    }
                },
                onClick: rotateChart
			}
        });
    }

    function rotateChart(event, clicked) {
        var clickedElem = clicked[0];
        var index = clickedElem._index;
        var chart = clickedElem._chart;

        var datasets = chart.config.data.datasets;

        var rotate = function(rotation, arr) {
            for (var i = 0; i < rotation; i++) {
                arr.push(arr.shift());
            }
        }

        console.log("Before", datasets);
        for (var i = 0; i < datasets.length; i++) {
            rotate(index, datasets[i].data);
            rotate(index, datasets[i].backgroundColor);
        }
        console.log("After", datasets);

        chart.config.options.indexRotation =
                (chart.config.options.indexRotation + index) % datasets[0].length;
        chart.controller.update();
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

    function animatePieChart(chart, censusData) {
        console.log("chart animate", chart);

        var config = chart.config;
        config.data.datasets.unshift({
            label: 'Percentage of Population',
            data: censusData.map(function(d) { return d.value;}),
            backgroundColor: config.data.datasets[0].backgroundColor.slice(), // bug-fix: ratate same array twice
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
