/**
 * Created by meredith on 5/30/17.
 */
const d3 = require('d3');
const vivus = require('vivus');
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
                "Less than 5 seconds later"
            ],
            typed: true,
            durationBetween: 200
        },
        {
            element: "#narrative_text1 p",
            sentences: [
                '.', '.', '.', '.'
            ],
            typed: true,
            durationBetween: 1000
        },
        {
            element: "#narrative_text1 p",
            sentences: [
                ", Officer Birk had fired four shots into the man, killing him."
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
                element: $("#narrative_section"),
                handler: function () {
                    var totem_vivus = new vivus('narrative_section_svg', {start: 'autostart', duration: 2000});

                    totem_vivus.play();
                    $("#narrative_section_svg").removeClass("hidden");

                    var totem_svg = d3.select("#narrative_section_svg g")
                        .transition()
                        .delay(6000)
                        .duration(3000)
                        .attr("fill", "black");

                    setTimeout(function() {
                        $("#totemCaption").fadeIn();
                    }, 8000);

                    typeInText(0, 0, 5);
                    waypoint1.disable();
                },
                offset: 300
            });

            var waypoint2 = new Waypoint({
                element: $("#narrative_section2"),
                handler: function () {

                    var badge_svg = d3.select("#narrative_section2_svg");
                    var badge_vivus = new vivus('narrative_section2_svg', {start: 'autostart', duration: 3000});
                    badge_vivus.play();
                    $("#narrative_section2_svg").removeClass("hidden");

                    typeInText(5, 0, partsOfNarrative.length);
                    waypoint2.disable();
                },
                offset: 300
            });
        }, 1000);
    });

    // start indices are inclusive, end index is exclusive
    function typeInText(partIndex, sentenceIndex, endPartIndex) {
        if (partIndex < partsOfNarrative.length && partIndex < endPartIndex) {
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
                    .tween('text', function () {
                        return function (t) {
                            var newText = text.substr(0,
                                Math.round(t * textLength));
                            p.html(originalText + newText);
                        };
                    });
                toWait += duration * 1.1;
            } else {
                p.html(originalText + text);

                // so much work to attach an event listener on to one element
                $(part.element + " .generatedCitation").click(function () {
                    $.fn.fullpage.moveTo("aCredits");
                });
            }

            setTimeout(function () {
                sentenceIndex++;
                if (sentenceIndex >= part.sentences.length) {
                    partIndex++;
                    sentenceIndex = 0;
                }
                typeInText(partIndex, sentenceIndex, endPartIndex);
            }, toWait);
        } else {
            done();
        }
    }

    function done() {
        console.log("done");
    }
}());

