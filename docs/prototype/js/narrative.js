/**
 * Created by meredith on 5/30/17.
 */
const d3 = require('d3');
require('waypoints/lib/jquery.waypoints.js');

(function () {

    var narrativeText = [
        "One summer afternoon in Seattle, Washington " +
        "in 2010, Officer Ian Birk noticed a man crossing a city street " +
        "holding a knife. Officer Birk, a member of the Seattle Police " +
        "Department, left his vehicle to handle the situation. ",

        "Officer Birk approached the man, commanding " +
        "him to put down the knife. 4 seconds later, Officer Birk had " +
        "fired four shots into the man, killing him.",

        "The man, John T. Williams, was a member of " +
        "the Nuu-chah-nulth tribal group native to nearby Vancouver Island. " +
        "He was a local woodcarver, hard of hearing, and was carrying a block of " +
        "wood and his carving knife."
    ];

    var duration = 4000;

    $(document).ready(function () {
        setTimeout(function () {
                var waypoint1 = new Waypoint({
                    element: $(".narrative_section"),
                    handler: function () {
                        typeInText(0);
                        waypoint1.disable();
                    },
                    offset: 300
                });
            }, 1000);
    });

    function typeInText(index) {
        if (index < narrativeText.length) {
            console.log("type text from " + index + " now");
            var p = d3.select("#narrative_text" + index + " p");
            var text = narrativeText[index];
            var textLength = text.length;
            p.transition()
                .duration(duration)
                .ease(d3.easeLinear)
                .tween('text', function() {
                    return function(t) {
                        var newText = text.substr(0,
                                Math.round( t * textLength));
                        p.html(newText);
                    };
                });
            setTimeout(function() { typeInText(index + 1); }, duration * 1.1);
        }
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
