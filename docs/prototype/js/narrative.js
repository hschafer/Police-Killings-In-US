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
            typed: true,
            durationBetween: 200
        },
        {
            element: "#narrative_text1 p",
            sentences: [
                "Officer Birk approached the man, commanding him to put down the knife. ",
            ],
            typed: true,
            durationBetween: 200
        },
        {
            element: "#narrative_text1 p",
            sentences: [
                "Less than 5 seconds later, "
            ],
            typed: true,
            durationBetween: 4500
        },
        {
            element: "#narrative_text1 p",
            sentences: [
                "Officer Birk had fired four shots into the man, killing him."
            ],
            typed: true,
            durationBetween: 200
        },
        {
            element: "#narrative_text2 p",
            sentences: [
                "The man, John T. Williams, was a member of " +
                "the Nuu-chah-nulth tribal group native to nearby Vancouver Island. ",

                "He was a local woodcarver, hard of hearing, and was carrying a block of " +
                "wood and his carving knife. ",

                "Later reports by witnesses say that the knife was closed."
            ],
            typed: true,
            durationBetween: 200
        },
        {
            element: "#narrative_text2 p",
            sentences: [
                "<sup class='generatedCitation citation'>[2]</sup>"
            ],
            typed: false,
            durationBetween: 200
        },
        {
            element: "#narrative_text3 p",
            sentences: [
                "Birk's actions were found unjustifiable by the SPD Firearms Review Board, " +
                "and subsequently reviewed by the Department of Justice. ",

                "The DOJ decided not to press charges because they would have " +
                "to prove intent, rather than negligence. ",

                "The case was not prosecuted further after Birk resigned from the force."
            ],
            typed: true,
            durationBetween: 200
        },
        {
            element: "#narrative_text3 p",
            sentences: [
                "<sup class='generatedCitation citation'>[3]</sup>"
            ],
            typed: false,
            durationBetween: 200
        },
        {
            element: "#narrative_text4 p",
            sentences: [
                "Although Birk was not prosecuted, this case was at least " +
                "reviewed independently to evaluate what happened. ",

                "This internal investigation is not federally mandated, and may not have " +
                "been completed in a different district or with a less publicized case. "
            ],
            typed: true,
            durationBetween: 200
        },
        {
            element: "#narrative_text5 p",
            sentences: [
                "The lack of federal guidelines following a police shooting makes it " +
                "difficult to determine the number of incidents like this that are occuring " +
                "in the US. ",

                "We have an even less concrete idea of the number of cases that are properly " +
                "investigated."
            ],
            typed: true,
            durationBetween: 200
        }
    ];

    // Approx 3 seconds for the first sentence
    var durationPerChar = 3000 / 122;

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
            var originalText = p.html();

            var toWait = part.durationBetween;
            if (part.typed) {
                var textLength = text.length;
                var duration = textLength * durationPerChar;
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
                toWait += duration * 1.1;
            } else {
                console.log("Else branch");
                p.html(originalText + text);
            }

            setTimeout(function() {
                sentenceIndex++;
                if (sentenceIndex >= part.sentences.length) {
                    partIndex++;
                    sentenceIndex = 0;
                }
                typeInText(partIndex, sentenceIndex);
            }, toWait);
        } else {
            done();
        }
    }

    function done() {
        console.log("done");
        $(".generatedCitation").click(citationClick);
    }
}());

