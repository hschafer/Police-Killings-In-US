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

    // "Typing" effect for red fade-in of motto
    var characterDelay = 75;

    if (originalText) {
        var highlighted = $("#highlightedText");
        highlighted.html(highlighted.html() + originalText[0]);
        original.html(originalText.substring(1));
        setTimeout(highlightIntro, characterDelay);
    }
}

