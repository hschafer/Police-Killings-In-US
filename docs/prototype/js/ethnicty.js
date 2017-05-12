const d3 = require('d3');
(function() {
    var w = $(window).width() * 0.5;
    var h = $(window).height() * 0.5;

    $(document).ready(function() {
        d3.queue()
            .defer(d3.csv, "data/data-police-shootings-master/computed.csv")
            .await(ready);
    });

    function ready(error, data) {
        if (error) throw error;

        console.log(data);
    }
}());
