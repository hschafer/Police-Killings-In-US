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
                element: $("#narrative_section"),
                handler: function () {
                    var totem_vivus = new vivus('narrative_section_svg', {start: 'autostart', duration: 500});

                    setTimeout(function() {
                        $("#totemCaption").fadeIn();
                        var totem_svg = d3.select("#narrative_section_svg g")
                            .transition()
                            .duration(1500)
                            .attr("fill", "black");
                        displayParagraphs(0, 2);
                    }, 1500);

                    totem_vivus.play();
                    $("#narrative_section_svg").removeClass("hidden");

                    waypoint1.disable();
                },
                offset: 300
            });

            var waypoint2 = new Waypoint({
                element: $("#narrative_section2"),
                handler: function () {

                    var badge_svg = d3.select("#narrative_section2_svg");
                    var badge_vivus = new vivus('narrative_section2_svg', {start: 'autostart', duration: 400});
                    badge_vivus.play();
                    $("#narrative_section2_svg").removeClass("hidden");

                    setTimeout(function() { displayParagraphs(3, 5); }, 1000);
                    waypoint2.disable();
                },
                offset: 300
            });
        }, 1000);
    });

    function displayParagraphs(start, stop) {
        console.log("test", start, stop);
        if (start <= stop) {
            $("#narrative_text" + start + " p").fadeIn('slow');
            setTimeout(function() { displayParagraphs(start + 1, stop); }, 1500);
        }
    }
}());

