const d3 = require('d3');
require('waypoints/lib/jquery.waypoints.js');


// to reduce scopes of variables and functions that are unnecessary
(function() {
  var TIME_PER_PERSON = 20;
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
    setTimeout(highlightPeople, 1500 + 100 * TIME_PER_PERSON);
  }

  function highlightPeople() {
    d3.selectAll(".personToHighlight")
      .transition()
      .duration( function(d, i) {
        return i * TIME_PER_PERSON;
      })
      .delay( function(d, i) { return i * TIME_PER_PERSON; })
      .attr("class", "fa fa-male highlighted");

    setTimeout(function() { showLabel("#fbiBracket", "#fbiBracketLabel", 0.45); },
        100 * 0.45 * TIME_PER_PERSON);

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

    setTimeout(function() { showLabel("#wapoBracket", "#wapoBracketLabel", 1.0); },
        100 * TIME_PER_PERSON);
  }

  function showLabel(bracketId, bracketLabelId, percentOfWidth) {
      var peopleWidth = $("#people").width();
      var bracket = $(bracketId);
      bracket.width(percentOfWidth * peopleWidth);
      bracket.fadeIn();

      var bracketLabel = $(bracketLabelId);
      bracketLabel.width(percentOfWidth * peopleWidth);
      bracketLabel.fadeIn();
  }
}());
