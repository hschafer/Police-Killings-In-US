$(document).ready(function() {
    $('#fullpage').fullpage();

    // here's how we get our csv files in d3
    d3.csv("data/thecounted-data/the-counted-2015.csv", function(data) {
          console.log(data[0]);
    });
});
