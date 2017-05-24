// Our modules are designed to execute when imported
require('./ethnicity.js');
require('./the_victims.js');

$(document).ready(function() {
    $('#fullpage').fullpage({
        autoScrolling: false,
        fitToSection: false,
    });

    $("ul.tabs li").click(function() {
        var me = $(this);
        var tabbed = me.attr("data-tab");

        $('ul.tabs li').removeClass('current');
		$('.tab-content').removeClass('current');

		me.addClass('current');
		$('#' + tabbed).addClass('current');
    });
});

