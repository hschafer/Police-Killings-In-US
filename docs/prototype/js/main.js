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

var svg = null; // global for callbacks
var activeState = d3.select(null);
var tooltipActive = null;

var projection = d3.geoAlbersUsa()
    .translate([w / 2, h / 2])
    .scale([scale]);

var path = d3.geoPath()
        .projection(projection);

var zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

$(document).ready(function () {
    $('#fullpage').fullpage({
        autoScrolling: false,
        navigation: true,
        navigationPosition: 'left',
        menu: '#menu'
    });

    // NOTE: d3.geo functions all have new syntax as of D3 4.0 release
    // d3.geo.albersUsa() call from example site is now d3.geoAlbersUsa
    // see details of recent changes here: https://github.com/d3/d3/blob/master/CHANGES.md
    d3.queue()
        .defer(d3.json, "data/us-states.json")
        .defer(d3.json, "data/condensed_data.json")
        .await(ready);
});

function ready(error, us, cityData) {
    if (error) throw error;

    // append title for map
    var section2Container =  d3.select("#section2")
        .select(".fp-tableCell")
        .append("div")
        .attr("id", "section2Container");

    var section2HeaderRow = section2Container.append("div")
        .attr("id", "section2HeaderRow")
        .attr("class", "sectionRow");

    section2HeaderRow.append("div")
        .attr("class", "sectionTitle")
        .html("Police Killings in the United States")
        .append("p")
        .attr("class", "sectionSubtitle")
        .html("Every fatal shooting " +
            "in the United States by a police " +
            "officer in the line of duty since Jan. 1, 2015");

    var hoverDirections = section2HeaderRow.append("div")
        .attr("id", "hoverDirections");

    hoverDirections.append("p")
        .attr("class", "directionsParagraph")
        .attr("id", "zoomDirection")
        .html("Click anywhere to zoom.");

    hoverDirections.append("p")
        .attr("class", "directionsParagraph")
        .html("Hover over any city to see details.");

    var section2Row = section2Container
        .append("div")
        .attr("class", "sectionRow");

    var radius = d3.scaleSqrt()
        .domain([0, d3.max(cityData, function(d) { return d.num_records; })])
        .range([0, 15]);

    var svgContainer = section2Row.append("div")
        .attr("id", "usSvgContainer");

    svg = svgContainer.append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("class", "mapSVG");

	svg.append("rect")
        .attr("id", "background")
        .attr("width", w)
        .attr("height", h)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(zoom);

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
        })
        .on("click", function(d) {
        });

	svg.call(zoom);


    var mapInfo = section2Row.append("div")
        .attr("class", "mapInfo");

    var cityTip = mapInfo.append("div")
        .attr("id", "cityTip");

    cityTip.append("h5")
        .attr("id", "cityLabel")
        .html("City");

    cityTip.append("h2")
        .attr("id", "cityName")
        .classed("invisibleText", true)
        .html("...");

     var cityVictims = mapInfo.append("div")
        .attr("id", "cityVictims");

    cityVictims.append("h5")
        .attr("id", "victimsLabel")
        .html("Victims");

    cityVictims.append("div")
        .attr("id", "victimListDiv")
        .append("ul")
        .attr("id", "victimList");

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
            .call( zoom.transform, zoomLevel);
}

function zoomed() {
  var transform = d3.event.transform;
  svg.selectAll("circle")
      .attr("cx", function(d) {
        var projectedX = projection([d.longitude, d.latitude])[0];
        return transform.applyX(projectedX);
      })
      .attr("cy", function(d) {
        var projectedY = projection([d.longitude, d.latitude])[1];
        return transform.applyY(projectedY);
      });
  svg.selectAll(".states")
      .attr("transform", transform);
}


