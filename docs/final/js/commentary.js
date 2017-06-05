/**
 * Created by meredith on 6/4/17.
 */
/**
 * Created by meredith on 5/30/17.
 */
const d3 = require('d3');
const vivus = require('vivus');
require('waypoints/lib/jquery.waypoints.js');

(function () {
    $(document).ready(function () {

        setTimeout(function () {
            var waypoint1 = new Waypoint({
                element: $("#ethnicity_victims_transition"),
                handler: function () {

                    setTimeout(function() {
                        displayParagraphs(0, 1);
                    }, 1500);

                    waypoint1.disable();
                },
                offset: 300
            });
        }, 1000);
    });

    function displayParagraphs(start, stop) {
        console.log("in ethnicity victims handler");
        if (start <= stop) {
            //$("#narrative_text" + start + " p").fadeIn('slow');
            d3.select("#transition_text" + start + " p").transition().duration(1000).style("opacity", "1.0");
            setTimeout(function() { displayParagraphs(start + 1, stop); }, 1500);
        }
    }
}());

