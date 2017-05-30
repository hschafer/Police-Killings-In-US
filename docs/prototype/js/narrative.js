/**
 * Created by meredith on 5/30/17.
 */
const d3 = require('d3');
require('waypoints/lib/jquery.waypoints.js');

(function () {

    var narrative1_text = "One summer afternoon in Seattle, Washington " +
        "in 2010, Officer Ian Birk noticed a man crossing a city street " +
        "holding a knife. Officer Birk, a member of the Seattle Police " +
        "Department, left his vehicle to handle the situation. " ;

    var narrative2_text = "Officer Birk approached the man, commanding " +
        "him to put down the knife. 4 seconds later, Officer Birk had " +
        "fired four shots into the man, killing him.";

    var narrative3_text = "The man, John T. Williams, was a member of " +
        "the Nuu-chah-nulth tribal group native to nearby Vancouver Island. " +
        "He was a local woodcarver, hard of hearing, and was carrying a block of " +
        "wood and his carving knife.";

    $(document).ready(function () {
        setTimeout(function () {
                var waypoint1 = new Waypoint({
                    element: $("#narrative_section1"),
                    handler: function () {
                        typeInText("#narrative_section1 .narrative_text p", narrative1_text);
                        waypoint1.disable();
                    },
                    offset: 300
                });

                var waypoint2 = new Waypoint({
                    element: $("#narrative_section2"),
                    handler: function () {
                        typeInText("#narrative_section2 .narrative_text p", narrative2_text);
                        waypoint2.disable();
                    },
                    offset: 300
                });

                var waypoint3 = new Waypoint({
                    element: $("#narrative_section3"),
                    handler: function () {
                        typeInText("#narrative_section3 .narrative_text p", narrative3_text);
                        waypoint3.disable();
                    },
                    offset: 300
                });

            }, 1000
        );
    });

    function typeInText(id_selector, text) {
        console.log("type text from" + id_selector + " now");
        var p = d3.select(id_selector);
        var textLength = text.length;
        p.transition()
            .duration(4000)
            .ease(d3.easeLinear)
            .tween('text', function() {
                return function(t) {
                    var newText = text.substr(0,
                            Math.round( t * textLength));
                    d3.select(id_selector).html(newText);
                };
            });
            //.tween("text", function () {
            //    //debugger;
            //    //var textcontent = this.textContent;
            //    //var textLength = text.length;
            //    return function (t) {
            //        //debugger;
            //        //this.innerHTML = text.substr(0,
            //        //        Math.round( t * textLength) );
            //        console.log("tween called at time " + t);
            //    };
            //});
    }
}());
