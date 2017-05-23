const Chart = require('chart.js');

var DEFAULT_ROTATIONS = [Chart.defaults.doughnut.rotation, Chart.defaults.doughnut.rotation];

var baseController = Chart.controllers.doughnut;
Chart.defaults.nestedDoughnut = Chart.helpers.extend(Chart.defaults.doughnut, {
    rotations: DEFAULT_ROTATIONS.slice()
});

Chart.controllers.nestedDoughnut = Chart.controllers.doughnut.extend({
    reset: function() {
        this.chart.options.rotationIndex = 0;
        this.chart.options.rotations = DEFAULT_ROTATIONS.slice();
        Chart.controllers.doughnut.prototype.reset.apply(this, arguments);
    },
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
        var chart = me.chart,
            chartArea = chart.chartArea;

        if (chart.config.options.legend.position === "left") {
            chartArea.left = 0; // this is a total hack and should be shamed
        }

        var opts = chart.options,
            animationOpts = opts.animation,
            centerX = (chartArea.left + chartArea.right) / 2,
            centerY = (chartArea.top + chartArea.bottom) / 2,
            // really annoying that this was basically the 2 lines of code I needed to change
            startAngle = opts.rotations[ringIndex], // non reset case handled later
            endAngle = opts.rotations[ringIndex], // non reset case handled later
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

Chart.pluginService.register({
    // Draw center text inside the chart if specified, can also specify stuff to the right
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
                var rightX = centerX - chart.outerRadius / 2 - rightStringWidth;
                var rightY = 3 * centerY / 2;
                ctx.fillText(rightTxt, rightX, rightY);
            }
        }
    }
});

