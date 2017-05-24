// Our modules are designed to execute when imported
require('./ethnicity.js');
require('./the_victims.js');

$(document).ready(function() {
    $('#fullpage').fullpage({
        autoScrolling: false,
        fitToSection: false,
    });

    setTimeout(highlightIntro, 3000);

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
    if (originalText) {
        var highlighted = $("#highlightedText");
        highlighted.html(highlighted.html() + originalText[0]);
        original.html(originalText.substring(1));
        setTimeout(highlightIntro, 75);
    }
}

