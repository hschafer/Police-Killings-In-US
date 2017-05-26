// Our modules are designed to execute when imported
require('./ethnicity.js');
require('./the_victims.js');
require('./fbi_comparison.js');

require('../css/style.scss');

$(document).ready(function() {
    var drawPeople = require('./fbi_comparison').drawPeople;
    var peopleLoaded = false;

    $('#fullpage').fullpage({
        autoScrolling: false,
        fitToSection: false,
        onLeave: function(index, nextIndex, direction){
            var leavingSection = $(this);
            // one-based indexing
            // after leaving section 1, show the people if not shown
            if(!peopleLoaded && index == 3 && direction =='down'){
                console.log("hello");
                drawPeople();
                peopleLoaded = true;
            }
        }
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

