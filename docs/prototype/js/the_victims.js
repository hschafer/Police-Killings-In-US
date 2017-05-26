const d3 = require('d3');
const fuse = require('fuse.js');

(function () {

    const START_DATE = new Date(getDateString("2015-01-01"));
    const END_DATE = new Date(getDateString("2017-04-15")); // max date in dataset
    const MAX_AGE = 91;
    const MIN_AGE = 6;

    // stupid
    const MONTH = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const RACE = {
        "W": "White",
        "B": "African American",
        "H": "Hispanic",
        "N": "Native American",
        "A": "Asian",
        "O": "Other",
        "U": "Unknown"
    };

    const GENDER = {
        "M": "Male",
        "F": "Female"
        // no 'other' in guardian dataset :/
    };

    function getDateString(intended_date) {
        return intended_date + " 00:00:00"; // by default assume all happened at midnight
    }

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
    var tooltipDiv;
    var clickedCity = null;
    var victimSymbols;
    var cities;
    var currentVisible;
    var stateVictimCount;
    var fuzzy; // fuse instance for fuzzy search

    var projection = d3.geoAlbersUsa()
        .translate([w / 2, h / 2])
        .scale([scale]);

    var path = d3.geoPath()
        .projection(projection);

    var MAX_ZOOM = 30;
    var zoomLevel = 1;
    var zoom = d3.zoom()
        .scaleExtent([1, MAX_ZOOM])
        .on("zoom", zoomed);

    // Transforms the given radius at the given zoom level
    // to be reduced by scale. The reduction is tricky
    // because it transforms the scale from zoomLevel=1x to
    // radius=1xd to zoomLevel=Zx to radius=Zxd/scale
    function radiusTransform(d, scale) {
        scale = (typeof scale === "undefined") ? 8 : scale;
        return d * (scale - 1 + zoomLevel) / scale;
    }

    var MAX_RADIUS = 10;
    var radius;

    var legendWidth = 100;
    var legendHeight = 100;
    var maxLegend = -1;

    var visible = {
        startDate: START_DATE,
        endDate: END_DATE,
        ethnicity: {
            "African American": true,
            "Asian": true,
            "Hispanic": true,
            "Native American": true,
            "Other": true,
            "Unknown": true,
            "White": true
        },
        gender: {
            "Male": true,
            "Female": true,
            "Other": true
        },
        armed: {
            "Armed": true,
            "Unarmed": true
        },
        mental: {
            "Showed signs": true,
            "Did not show signs": true
        },
        startAge: MIN_AGE,
        endAge: MAX_AGE
    };


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

        stateVictimCount = new Map();
        cities = cityData;
        cityData = cityData.sort(function (a, b) {
            return d3.descending(a.num_records, b.num_records);
        });

        for (var city = 0; city < cityData.length; city++) {
            var cityInfo = cityData[city];
            var state = cityInfo.state.trim()
            var numVictims = cityInfo.records.length;

            if (!stateVictimCount.has(state)) {
                stateVictimCount.set(state, 0);
            }
            stateVictimCount.set(state, stateVictimCount.get(state) + numVictims);
            // use these for map
            cityInfo.num_records_visible = cityInfo.num_records;
            cityInfo.records_visible = cityInfo.records.slice();
            cityInfo.index = city;
        }

        // Set up fuzzy searching
        var fuse_options = {
          shouldSort: true,
          threshold: 0.3,
          location: 0,
          distance: 100,
          maxPatternLength: 32,
          minMatchCharLength: 1,
          keys: [
            "city",
            "state"
        ]
        };
        fuzzy = new fuse(cityData, fuse_options);

        // Bind fuzzy searching to the search box, select first result
        $('#cityNameAndSearch').on('focus', function () {
          disableRandomWalk();
          $('#cityNameAndSearch').val("");
        });
        $('#cityNameAndSearch').on('input', function () {
          disableRandomWalk();
          var foundCities = fuzzy.search($('#cityNameAndSearch').val());
          if (foundCities.length > 0) {
            // Populate results list, "enter" should select
            // first result
            displayAutoComplete(foundCities);
          }
        });

        // Get rid of all autocomplete results
        function clearAutoComplete() {
          $('.autoCompleteResult').remove();
        }

        // Display autocomplete results as h6's which select their respective
        // city when clicked
        function displayAutoComplete(foundCities) {
          clearAutoComplete();
          for (var i = 0; i < Math.floor(Math.min(foundCities.length, 5)); i++) {
            var cityName = foundCities[i].city + ", " + foundCities[i].state;
            var result = $('<h6></h6>').addClass('autoCompleteResult').html(cityName);
            result.attr('cityIndex', foundCities[i].index);
            result.on('click', function (d) {
              clearAutoComplete();
              var cityIndex = d.target.getAttribute('cityIndex');
              deselectCity();
              selectCity(cityData[cityIndex]);
              clickedCity = cityData[cityIndex];
              cityZoom(cityData[cityIndex]);
            });
            $('#cityTipDiv').append(result).show();
          }
        }

        radius = d3.scaleSqrt()
            .domain([0, d3.max(cityData, function (d) { return d.num_records_visible; })])
            .range([0, MAX_RADIUS]);

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

        // append map SVG
        svg = svgContainer.append("svg")
            .attr("width", w)
            .attr("height", h)
            .attr("class", "mapSVG")
            .call(zoom)
            .on("wheel.zoom", null); // disable wheel zooming by default

        // disable body scrolling while inside SVG container
        svgContainer.on("mouseenter",
            function () {
                document.body.style.overflow = 'hidden';
                svg.call(zoom);
            })
            .on("mouseleave",
                function () {
                    document.body.style.overflow = 'auto';
                    svg.on("wheel.zoom", null);
                });

        svg.append("rect")
            .attr("class", "backgroundRect")
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
            .on("click", clicked) //;
            .on("mouseover", function (d) {
                if (!clickedCity) {
                    clearAutoComplete();
                    selectState(d);
                }
            })
            .on("mouseout", function (d) {
                if (!clickedCity) {
                    deselectCity();
                }
            });

        // style map filters
        d3.select("#victimMapFilters")
            .attr("height", h * (1.0 / 3) + "px");

        var citySymbols = svg.selectAll(".symbol")
            .data(cities, function(d) { return d.id; })
            .enter()
            .append("circle")
            .attr("class", "symbol")
            .attr("id", function (d) {
                return getCityID(d.city, d.state);
            })
            .attr("cx", function (d) {
                return projection([d.longitude, d.latitude])[0];
            })
            .attr("cy", function (d) {
                return projection([d.longitude, d.latitude])[1];
            })
            .attr("r", mapSymbolRadius)
            .on("click", function(d) {
                var clicked = clickedCity;
                deselectCity();
                if (d !== clicked) {
                    selectCity(d);
                    clickedCity = d;
                }
            })
            .on("mouseover", function (d) {
                // If we are currently clicked on a city, don't show on sidebar
                if (!clickedCity) {
                    selectCity(d);
                }

                // even if we have a city clicked, set tooltip
                if (d.records_visible.length > 0) {
                    var xPadding = 20;
                    var yPadding = 30;

                    var x = d3.event.pageX;
                    var y = d3.event.pageY;

                    tooltipDiv.style("opacity", .9);

                    // set the text first so we can figure out the width
                    tooltipDiv.append("h2")
                        .html(d.city + ", " + d.state);

                    // adjust the x if the tooltip would go over the edge
                    var width = $(".tooltip").width();
                    var deltaX;
                    if (x + xPadding + width > w) {
                        deltaX = -(xPadding + width);
                    } else {
                        deltaX = xPadding;
                    }
                    tooltipDiv.style("left", x + deltaX +  "px")
                        .style("top", y - yPadding + "px")

                    // TODO: Should we do this for y as well? It seems much more
                    // difficult because y is in terms of the *whole* page so it
                    // would be much harder to compute. Not having the adjustment
                    // isn't a huge deal because it doesn't occlude the bar on the right
                }
            })
            .on("mouseout", function (d) {
                // tooltip
                tooltipDiv.style("opacity", 0);
                tooltipDiv.selectAll("h2").remove();

                // Only remove sidebar info if we are not clicked
                if (!clickedCity) {
                    deselectCity();
                }
            });

        //set up filters
        formatDateSlider(d3.select("#victimDateFilter"), cityData, victimSymbols);
        formatAgeSlider();
        handleFilterClicks();

        tooltipDiv = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        randomSelection(cityData); // make it happen right away
        var timer = setInterval(randomSelection, 3000, cityData);

        function enableRandomWalk() {
            // only random walk if we didn't click on a city
            if (!clickedCity) {
                timer = setInterval(randomSelection, 3000, cityData);
            }
        }

        function disableRandomWalk() {
            if (timer) {
                d3.select("#highlightedCityDuplicate").remove();
                clearInterval(timer);
                deselectCity();
                timer = null;
            }
        }

        svg.on("mouseenter", disableRandomWalk);
        svg.on("mouseleave", enableRandomWalk);

        makeLegend(cityData);

        // kind of hacky
        // we have to do this last to get the position of the mapInfo sidebar
        var containerWidth = parseFloat(d3.select("#section2Container").style("width"));
        var mapWidth = parseFloat(d3.select("#usSvgContainer").select("svg").attr("width"));
        d3.select("#hoverDirections").style("width", function () {
            var result = containerWidth
                - mapWidth - parseFloat(d3.select(".mapInfo").style("padding-left"));
            return result + "px";
        });

    }

    function getCityID(city, state) {
        return city.replace(/ |'|,/g, '')
            + state.replace(/ |'|,/g, '') + "_symbol";
    }

    function mapSymbolRadius(d) {
        return radiusTransform(radius(d.num_records_visible));
    }

    function update() {

        // use if we need to check date bounds of dataset
        //var maxDate = new Date("2015-01-01");
        //var minDate = new Date("2016-01-01");
        var maxAge = 0;
        var minAge = 100000;

        for (var city = 0; city < cities.length; city++) {
            var filtered = cities[city].records.filter(function (d) {
                // filter on date
                var date = new Date(d.date);

                var pass = date >= visible.startDate && date <= visible.endDate;

                // filter on ethnicity
                if (d.race != "") {
                    pass &= visible.ethnicity[RACE[d.race]];
                } else {
                    pass &= visible.ethnicity["Unknown"];
                }

                // filter on gender
                pass &= visible.gender[GENDER[d.gender]];

                // filter on armed status
                pass &= (visible.armed["Armed"] && (d.armed != "unarmed")) ||
                    (visible.armed["Unarmed"] && (d.armed == "unarmed"));

               // filter on signs of mental illness
                pass &= (visible.mental["Showed signs"] && (d.signs_of_mental_illness == "True")) ||
                    (visible.mental["Did not show signs"] && (d.signs_of_mental_illness == "False"));

                // filter on age
                pass &= (d.age <= visible.endAge) && (d.age >= visible.startAge);

                return pass;
            });

            // now we have filtered records for the current city
            // set the records visible
            cities[city].num_records_visible = filtered.length;
            cities[city].records_visible = filtered;
        }

        svg.selectAll(".symbol")
            .transition()
            .attr("r", mapSymbolRadius);

        // Making the assumption that we can't hover over city and update at the same time
        // we only need to update the list of victims on the right if something is clicked
        if (clickedCity) {
            var clicked = clickedCity;
            deselectCity();
            clickedCity = clicked;
            selectCity(clicked);
        }
    }

    function formatDateSlider(parent, cityData, victimSymbols) {

        var margin = {right: 50, left: 50},
            width = (parseInt(d3.select("#victimDateFilter").style("width"), 10) * 3.0 / 4),
            height = 50;

        var x = d3.scaleTime()
            .domain([START_DATE, END_DATE])
            .range([0, width])
            .clamp(true);

        var slider = d3.select("#dateSliderGroup");

        d3.select("#dateSliderLine")
            .attr("x1", x.range()[0])
            .attr("x2", x.range()[1]);

        d3.select("#date_track_inset")
            .attr("x1", x.range()[0])
            .attr("x2", x.range()[1]);

        var lowerRangeConstant = x.range()[0];

        d3.select("#date-track-inset-selected-region")
            .attr("x1", function (d) {
                return lowerRangeConstant;
            })
            .attr("x2", function (d) {
                return x.range()[1];
            });

        d3.select("#dateFilterLabelLower")
            .attr("x", x.range()[0])
            .text(MONTH[START_DATE.getMonth()] +
                " " + START_DATE.getFullYear());

        d3.select("#dateFilterLabelUpper")
            .attr("x", x.range()[1])
            .text(MONTH[END_DATE.getMonth()] +
                " " + END_DATE.getFullYear());

        // make handle drag behavior
        var lowerHandleDrag = d3.drag()
            .on('drag', function () {

                // if handle is within expected area, move it to where it is being
                // dragged to and update viz (this check prevents user from dragging
                // handle off of track or in front of upper handle)
                var upperHandleX = parseInt(d3.select("#upperDateFilterHandle").attr("cx")) - 15;
                var selectedRegion = d3.select("#date-track-inset-selected-region");
                var leftXBound;
                if (d3.event.x < x.range()[0]) {
                    leftXBound = x.range()[0];
                } else if (d3.event.x > upperHandleX) {
                    leftXBound = upperHandleX
                } else {
                    leftXBound = d3.event.x;
                }
                lowerHandle.attr('cx', leftXBound);

                // move selected region in slider
                selectedRegion.attr("x1", leftXBound);

                // update handle tooltip
                d3.select("#dateFilterLabelLower")
                    .attr("x", leftXBound)
                    .text(MONTH[x.invert(leftXBound).getMonth()] + " "
                        + x.invert(leftXBound).getFullYear());

                // set global "visible" data
                var lowerHandleDate = new Date(x.invert(leftXBound));
                visible.startDate = lowerHandleDate;
                update();
            });

        var upperHandleDrag = d3.drag()
            .on('drag', function () {
                var lowerHandleX = parseInt(d3.select("#lowerDateFilterHandle").attr("cx"), 10) + 15;
                var selectedRegion = d3.select("#date-track-inset-selected-region");
                var upperXBound;
                if (d3.event.x > x.range()[1]) {
                    upperXBound = x.range()[1];
                } else if (d3.event.x < lowerHandleX) {
                    upperXBound = lowerHandleX;
                } else {
                    upperXBound = d3.event.x;
                }
                upperHandle.attr('cx', upperXBound);

                // update tooltip
                d3.select("#dateFilterLabelUpper")
                    .attr("x", upperXBound)
                    .text(MONTH[x.invert(upperXBound).getMonth()] + " "
                        + x.invert(upperXBound).getFullYear());

                selectedRegion.attr("x2", upperXBound);

                var upperHandleDate = new Date(x.invert(upperXBound));
                visible.endDate = upperHandleDate;
                update();
            });

        var lowerHandle = slider.append("circle", "#date-track-overlay")
            .attr("id", "lowerDateFilterHandle")
            .attr("class", "dateFilterHandle")
            .attr("r", 9)
            .call(lowerHandleDrag);

        var upperHandle = slider.append("circle", "#date-track-overlay")
            .attr("id", "upperDateFilterHandle")
            .attr("class", "dateFilterHandle")
            .attr("cx", x.range()[1])
            .attr("r", 9)
            .call(upperHandleDrag);
    }

    function formatAgeSlider() {

        var width = (parseInt(d3.select("#victimAgeFilter").style("width"), 10) * 3.0 / 4);

        var x = d3.scaleLinear()
            .domain([MIN_AGE, MAX_AGE])
            .range([0, width])
            .clamp(true);

        var slider = d3.select("#ageSliderGroup");

        d3.select("#ageSliderLine")
            .attr("x1", x.range()[0])
            .attr("x2", x.range()[1]);

        d3.select("#age-track-inset")
            .attr("x1", x.range()[0])
            .attr("x2", x.range()[1]);

        var lowerRangeConstant = x.range()[0];

        d3.select("#age-track-inset-selected-region")
            .attr("x1", function (d) {
                return lowerRangeConstant;
            })
            .attr("x2", function (d) {
                return x.range()[1];
            });

        d3.select("#ageFilterLabelLower")
            .attr("x", x.range()[0])
            .text(MIN_AGE + "");

        d3.select("#ageFilterLabelUpper")
            .attr("x", x.range()[1])
            .text(MAX_AGE + "");

        // make handle drag behavior
        var lowerHandleDrag = d3.drag()
            .on('drag', function () {

                // if handle is within expected area, move it to where it is being
                // dragged to and update viz (this check prevents user from dragging
                // handle off of track or in front of upper handle)
                var upperHandleX = parseInt(d3.select("#upperAgeFilterHandle").attr("cx")) - 15;
                var selectedRegion = d3.select("#age-track-inset-selected-region");
                var leftXBound;
                if (d3.event.x < x.range()[0]) {
                    leftXBound = x.range()[0];
                } else if (d3.event.x > upperHandleX) {
                    leftXBound = upperHandleX
                } else {
                    leftXBound = d3.event.x;
                }
                lowerHandle.attr('cx', leftXBound);

                // move selected region in slider
                selectedRegion.attr("x1", leftXBound);

                // update handle tooltip
                d3.select("#ageFilterLabelLower")
                    .attr("x", leftXBound)
                    .text(Math.round(x.invert(leftXBound)));

                // set global "visible" data
                visible.startAge = Math.round(x.invert(leftXBound));
                update();
            });

        var upperHandleDrag = d3.drag()
            .on('drag', function () {
                var lowerHandleX = parseInt(d3.select("#lowerAgeFilterHandle").attr("cx"), 10) + 15;
                var selectedRegion = d3.select("#age-track-inset-selected-region");
                var upperXBound;
                if (d3.event.x > x.range()[1]) {
                    upperXBound = x.range()[1];
                } else if (d3.event.x < lowerHandleX) {
                    upperXBound = lowerHandleX;
                } else {
                    upperXBound = d3.event.x;
                }
                upperHandle.attr('cx', upperXBound);

                // update tooltip
                d3.select("#ageFilterLabelUpper")
                    .attr("x", upperXBound)
                    .text(Math.round(x.invert(upperXBound)));

                selectedRegion.attr("x2", upperXBound);

                visible.endAge = Math.round(x.invert(upperXBound));
                update();
            });

        var lowerHandle = slider.append("circle", "#age-track-overlay")
            .attr("id", "lowerAgeFilterHandle")
            .attr("class", "ageFilterHandle")
            .attr("cx", x.range()[0])
            .attr("r", 9)
            .call(lowerHandleDrag);

        var upperHandle = slider.append("circle", "#age-track-overlay")
            .attr("id", "upperAgeFilterHandle")
            .attr("class", "ageFilterHandle")
            .attr("cx", x.range()[1])
            .attr("r", 9)
            .call(upperHandleDrag);
    }

    function handleFilterClicks() {
        d3.selectAll(".EthnicityCheckboxItem input").on("click", function () {
            if (visible.ethnicity[this.name]) {
                visible.ethnicity[this.name] = false;
            } else {
                visible.ethnicity[this.name] = true;
            }
            update();
        });

        d3.selectAll(".genderCheckboxItem input").on("click", function() {
            if (visible.gender[this.name]) {
                visible.gender[this.name] = false;
            } else {
                visible.gender[this.name] = true;
            }
            update();
        });

        d3.selectAll(".armedCheckedItem input").on("click", function() {
            if (visible.armed[this.name]) {
                visible.armed[this.name] = false;
            } else {
                visible.armed[this.name] = true;
            }
            update();
        });

        d3.selectAll(".mentalCheckedItem input").on("click", function() {
            if (visible.mental[this.name]) {
                visible.mental[this.name] = false;
            } else {
                visible.mental[this.name] = true;
            }
            update();
        })
    }

    function randomSelection(cityData) {
        // Clear out search bar
        $('#citySearch').val("");

        var svg = d3.select(".mapSVG");
        var svgContainer = $(".mapSVG")[0];

        var visibleCitySymbols = $(".symbol").filter(function (index) {
          return (this.cx.animVal.value < svgContainer.width.animVal.value) &&
                 (this.cx.animVal.value > 0) &&
                 (this.cy.animVal.value < svgContainer.height.animVal.value) &&
                 (this.cy.animVal.value > 0) &&
                 (this.__data__.num_records_visible > 0);
        });

        if (visibleCitySymbols.length > 0) {
            var randSymbol = visibleCitySymbols[Math.floor(Math.random() * visibleCitySymbols.length)];
            var randCity = randSymbol.__data__;

            // Note: This is a different highlighting strategy than clicking.
            // We want this bubble to be on the top so it's easier to just make a duplicate
            var circle = svg.selectAll("#highlightedCityDuplicate").data([randCity]);
            circle.enter().append('circle')
                .attr("id", "highlightedCityDuplicate")
                .attr("class", "symbol")
                .merge(circle)
                .transition().duration(1500)
                .attr("cx", randSymbol.cx.animVal.value)
                .attr("cy", randSymbol.cy.animVal.value)
                .attr("r", randSymbol.r.animVal.value);
            circle.exit().remove();

            // Important, don't highlight it now on the map because then there will be
            // two dots, but do change the content on the right.
            deselectCity();
            selectCity(randCity, false);
            setTimeout(function() {
                d3.selectAll(".symbol")
                    .filter(function(d) { return d === randCity; })
                    .classed("highlightedCity", true);
            }, 1500);
        }
    }

    function selectState(d) {
        $("#cityNameAndSearch").val(d.properties.name);
        var victimList = d3.select("#victimList");
        victimList.append("li").html("Hover over a city to get specific victim names");
        // Uses abbreviation because the city file uses abbreviations
        setVictimCount(stateVictimCount.get(d.properties.abbreviation));
    }

    function selectCity(city, highlightOnMap) {
        highlightOnMap = typeof(highlightOnMap) === "undefined" ? true : highlightOnMap; // default true

        $("#cityNameAndSearch").val(city.city + ", " + city.state);

        // add victims
        var victimsList = d3.select("#victimList");
        for (var person = 0; person < city.records_visible.length; person++) {
            victimsList.append("li").html(city.records_visible[person].name);
        }

        setVictimCount(city.records_visible.length);

        // highlight the city
        if (highlightOnMap) {
            d3.selectAll(".symbol")
                .filter(function(d) { return d === city; })
                .classed("highlightedCity", true);
        }
    }

    function deselectCity() {
        setVictimCount(0);

        var listNodes = d3.select("#victimList").selectAll("*");
        listNodes.remove();

        // unhighlight city, don't delete the node, just remove id
        d3.selectAll(".highlightedCity")
            .classed("highlightedCity", false);
        clickedCity = null;
    }

    function setVictimCount(count) {
        var label = "Victims"
        if (count) {
            label += " ( " + count + " )";
        }
        d3.selectAll("#victimsLabel").html(label);
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
        zoomLevel = transform.k;

        states.attr("transform", transform);
        circles.attr("cx", function (d) {
            var projectedX = projection([d.longitude, d.latitude])[0];
            return transform.applyX(projectedX);
        }).attr("cy", function (d) {
            var projectedY = projection([d.longitude, d.latitude])[1];
            return transform.applyY(projectedY);
        }).attr("r", function (d) {
            return mapSymbolRadius(d);
        });

        // resize the legend
        var newLegendWidth = radiusTransform(legendWidth, 20);
        var newLegendHeight = radiusTransform(legendHeight, 20);
        drawLegend(newLegendWidth, newLegendHeight);
    }

    function zoomButtonClick(zoomLevel) {
        zoom.scaleBy(svg.transition(), zoomLevel);
    }

    function makeLegend(cityData) {
        var toShow = [1, 10, 20, 30];
        maxLegend = toShow[toShow.length - 1];

        // First: Set up static parts of the legend

        // set up the outer elements
        var legend = svg.append("g")
            .attr("class", "legend")
        legend.append("rect");

        legend.selectAll("circle")
            .data(toShow)
            .enter().append("circle")
            .attr("class", "legendCircle");

        legend.selectAll("text")
            .data(toShow)
            .enter().append("text")
            .attr("class", "legendLabel")
            .html(function (d) { return d; });

        legend.append("text")
            .attr("id", "legendTitle")
            .attr("text-anchor", "middle")
            .attr("x", legendWidth / 2)
            .html("Number of Victims");

        drawLegend(legendWidth, legendHeight, 1);
    }

    function drawLegend(legendWidth, legendHeight) {
        svg.selectAll(".legend")
            .attr("transform", "translate(" + (w - legendWidth) + "," + (h - legendHeight) + ")");
        svg.selectAll(".legend rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight);

        // place circles in middle of legend so the are concentric
        svg.selectAll(".legendCircle")
            .attr("r", function (d) {
                return radiusTransform(radius(d));
            })
            .attr("cy", function (d) {
                // bottom of outermost circle - this circles radius
                return legendHeight / 2 + radiusTransform(radius(maxLegend)) - radiusTransform(radius(d));
            }).attr("cx", legendWidth / 2 - 5); // middle of legend with offset

        // put text next to circles
        svg.selectAll(".legendLabel")
            .attr("y", function (d, i) {
                // this makes the numbers look nicely spaced
                var padding = (10 - 5 * (i + 1)) * (MAX_ZOOM - zoomLevel) / MAX_ZOOM;
                return legendHeight / 2 + radiusTransform(radius(maxLegend))
                    - 2 * radiusTransform(radius(d)) + padding;
            }).attr("x", legendWidth - 20);

        // put label on bottom
        svg.select("#legendTitle")
            .attr("y", legendHeight - 5);
    }
}());
