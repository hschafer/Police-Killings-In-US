const d3 = require('d3');
const d3Chromatic = require('d3-scale-chromatic');
const Chart = require('chart.js');
require('waypoints/lib/jquery.waypoints.js');

var OUTLINE_COLOR = "#b1b1b1";
var BACKGROUND_COLOR = "#2f394d";

Chart.defaults.global.defaultFontColor = OUTLINE_COLOR;

var baseController = Chart.controllers.doughnut;
Chart.defaults.nestedDoughnut = Chart.helpers.extend(Chart.defaults.doughnut, {
    rotations: [Chart.defaults.doughnut.rotation, Chart.defaults.doughnut.rotation]
});

Chart.controllers.nestedDoughnut = Chart.controllers.doughnut.extend({
    // The rest of this code is copied from https://github.com/chartjs/Chart.js/blob/master/src/controllers/controller.doughnut.js
    // so that we can extend it to allow each nested chart to have different rotations
    update: function(reset) {
        var me = this;
        var chart = me.chart,
            chartArea = chart.chartArea,
            opts = chart.options,
            arcOpts = opts.elements.arc,
            availableWidth = chartArea.right - chartArea.left - arcOpts.borderWidth,
            availableHeight = chartArea.bottom - chartArea.top - arcOpts.borderWidth,
            minSize = Math.min(availableWidth, availableHeight),
            offset = {
                x: 0,
                y: 0
            },
            meta = me.getMeta(),
            cutoutPercentage = opts.cutoutPercentage,
            circumference = opts.circumference,
            ringIndex = me.getRingIndex(me.index);

        // If the chart's circumference isn't a full circle, calculate minSize as a ratio of the width/height of the arc
        if (circumference < Math.PI * 2.0) {
            var startAngle = opts.rotations[ringIndex] % (Math.PI * 2.0);
            startAngle += Math.PI * 2.0 * (startAngle >= Math.PI ? -1 : startAngle < -Math.PI ? 1 : 0);
            var endAngle = startAngle + circumference;
            var start = {x: Math.cos(startAngle), y: Math.sin(startAngle)};
            var end = {x: Math.cos(endAngle), y: Math.sin(endAngle)};
            var contains0 = (startAngle <= 0 && 0 <= endAngle) || (startAngle <= Math.PI * 2.0 && Math.PI * 2.0 <= endAngle);
            var contains90 = (startAngle <= Math.PI * 0.5 && Math.PI * 0.5 <= endAngle) || (startAngle <= Math.PI * 2.5 && Math.PI * 2.5 <= endAngle);
            var contains180 = (startAngle <= -Math.PI && -Math.PI <= endAngle) || (startAngle <= Math.PI && Math.PI <= endAngle);
            var contains270 = (startAngle <= -Math.PI * 0.5 && -Math.PI * 0.5 <= endAngle) || (startAngle <= Math.PI * 1.5 && Math.PI * 1.5 <= endAngle);
            var cutout = cutoutPercentage / 100.0;
            var min = {x: contains180 ? -1 : Math.min(start.x * (start.x < 0 ? 1 : cutout), end.x * (end.x < 0 ? 1 : cutout)), y: contains270 ? -1 : Math.min(start.y * (start.y < 0 ? 1 : cutout), end.y * (end.y < 0 ? 1 : cutout))};
            var max = {x: contains0 ? 1 : Math.max(start.x * (start.x > 0 ? 1 : cutout), end.x * (end.x > 0 ? 1 : cutout)), y: contains90 ? 1 : Math.max(start.y * (start.y > 0 ? 1 : cutout), end.y * (end.y > 0 ? 1 : cutout))};
            var size = {width: (max.x - min.x) * 0.5, height: (max.y - min.y) * 0.5};
            minSize = Math.min(availableWidth / size.width, availableHeight / size.height);
            offset = {x: (max.x + min.x) * -0.5, y: (max.y + min.y) * -0.5};
        }

        chart.borderWidth = me.getMaxBorderWidth(meta.data);
        chart.outerRadius = Math.max((minSize - chart.borderWidth) / 2, 0);
        chart.innerRadius = Math.max(cutoutPercentage ? (chart.outerRadius / 100) * (cutoutPercentage) : 0, 0);
        chart.radiusLength = (chart.outerRadius - chart.innerRadius) / chart.getVisibleDatasetCount();
        chart.offsetX = offset.x * chart.outerRadius;
        chart.offsetY = offset.y * chart.outerRadius;

        meta.total = me.calculateTotal();

        me.outerRadius = chart.outerRadius - (chart.radiusLength * ringIndex);
        me.innerRadius = Math.max(me.outerRadius - chart.radiusLength, 0);

        Chart.helpers.each(meta.data, function(arc, index) {
            me.updateElement(arc, index, reset, ringIndex);
        });
    },

    updateElement: function(arc, index, reset, ringIndex) {
        var me = this;
        console.log("Updating element", me);
        var chart = me.chart,
            chartArea = chart.chartArea,
            opts = chart.options,
            animationOpts = opts.animation,
            centerX = (chartArea.left + chartArea.right) / 2,
            centerY = (chartArea.top + chartArea.bottom) / 2,
            startAngle = opts.rotations[index], // non reset case handled later
            endAngle = opts.rotations[index], // non reset case handled later
            //startAngle = opts.rotation,
            //endAngle = opts.rotation,
            dataset = me.getDataset(),
            circumference = reset && animationOpts.animateRotate ? 0 : arc.hidden ? 0 : me.calculateCircumference(dataset.data[index]) * (opts.circumference / (2.0 * Math.PI)),
            innerRadius = reset && animationOpts.animateScale ? 0 : me.innerRadius,
            outerRadius = reset && animationOpts.animateScale ? 0 : me.outerRadius,
            valueAtIndexOrDefault = Chart.helpers.getValueAtIndexOrDefault;

        Chart.helpers.extend(arc, {
            // Utility
            _datasetIndex: me.index,
            _index: index,

            // Desired view properties
            _model: {
                x: centerX + chart.offsetX,
                y: centerY + chart.offsetY,
                startAngle: startAngle,
                endAngle: endAngle,
                circumference: circumference,
                outerRadius: outerRadius,
                innerRadius: innerRadius,
                label: valueAtIndexOrDefault(dataset.label, index, chart.data.labels[index])
            }
        });

        var model = arc._model;
        // Resets the visual styles
        this.removeHoverStyle(arc);

        // Set correct angles if not resetting
        if (!reset || !animationOpts.animateRotate) {
            if (index === 0) {
                model.startAngle = opts.rotations[ringIndex];
            } else {
                model.startAngle = me.getMeta().data[index - 1]._model.endAngle;
            }

            model.endAngle = model.startAngle + model.circumference;
        }

        arc.pivot();
    }
});

console.log(Chart.controllers.nestedDoughnut);

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
                rotations: [-0.5 * Math.PI, -0.5 * Math.PI],
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
                    labels: {
                        onClick: rotateChart
                    }
                },
                onClick: rotateChart
			}
        });
    }

    function rotateChart(event, clicked) {
        if (clicked) {
            var clickedElem = clicked[0];
            var index = clickedElem._index;
            var chart = clickedElem._chart;

            var datasets = chart.config.data.datasets;
            var rotationIndex = chart.config.options.rotationIndex;
            for (var i = 0; i < datasets.length; i++) {
                var data = datasets[i].data;
                var sum = 0;
                console.log(data);
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
