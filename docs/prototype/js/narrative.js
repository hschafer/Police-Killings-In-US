/**
 * Created by meredith on 5/30/17.
 */

require('waypoints/lib/jquery.waypoints.js');

(function () {
    $(document).ready(function () {
        setTimeout(function () {
                var waypoint1 = new Waypoint({
                    element: $("#narrative_section1"),
                    handler: function () {
                        typeInText("#narrative_section1");
                        waypoint1.disable();
                    },
                    offset: 300
                });

                var waypoint2 = new Waypoint({
                    element: $("#narrative_section2"),
                    handler: function () {
                        typeInText("#narrative_section2");
                        waypoint2.disable();
                    },
                    offset: 300
                });

                var waypoint3 = new Waypoint({
                    element: $("#narrative_section3"),
                    handler: function () {
                        typeInText("#narrative_section3");
                        waypoint3.disable();
                    },
                    offset: 300
                });

            }, 1000
        );
    });

    function typeInText(id_selector) {
        console.log("type text from" + id_selector + " now");
    }
}());
