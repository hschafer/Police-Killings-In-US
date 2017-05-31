/**
 * Created by meredith on 5/30/17.
 */
const d3 = require('d3');
require('waypoints/lib/jquery.waypoints.js');

(function () {

    var partsOfNarrative = [
        {
            element: "#narrative_text0 p",
            sentences: [
                "One summer afternoon in Seattle, Washington " +
                "in 2010, Officer Ian Birk noticed a man crossing a city street " +
                "holding a knife. ",

                "Officer Birk, a member of the Seattle Police " +
                "Department, left his vehicle to handle the situation."
            ],
            durationBetween: 200
        },
        {
            element: "#narrative_text1 p",
            sentences: [
                "Officer Birk approached the man, commanding him to put down the knife. ",

                "4 seconds later, Officer Birk had fired four shots into the man, killing him."
            ],
            durationBetween: 200
        },
        {
            element: "#narrative_text2 p",
            sentences: [
                "The man, John T. Williams, was a member of " +
                "the Nuu-chah-nulth tribal group native to nearby Vancouver Island. ",

                "He was a local woodcarver, hard of hearing, and was carrying a block of " +
                "wood and his carving knife."
            ],
            durationBetween: 200
        },
        {
            element: "#narrative_text3 p",
            sentences: [
                "This case was independently reviewed by the Department of Justice but Birk " +
                "was not prosecuted further after he resigned from the force.",

                "However, we only have a loose idea of how many cases like this are happening " +
                "across the country and are even less sure to what extent they are being investigated " +
                "in order to make sure our law enforcement ..."
            ],
            durationBetween: 200
        }
    ];

    var duration = 4000;

    $(document).ready(function () {
        setTimeout(function () {
                var waypoint1 = new Waypoint({
                    element: $(".narrative_section"),
                    handler: function () {
                        typeInText(0, 0);
                        waypoint1.disable();
                    },
                    offset: 300
                });
            }, 1000);
    });

    function typeInText(partIndex, sentenceIndex) {
        if (partIndex < partsOfNarrative.length) {
            console.log("type text from " + partIndex + ", " + sentenceIndex + " now");
            var part = partsOfNarrative[partIndex];

            var p = d3.select(part.element);
            var text = part.sentences[sentenceIndex];

            var textLength = text.length;
            var originalText = p.html();
            p.transition()
                .duration(duration)
                .ease(d3.easeLinear)
                .tween('text', function() {
                    return function(t) {
                        var newText = text.substr(0,
                                Math.round( t * textLength));
                        p.html(originalText + newText);
                    };
                });

            setTimeout(function() {
                sentenceIndex++;
                if (sentenceIndex >= part.sentences.length) {
                    partIndex++;
                    sentenceIndex = 0;
                }
                typeInText(partIndex, sentenceIndex);
            }, 1.1 * duration + part.durationBetween);
        }
    }
}());
