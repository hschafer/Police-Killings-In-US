// Our modules are designed to execute when imported
require('./ethnicity.js');
require('./the_victims.js');
require('./fbi_comparison.js');
require('./narrative.js');

require('../css/style.scss');
const d3 = require('d3');

$(document).ready(function() {
    // set up full page
    $('#fullpage').fullpage({
        autoScrolling: false,
        fitToSection: false,
        navigation: true,
        navigationPosition: 'left',
        menu: '#menu'
    });

    // reposition title using absolute positioning
    // TODO: fix this
    d3.select("#titlebox").style("left",($(window).width() * 0.2 + "px"));
    d3.select("#titlebox").style("top",($(window).height() * 0.3 + "px"));

    // define flag specs
    var flag_line_start_x = ($(window).width() * 0.2) - 120;
    var height_blue_box = 200;
    var red_stripe_height = 40;

    // slow highlight of intro quote
    setTimeout(highlightIntro, 1500);
    positionFlag(flag_line_start_x, height_blue_box, red_stripe_height);
    animateFlag(height_blue_box, red_stripe_height);

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

function animateFlag(height_blue_box, red_stripe_height) {

    var max_timeout = 2000;
    var default_duration = 4000;

    // set all widths to 0 first (need this for animation)
    d3.selectAll(".flagline")
        .attr('width', 0);

    console.log(Math.random());
    console.log(Math.random());
    console.log(Math.random());
    console.log(Math.random());
    console.log(Math.random());

    // animate width of rectangles, left to right
    drawFlagLine("#flagbluetop", 300, Math.random() * max_timeout);
    drawFlagLine("#flagbluebottom", 180, Math.random() * max_timeout);
    drawFlagLine("#flagred1", 50, Math.random() * max_timeout);
    drawFlagLine("#flagred2", 100, Math.random() * max_timeout);
    drawFlagLine("#flagred3", 100, Math.random() * max_timeout);
    drawFlagLine("#flagred4", 300, Math.random() * 200);
    drawFlagLine("#flagred5", 700, Math.random() * 200);
    drawFlagLine("#flagred6", 500, Math.random() * 200);

    // draw vertical lines
    // draw blue portion of vertical line
    d3.select("#verticalblue").attr('height', 0);
    d3.select("#verticalblue")
        .transition()
        .delay(2000)
        .duration(3000)
        .ease(d3.easeLinear)
        .attr('height', height_blue_box);

    // draw red portion of vertical line
    d3.select('#verticalred').attr('height', 0);
    d3.select('#verticalred')
        .transition()
        .delay(5000)
        .duration(3000)
        .ease(d3.easeLinear)
        .attr('height', (red_stripe_height * 6) - 3);
    // subtract 3 because width of flag lines is 3 px
}

function drawFlagLine(id_selector, width, delay) {
    d3.select(id_selector)
        .transition()
        .delay(delay)
        .duration(4000)
        .attr('width', width);
}


// TODO: make this work with many sized screens
function positionFlag(flag_line_start_x, height_blue_box, red_stripe_height) {

    // position lines' starting x,y coords
    var startblueY = ($(window).height() * 0.3) - 40;
    var width_line = 3; // width of flag outlines

    // position blue lines
    d3.select("#flagbluetop")
        .attr("x", flag_line_start_x + "px")
        .attr("y", startblueY + "px");
    d3.select("#flagbluebottom")
        .attr("x", flag_line_start_x + "px")
        .attr("y", startblueY + height_blue_box + "px");

    // position red lines
    var line_num = -1;

    // start red lines after blue section and one stripe's height
    var startredY = startblueY + height_blue_box + red_stripe_height;
    d3.selectAll(".flagred")
        .attr("x", flag_line_start_x + "px")
        .attr("y", function() {
            line_num++;
            return startredY + (red_stripe_height * line_num) + "px";
        });

    d3.select("#verticalblue")
        .attr("x", flag_line_start_x + "px")
        .attr("y", startblueY + "px");

    d3.select("#verticalred")
        .attr("x", flag_line_start_x)
        .attr("y", startblueY + height_blue_box + width_line);
}

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

