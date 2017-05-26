const d3 = require('d3');

var TIME_PER_PERSON = 20;
var RED = "#DB3A34";

// make people visible and highlight them w/ correct delays
function drawPeople() {
  setTimeout(showPeople, 750);
  setTimeout(highlightPeople, 750 + 100 * TIME_PER_PERSON + 100);
}

function highlightPeople() {
  console.log("highlight");
  d3.selectAll(".personToHighlight")
    .transition()
    .duration( function(d, i) {
      return i * TIME_PER_PERSON;
    })
    .delay( function(d, i) { return i * TIME_PER_PERSON; })
    .attr("style", "color: RED");
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
}

// to reduce scopes of variables and functions that are unnecessary
(function() {
  var width = 20;
  var height = 5;

  $(document).ready(function() {
      genPeople(width, height);
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
}());

// to use in main
module.exports = {
    drawPeople: drawPeople
};
