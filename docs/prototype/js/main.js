const topojson = require('topojson');
const d3 = require('d3');

// size rectangle that holds map
// proportional to window
// not using CSS (i.e. width: 80%) for these
// so that we can use the actual numerical values
// to scale map
var w = $(window).width() * (2.0 / 3);
var h = $(window).height() * (3.0 / 4);
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

$(document).ready(function () {
    $('#fullpage').fullpage({
        autoScrolling: false,
        fitToSection: false,
        navigation: true,
        navigationPosition: 'left',
        menu: '#menu'
    });

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

    cityData.sort(function(a, b) { d3.descending(a.num_records, b.num_records); });

    radius = d3.scaleSqrt()
        .domain([0, d3.max(cityData, function(d) { return d.num_records; })])
        .range([0, 15]);

    var section2Container =  d3.select("#section2Container");
    var section2HeaderRow = d3.select("#section2HeaderRow");
    var section2Row = d3.select(".sectionRow");
    var svgContainer = d3.select("#usSvgContainer");

    // attach event listeners for zooming
    svgContainer.select("#zoomIn")
        .on("click", function() { zoomButtonClick(3/2); });
    svgContainer.select("#zoomOut")
        .on("click", function() { zoomButtonClick(2/3); });

    // disable body scrolling while inside SVG container
    svgContainer.on("mouseover",
            function () { document.body.style.overflow = 'hidden'; })
        .on("mouseout",
            function() { document.body.style.overflow = 'auto'; });

    svg = svgContainer.append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("class", "mapSVG")
        .call(zoom);

	svg.append("rect")
        .attr("id", "background")
        .attr("width", w)
        .attr("height", h)
        .style("fill", "none")
        .style("pointer-events", "all")

    svg.selectAll("path")
        .data(us.features)
        .enter()
        .append("path")
        .attr("class", "states")
        .attr("d", path)
        .on("click", clicked);

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    svg.selectAll("circle")
        .data(cityData)
        .enter()
        .append("circle")
        .attr("class", "symbol")
        .attr("cx", function (d) { return projection([d.longitude, d.latitude])[0]; })
        .attr("cy", function (d) { return projection([d.longitude, d.latitude])[1]; })
        .attr("r",  function (d) { return radius(d.num_records); })
        .on("mouseover", function(d) {
            // remove invisibility
            d3.select("#cityName").classed("invisibleText", false);

            // set city  name
            d3.select("#cityName").html(d.city + ", " + d.state);

            // add victims
            var victimsList = d3.select("#victimList");
            for (var person = 0; person < d.records.length; person++) {
                victimsList.append("li").html(d.records[person].name);
            }

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
        .on("mouseout", function(d) {
            // tooltip
            div.style("opacity", 0);
            div.selectAll("h2").remove();
            tooltipActive = false;

            // apply invisibility
            d3.select("#cityName").classed("invisibleText", true);
            d3.select("#cityName").html("...");
            var listNodes = d3.select("#victimList").selectAll("*");
            listNodes.remove();
        });

    // kind of hacky
    // we have to do this last to get the position of the mapInfo sidebar
    d3.select("#hoverDirections").style("width", function() {
        var containerWidth = parseFloat(d3.select("#section2Container").style("width"));
        var mapWidth = parseFloat(d3.select("#usSvgContainer").select("svg").attr("width"));
        var result = containerWidth
            - mapWidth - parseFloat(d3.select(".mapInfo").style("padding-left"));
        return result + "px";
    });
}

function clicked(d) {
        activeState.classed("active", false);
        var zoomLevel;
        if (activeState.node() === this) {
    		// If it is a click on the same state, we want to zoom out
            activeState = d3.select(null);
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
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
            zoomLevel = d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale);
        }

    	svg.transition()
        	.duration(750)
            .call(zoom.transform, zoomLevel);
}

function zoomed() {
    var circles = svg.selectAll("circle");
    var states = svg.selectAll(".states");

    // If we are back at zoom level 1 then transition to center
    var transform = d3.event.transform;
    if (transform.k === 1) {
        transform.x = 0;
        transform.y = 0;
        circles = circles.transition(30);
        states = states.transition(30);
    }

    states.attr("transform", transform);
    circles.attr("cx", function(d) {
        var projectedX = projection([d.longitude, d.latitude])[0];
        return transform.applyX(projectedX);
    }).attr("cy", function(d) {
        var projectedY = projection([d.longitude, d.latitude])[1];
        return transform.applyY(projectedY);
    }).attr("r", function(d) {
        return radius(d.num_records) * (3 + transform.k) / 4;
    });
}

function zoomButtonClick(zoomLevel) {
    zoom.scaleBy(svg.transition(), zoomLevel);
}
