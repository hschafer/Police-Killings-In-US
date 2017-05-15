const d3 = require('d3');
(function () {
    // size rectangle that holds map
    // proportional to window
    // not using CSS (i.e. width: 80%) for these
    // so that we can use the actual numerical values
    // to scale map
    var w = $(window).width() * (2.0 / 3);
    var h = $(window).height() * (2.0 / 3);
    var scale = w; // used to scale US map
    var radius = null; // global to recalculate radius

    var svg = null; // global for callbacks
    var activeState = d3.select(null);
    var tooltipActive = null;

    var projection = d3.geoAlbersUsa()
        .translate([w / 2, h / 2])
        .scale([scale]);

    var path = d3.geoPath()
        .projection(projection);

    var zoom = d3.zoom()
        .scaleExtent([1, 20])
        .on("zoom", zoomed);

    var legendWidth = 100;
    var legendHeight = 70;
    var maxLegend = -1;

    $(document).ready(function () {
        // NOTE: d3.geo functions all have new syntax as of D3 4.0 release
        // d3.geo.albersUsa() call from example site is now d3.geoAlbersUsa
        // see details of recent changes here: https://github.com/d3/d3/blob/master/CHANGES.md
        d3.queue()
            .defer(d3.json, "data/us-states.json")
            .defer(d3.json, "data/who_are_victims.json")
            .await(ready);
    });

    function ready(error, us, cityData) {
        if (error) throw error;

        cityData.sort(function (a, b) {
            d3.descending(a.num_records, b.num_records);
        });

        radius = d3.scaleSqrt()
            .domain([0, d3.max(cityData, function (d) {
                return d.num_records;
            })])
            .range([0, 15]);

        var section2Container = d3.select("#section2Container");
        var section2HeaderRow = d3.select("#section2HeaderRow");
        var section2Row = d3.select(".sectionRow");
        var svgContainer = d3.select("#usSvgContainer");

        // attach event listeners for zooming
        svgContainer.select("#zoomIn")
            .on("click", function () {
                zoomButtonClick(3 / 2);
            });
        svgContainer.select("#zoomOut")
            .on("click", function () {
                zoomButtonClick(2 / 3);
            });

        // disable body scrolling while inside SVG container
        svgContainer.on("mouseover",
            function () {
                document.body.style.overflow = 'hidden';
            })
            .on("mouseout",
                function () {
                    document.body.style.overflow = 'auto';
                });

        // append map SVG
        svg = svgContainer.append("svg")
            .attr("width", w)
            .attr("height", h)
            .attr("class", "mapSVG")
            .call(zoom);

        // append background container for map
        svg.append("rect")
            .attr("id", "background")
            .attr("width", w)
            .attr("height", h)
            .style("fill", "none")
            .style("pointer-events", "all");

        // append state paths
        svg.selectAll("path")
            .data(us.features)
            .enter()
            .append("path")
            .attr("class", "states")
            .attr("d", path)
            .on("click", clicked);

        // style map filters
        d3.select("#victimMapFilters")
            .attr("height", h * (1.0 / 3) + "px");

        appendSlider(d3.select("#victimDateFilter"), cityData);

        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        svg.selectAll(".symbol")
            .data(cityData)
            .enter()
            .append("circle")
            .attr("class", "symbol")
            .attr("cx", function (d) {
                return projection([d.longitude, d.latitude])[0];
            })
            .attr("cy", function (d) {
                return projection([d.longitude, d.latitude])[1];
            })
            .attr("r", function (d) {
                return radius(d.num_records);
            })
            .on("mouseover", function (d) {
                selectCity(d);

                // set tooltip
                if (d.records.length > 0) {
                    tooltipActive = true;
                    div.style("opacity", .9);
                    div.append("h2")
                        .html(d.city + ", " + d.state);
                    div.style("left", (d3.event.pageX) + 15 + "px")
                        .style("top", (d3.event.pageY) - 28 + "px")
                }
            })
            .on("mouseout", function (d) {
                // tooltip
                div.style("opacity", 0);
                div.selectAll("h2").remove();
                tooltipActive = false;

                // apply invisibility
                deselectCity();
            });


        randomSelection(cityData); // make it happen right away
        var timer = setInterval(randomSelection, 3000, cityData);

        svg.on("mouseenter", function () {
            if (timer) {
                d3.select("#highlightedCity").remove();
                clearInterval(timer);
                deselectCity();
                timer = null;
            }
        });
        svg.on("mouseleave", function () {
            timer = setInterval(randomSelection, 3000, cityData);
        });

        makeLegend(cityData);

        // kind of hacky
        // we have to do this last to get the position of the mapInfo sidebar
        d3.select("#hoverDirections").style("width", function () {
            var containerWidth = parseFloat(d3.select("#section2Container").style("width"));
            var mapWidth = parseFloat(d3.select("#usSvgContainer").select("svg").attr("width"));
            var result = containerWidth
                - mapWidth - parseFloat(d3.select(".mapInfo").style("padding-left"));
            return result + "px";
        });
    }

    function appendSlider(parent, cityData) {

        var maxDate = 180;
        var svg = parent.append("svg")
            .attr("width", parent.style("width"));

        var margin = {right: 50, left: 50},
            width = 500,
            height = 50;

        var x = d3.scaleLinear()
            .domain([0, maxDate])
            .range([0, width])
            .clamp(true);

        var slider = svg.append("g")
            .attr("class", "slider")
            .attr("transform", "translate(10, 10)");

        var lowerHandle;
        var upperHandle;
        var lowerHandleIsDragging = false; // initially not dragging anything
        var upperHandleIsDragging = false;

        slider.append("line")
            .attr("class", "track")
            .attr("x1", x.range()[0])
            .attr("x2", x.range()[1])
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "track-inset")
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "track-overlay");

        var ticks = slider.insert("g", ".track-overlay")
            .attr("class", "ticks")
            .attr("transform", "translate(0," + 25 + ")");

        ticks.append("text")
            .attr("x", x.range()[0])
            .classed("victimDateFilterLabel", true)
            .text("2015");

        ticks.append("text")
            .attr("x", x.range()[1])
            .classed("victimDateFilterLabel", true)
            .text("2017");


        // make handle drag behavior
        var lowerHandleDrag = d3.drag()
            .on('drag', function () {
                lowerHandleIsDragging = true;
                if (d3.event.x >= x.range()[0]
                    && d3.event.x < d3.select("#upperDateFilterHandle").attr("cx")) {
                    lowerHandle.attr('cx', d3.event.x);
                    var filtered = cityData.filter(function (d) {
                        return d.city == "Los Angeles";
                        //for (var recordIndex = 0; recordIndex < d.records.length; recordIndex++) {
                        //    var record = d.records[recordIndex];
                        //    var date = new Date(record.date);
                        //    if (date.getYear() > 2017) {
                        //        return true;
                        //    }
                        //}
                        //return false;
                    });

                    // re-bind city symbols to filtered data
                    d3.selectAll(".symbol")
                        .data(filtered)
                        .exit()
                        .remove();
                }
            });

        var upperHandleDrag = d3.drag()
            .on('drag', function () {
                upperHandleIsDragging = true;
                if (d3.event.x <= x.range()[1]
                    && d3.event.x > d3.select("#lowerDateFilterHandle").attr("cx")) {
                    upperHandle.attr('cx', d3.event.x);
                }
            });

        lowerHandle = slider.append("circle", ".track-overlay")
            .attr("id", "lowerDateFilterHandle")
            .attr("class", "dateFilterHandle")
            .attr("r", 9)
            .call(lowerHandleDrag);

        var upperHandle = slider.append("circle", ".track-overlay")
            .attr("id", "upperDateFilterHandle")
            .attr("class", "dateFilterHandle")
            .attr("cx", x.range()[1])
            .attr("r", 9)
            .call(upperHandleDrag);

        slider.transition() // Gratuitous intro!
            .duration(750);
    }


    function randomSelection(cityData) {
        var randCity = cityData[Math.floor(Math.random() * cityData.length)];
        var svg = d3.select(".mapSVG");
        var domNode = svg.selectAll(".symbol").filter(function (d) {
            return d.id === randCity.id;
        });
        var circle = svg.selectAll("#highlightedCity").data([randCity]);
        circle.enter().append('circle')
            .attr("id", "highlightedCity")
            .attr("class", "symbol")
            .merge(circle)
            .attr("cx", domNode.attr("cx"))
            .attr("cy", domNode.attr("cy"))
            .attr("r", domNode.attr("r"));
        circle.exit().remove();
        deselectCity();
        selectCity(randCity);
    }

    function selectCity(d) {
        // remove invisibility
        d3.select("#cityName").classed("invisibleText", false);
        d3.select("#cityName").html(d.city + ", " + d.state);

        // add victims
        var victimsList = d3.select("#victimList");
        for (var person = 0; person < d.records.length; person++) {
            victimsList.append("li").html(d.records[person].name);
        }
    }

    function deselectCity() {
        d3.select("#cityName").classed("invisibleText", true);
        d3.select("#cityName").html("...");
        var listNodes = d3.select("#victimList").selectAll("*");
        listNodes.remove();
    }

    function clicked(d) {
        activeState.classed("active", false);
        var zoomLevel;
        if (activeState.node() === this) {
            // If it is a click on the same state, we want to zoom out
            activeState = d3.select(null);
            zoomLevel = d3.zoomIdentity;
        } else {
            // We are clicking on a new state
            activeState = d3.select(this).classed("active", true);
            var bounds = path.bounds(d),
                dx = bounds[1][0] - bounds[0][0],
                dy = bounds[1][1] - bounds[0][1],
                x = (bounds[0][0] + bounds[1][0]) / 2,
                y = (bounds[0][1] + bounds[1][1]) / 2,
                scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / w, dy / h))),
                translate = [w / 2 - scale * x, h / 2 - scale * y];
            zoomLevel = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);
        }

        svg.transition()
            .duration(750)
            .call(zoom.transform, zoomLevel);
    }

    function zoomed() {
        var circles = svg.selectAll(".symbol");
        var states = svg.selectAll(".states");

        // If we are back at zoom level 1 then transition to center
        var transform = d3.event.transform;
        if (transform.k === 1) {
            transform.x = 0;
            transform.y = 0;
        }

        var scaleTransform = function (d, scale) {
            scale = (typeof scale === "undefined") ? 4 : scale;
            return d * (scale - 1 + transform.k) / scale;
        }

        states.attr("transform", transform);
        circles.attr("cx", function (d) {
            var projectedX = projection([d.longitude, d.latitude])[0];
            return transform.applyX(projectedX);
        }).attr("cy", function (d) {
            var projectedY = projection([d.longitude, d.latitude])[1];
            return transform.applyY(projectedY);
        }).attr("r", function (d) {
            return scaleTransform(radius(d.num_records));
        });

        // resize the legend
        var newLegendWidth = scaleTransform(legendWidth, 11);
        var newLegendHeight = scaleTransform(legendHeight, 11);
        svg.selectAll(".legend")
            .attr("transform", "translate(" + (w - newLegendWidth) + "," + (h - newLegendHeight) + ")");
        svg.selectAll(".legend rect")
            .attr("width", newLegendWidth)
            .attr("height", newLegendHeight);

        svg.selectAll(".legendCircle")
            .attr("r", function (d) {
                return scaleTransform(radius(d));
            })
            .attr("cy", function (d) {
                return newLegendHeight / 2 - scaleTransform(radius(d)) + scaleTransform(radius(maxLegend));
            }).attr("cx", newLegendWidth / 2 - 4);
        svg.selectAll(".legendLabel")
            .attr("y", function (d, i) {
                return newLegendHeight / 2 + (newLegendHeight / 4) * (1 - i);
            }).attr("x", newLegendWidth / 2 + scaleTransform(radius(maxLegend)) + 5)
        svg.select("#legendTitle")
            .attr("y", newLegendHeight - 5)
            .attr("x", 5);

    }

    function zoomButtonClick(zoomLevel) {
        zoom.scaleBy(svg.transition(), zoomLevel);
    }

    function makeLegend(cityData) {
        maxLegend = d3.max(cityData, function (d) {
            return d.num_records;
        });
        var toShow = [1, maxLegend / 2, maxLegend];

        var legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(" + (w - legendWidth) + "," + (h - legendHeight) + ")");
        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .text("Hello!");

        legend.selectAll("circle")
            .data(toShow)
            .enter().append("circle")
            .attr("class", "legendCircle")
            .attr("cy", function (d) {
                return legendHeight / 2 - radius(d) + radius(maxLegend);
            })
            .attr("cx", function (d, i) {
                return legendWidth / 2 - 5;
            })
            .attr("r", function (d) {
                return radius(d);
            });
        legend.selectAll("text")
            .data(toShow)
            .enter().append("text")
            .attr("class", "legendLabel")
            .attr("y", function (d, i) {
                return legendHeight / 2 + (legendHeight / 4) * (1 - i);
            })
            .attr("x", legendWidth / 2 + radius(maxLegend) + 5)
            .html(function (d) {
                return d;
            });
        legend.append("text")
            .attr("id", "legendTitle")
            .attr("y", legendHeight - 5)
            .attr("x", 5)
            .html("Number of Victims");
    }
}());
