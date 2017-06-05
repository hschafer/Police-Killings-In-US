const d3 = require('d3');
require('waypoints/lib/jquery.waypoints.js');


// to reduce scopes of variables and functions that are unnecessary
(function() {
    var TIME_PER_PERSON = 20;
    var NUM_PEOPLE = 100;
    var PERCENT_REPORTED = 0.45;
    var NUM_REPORTED = NUM_PEOPLE * PERCENT_REPORTED;

    var width = 20;
    var height = 5;

    $(document).ready(function() {
        genPeople(width, height);
        // timeout because of the way fullpage loads sections
        setTimeout(function() {
            var waypoint = new Waypoint({
                element: $("#fbiSectionContainer"),
                handler: function() {
                    drawPeople();
                    waypoint.disable();
                },
                offset: 300
            });}, 1000
        );
    });

    // create people but make them invisible
    function genPeople(w, h) {
        var e = document.getElementById("people");
        var totalCount = 0;
        for(var i = 0; i < h; i++){
            var row = document.createElement("div");
            row.className = "row";
            row.id = "row" + i;
            for(var j = 0; j < w; j++){
                var person = document.createElement("i");
                person.className = "fa fa-male";
                person.id = "person" + totalCount;
                person.style = "visibility:hidden";
                person.visible = "false";
                // Select 45 of the people
                if (j < 9) {
                    person.className = "fa fa-male personToHighlight";
                }
                totalCount += 1;
                row.appendChild(person);
            }
            e.appendChild(row);
        }
    }

    // make people visible and highlight them w/ correct delays
    function drawPeople() {
        setTimeout(showPeople, 750);
        setTimeout(highlightPeople, 1500 + NUM_PEOPLE * TIME_PER_PERSON);
    }

    function highlightPeople() {
        d3.selectAll(".personToHighlight")
            .transition()
            .duration( function(d, i) {
                return i * TIME_PER_PERSON;
            })
            .delay( function(d, i) { return i * TIME_PER_PERSON; })
            .attr("class", "fa fa-male highlighted");

        highlightText("#fbiNumberText", "#fbiNumberTextHighlight", NUM_REPORTED * TIME_PER_PERSON);

        setTimeout(function() { showLabel("#fbiBracket", "#fbiBracketLabel", PERCENT_REPORTED); },
            NUM_REPORTED * TIME_PER_PERSON);
        setTimeout(function() { showLegend(); }, 1500);
    }

    // make people visible
    function showPeople() {
        d3.selectAll(".fa-male")
            .transition()
            .duration( function(d, i) {
                return i * TIME_PER_PERSON;
            })
            .delay( function(d, i) { return i * TIME_PER_PERSON; })
            .attr("style", "visibility:visible");

        highlightText("#wapoNumberText", "#wapoNumberTextHighlight", NUM_PEOPLE * TIME_PER_PERSON);
        setTimeout(function() { showLabel("#wapoBracket", "#wapoBracketLabel", 1.0); },
            NUM_PEOPLE * TIME_PER_PERSON);
    }

    function highlightText(sourceSpanId, targetSpanId, duration) {
        var sourceSpan = d3.select(sourceSpanId);
        var targetSpan = d3.select(targetSpanId);
        var originalText = sourceSpan.html();
        sourceSpan.transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .tween("text", function() {
                return function(t) {
                    var stopIndex = Math.round(t * originalText.length);
                    targetSpan.html(originalText.substr(0, stopIndex));
                    sourceSpan.html(originalText.substr(stopIndex, originalText.length));
                };
            });
    }

    function showLabel(bracketId, bracketLabelId, percentOfWidth) {
        var peopleWidth = $("#people").width();
        $(".labelContainer").width(peopleWidth);

        var bracket = $(bracketId);
        bracket.width(percentOfWidth * peopleWidth);
        bracket.fadeIn();

        var bracketLabel = $(bracketLabelId);
        bracketLabel.width(percentOfWidth * peopleWidth);
        bracketLabel.fadeIn();
    }

    function showLegend() {
        var peopleLegend = $("#peopleLegend");
        peopleLegend.fadeIn();
    }
}());
