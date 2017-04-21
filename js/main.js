$(document).ready(function() {
    $('#fullpage').fullpage({
        autoScrolling: false,
        navigation: true,
        navigationPosition: 'left',
        menu: '#menu'

    });

    // here's how we get our csv files in d3
    d3.csv("data/thecounted-data/the-counted-2015.csv", function(data) {
          console.log(data[0]);
    });
});
