// Our modules are designed to execute when imported
require('./ethnicity.js');
require('./the_victims.js');
require('./fbi_comparison.js');
require('./narrative.js');

require('../css/style.scss');

$(document).ready(function() {
    // set up full page
    $('#fullpage').fullpage({
        autoScrolling: false,
        fitToSection: false,
    });

    // slow highlight of intro quote
    setTimeout(highlightIntro, 1500);

    // next steps tabs
    $("ul.tabs li").click(function() {
        var me = $(this);
        var tabbed = me.attr("data-tab");

        $('ul.tabs li').removeClass('current');
		$('.tab-content').removeClass('current');

		me.addClass('current');
		$('#' + tabbed).addClass('current');
    });

    // make citations clickable
    $(".citation").click(function() {
        // this is the location of the references slide.
        // Please change if you add a new slide
        $.fn.fullpage.moveTo(8);
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

