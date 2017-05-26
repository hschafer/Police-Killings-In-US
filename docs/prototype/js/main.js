// Our modules are designed to execute when imported
require('./ethnicity.js');
require('./the_victims.js');
const fbiComparison = require('./fbi_comparison.js');

require('../css/style.scss');

$(document).ready(function() {
    var drawPeople = fbiComparison.drawPeople;
    var peopleLoaded = false;

    $('#fullpage').fullpage({
        autoScrolling: false,
        fitToSection: false,
    });

    setTimeout(highlightIntro, 1500);

    $("ul.tabs li").click(function() {
        var me = $(this);
        var tabbed = me.attr("data-tab");

        $('ul.tabs li').removeClass('current');
		$('.tab-content').removeClass('current');

		me.addClass('current');
		$('#' + tabbed).addClass('current');
    });
});

function highlightIntro() {
    var original = $("#originalText");
    var originalText = original.html();

    // "Typing" effect will be random for each character, with
    // an offset between [staggerMinimum, staggerMinimum + staggerRange]
    // added to staggerBase
    var staggerRange = 100;
    var staggerMinimum = -25;
    var staggerBase = 50;

    if (originalText) {
        var highlighted = $("#highlightedText");
        highlighted.html(highlighted.html() + originalText[0]);
        original.html(originalText.substring(1));
        var timeoutStagger = Math.floor(Math.random() * staggerRange) + staggerMinimum;
        setTimeout(highlightIntro, staggerBase + timeoutStagger);
    }
}

