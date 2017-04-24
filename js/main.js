const topojson = require('topojson');

$(document).ready(function () {
    $('#fullpage').fullpage({
        autoScrolling: false,
        navigation: true,
        navigationPosition: 'left',
        menu: '#menu'

    });

    // NOTE: d3.geo functions all have new syntax as of D3 4.0 release
    // d3.geo.albersUsa() call from example site is now d3.geoAlbersUsa
    // see details of recent changes here: https://github.com/d3/d3/blob/master/CHANGES.md

    d3.queue()
        .defer(d3.json, "https://d3js.org/us-10m.v1.json")
        .defer(d3.csv, "data/data-police-shootings-master/computed.csv")
        .await(ready);

    /*
       d3.json("", function(error, us) {
       if (error) throw error;
    // append states
    //svg.append("g")
    //    .attr("class", "states")
    //    .selectAll("path")
    //    .data(topojson.feature(us, us.objects.states).features)
    //    .enter().append("path")
    //    .attr("d", path);

    svg.append("path")
    .attr("class", "states")
    .datum(topojson.feature(us, us.objects.states))
    .attr("d", path);

    //svg.append("path")
    //    .attr("class", "state-borders")
    //    .attr("d", path(topojson.mesh(us, us.objects.states, function (a, b) {
    //        // don't append paths that are the same line
    //        // i.e. don't append washington's south border AND
    //        // orgegon's north border where they overlap
    //        return a !== b;
    //    })));

    //// append outline of whole country
    //svg.append("path")
    //    .attr("class", "us-outline")
    //    .attr("d", path(topojson.mesh(us, us.objects.nation)));
    });

    var geoJSON = toGeoJSON(data);

    svg.selectAll(".symbol")
    .data(geoJSON.features.sort(function(a, b) { return b.properties.size - a.properties.size; }))
    .enter().append("path")
    .attr("class", "symbol")
    .attr("d", path);

    //svg.selectAll("circle")
    //    .data(data)
    //    .enter()
    //    .append("circle")
    //    .attr("cx", function(d) { return d3.geoAlbersUsa([d.computed_long, d.computed_lat])[0]; })
    //    .attr("cy", function(d) { return d3.geoAlbersUsa([d.computed_long, d.computed_lat])[1]; })
    //    .attr("r", "8px")
    //    .attr("fill", "red");
});*/
});

function ready(error, us, data) {
    if (error) throw error;

    // var geoJSON = toGeoJSON(data);
    var geoJSON =
    {"type":"FeatureCollection","features":[
        {"type":"Feature","id":"01","geometry":{"type":"Point","coordinates":[-86.766233,33.001471]},"properties":{"name":"Alabama","population":4447100}},
        {"type":"Feature","id":"02","geometry":{"type":"Point","coordinates":[-148.716968,61.288254]},"properties":{"name":"Alaska","population":626932}},
        {"type":"Feature","id":"04","geometry":{"type":"Point","coordinates":[-111.828711,33.373506]},"properties":{"name":"Arizona","population":5130632}},
        {"type":"Feature","id":"05","geometry":{"type":"Point","coordinates":[-92.576816,35.080251]},"properties":{"name":"Arkansas","population":2673400}},
        {"type":"Feature","id":"06","geometry":{"type":"Point","coordinates":[-119.355165,35.458606]},"properties":{"name":"California","population":33871648}},
        {"type":"Feature","id":"08","geometry":{"type":"Point","coordinates":[-105.203628,39.500656]},"properties":{"name":"Colorado","population":4301261}},
        {"type":"Feature","id":"09","geometry":{"type":"Point","coordinates":[-72.874365,41.494852]},"properties":{"name":"Connecticut","population":3405565}},
        {"type":"Feature","id":"10","geometry":{"type":"Point","coordinates":[-75.561908,39.397164]},"properties":{"name":"Delaware","population":783600}},
        {"type":"Feature","id":"11","geometry":{"type":"Point","coordinates":[-77.014001,38.910092]},"properties":{"name":"District of Columbia","population":572059}},
        {"type":"Feature","id":"12","geometry":{"type":"Point","coordinates":[-81.634622,27.795850]},"properties":{"name":"Florida","population":15982378}},
        {"type":"Feature","id":"13","geometry":{"type":"Point","coordinates":[-83.868887,33.332208]},"properties":{"name":"Georgia","population":8186453}},
        {"type":"Feature","id":"15","geometry":{"type":"Point","coordinates":[-157.524452,21.146768]},"properties":{"name":"Hawaii","population":1211537}},
        {"type":"Feature","id":"16","geometry":{"type":"Point","coordinates":[-115.133222,44.242605]},"properties":{"name":"Idaho","population":1293953}},
        {"type":"Feature","id":"17","geometry":{"type":"Point","coordinates":[-88.380238,41.278216]},"properties":{"name":"Illinois","population":12419293}},
        {"type":"Feature","id":"18","geometry":{"type":"Point","coordinates":[-86.261515,40.163935]},"properties":{"name":"Indiana","population":6080485}},
        {"type":"Feature","id":"19","geometry":{"type":"Point","coordinates":[-93.049161,41.960392]},"properties":{"name":"Iowa","population":2926324}},
        {"type":"Feature","id":"20","geometry":{"type":"Point","coordinates":[-96.536052,38.454303]},"properties":{"name":"Kansas","population":2688418}},
        {"type":"Feature","id":"21","geometry":{"type":"Point","coordinates":[-85.241819,37.808159]},"properties":{"name":"Kentucky","population":4041769}},
        {"type":"Feature","id":"22","geometry":{"type":"Point","coordinates":[-91.457133,30.699270]},"properties":{"name":"Louisiana","population":4468976}},
        {"type":"Feature","id":"23","geometry":{"type":"Point","coordinates":[-69.719931,44.313614]},"properties":{"name":"Maine","population":1274923}},
        {"type":"Feature","id":"24","geometry":{"type":"Point","coordinates":[-76.797396,39.145653]},"properties":{"name":"Maryland","population":5296486}},
        {"type":"Feature","id":"25","geometry":{"type":"Point","coordinates":[-71.363628,42.271831]},"properties":{"name":"Massachusetts","population":6349097}},
        {"type":"Feature","id":"26","geometry":{"type":"Point","coordinates":[-84.170753,42.866412]},"properties":{"name":"Michigan","population":9938444}},
        {"type":"Feature","id":"27","geometry":{"type":"Point","coordinates":[-93.583003,45.210782]},"properties":{"name":"Minnesota","population":4919479}},
        {"type":"Feature","id":"28","geometry":{"type":"Point","coordinates":[-89.593164,32.566420]},"properties":{"name":"Mississippi","population":2844658}},
        {"type":"Feature","id":"29","geometry":{"type":"Point","coordinates":[-92.153770,38.437715]},"properties":{"name":"Missouri","population":5595211}},
        {"type":"Feature","id":"30","geometry":{"type":"Point","coordinates":[-111.209708,46.813302]},"properties":{"name":"Montana","population":902195}},
        {"type":"Feature","id":"31","geometry":{"type":"Point","coordinates":[-97.403875,41.183753]},"properties":{"name":"Nebraska","population":1711263}},
        {"type":"Feature","id":"32","geometry":{"type":"Point","coordinates":[-116.304648,37.165965]},"properties":{"name":"Nevada","population":1998257}},
        {"type":"Feature","id":"33","geometry":{"type":"Point","coordinates":[-71.463342,43.153046]},"properties":{"name":"New Hampshire","population":1235786}},
        {"type":"Feature","id":"34","geometry":{"type":"Point","coordinates":[-74.428055,40.438458]},"properties":{"name":"New Jersey","population":8414350}},
        {"type":"Feature","id":"35","geometry":{"type":"Point","coordinates":[-106.342108,34.623012]},"properties":{"name":"New Mexico","population":1819046}},
        {"type":"Feature","id":"36","geometry":{"type":"Point","coordinates":[-74.645228,41.507548]},"properties":{"name":"New York","population":18976457}},
        {"type":"Feature","id":"37","geometry":{"type":"Point","coordinates":[-79.667654,35.553334]},"properties":{"name":"North Carolina","population":8049313}},
        {"type":"Feature","id":"38","geometry":{"type":"Point","coordinates":[-99.334736,47.375168]},"properties":{"name":"North Dakota","population":642200}},
        {"type":"Feature","id":"39","geometry":{"type":"Point","coordinates":[-82.749366,40.480854]},"properties":{"name":"Ohio","population":11353140}},
        {"type":"Feature","id":"40","geometry":{"type":"Point","coordinates":[-96.834653,35.597940]},"properties":{"name":"Oklahoma","population":3450654}},
        {"type":"Feature","id":"41","geometry":{"type":"Point","coordinates":[-122.579524,44.732273]},"properties":{"name":"Oregon","population":3421399}},
        {"type":"Feature","id":"42","geometry":{"type":"Point","coordinates":[-77.075925,40.463528]},"properties":{"name":"Pennsylvania","population":12281054}},
        {"type":"Feature","id":"44","geometry":{"type":"Point","coordinates":[-71.448902,41.753318]},"properties":{"name":"Rhode Island","population":1048319}},
        {"type":"Feature","id":"45","geometry":{"type":"Point","coordinates":[-81.032387,34.034551]},"properties":{"name":"South Carolina","population":4012012}},
        {"type":"Feature","id":"46","geometry":{"type":"Point","coordinates":[-99.043799,44.047502]},"properties":{"name":"South Dakota","population":754844}},
        {"type":"Feature","id":"47","geometry":{"type":"Point","coordinates":[-86.397772,35.795862]},"properties":{"name":"Tennessee","population":5689283}},
        {"type":"Feature","id":"48","geometry":{"type":"Point","coordinates":[-97.388631,30.943149]},"properties":{"name":"Texas","population":20851820}},
        {"type":"Feature","id":"49","geometry":{"type":"Point","coordinates":[-111.900160,40.438987]},"properties":{"name":"Utah","population":2233169}},
        {"type":"Feature","id":"50","geometry":{"type":"Point","coordinates":[-72.814309,44.081127]},"properties":{"name":"Vermont","population":608827}},
        {"type":"Feature","id":"51","geometry":{"type":"Point","coordinates":[-77.835857,37.750345]},"properties":{"name":"Virginia","population":7078515}},
        {"type":"Feature","id":"53","geometry":{"type":"Point","coordinates":[-121.624501,47.341728]},"properties":{"name":"Washington","population":5894121}},
        {"type":"Feature","id":"54","geometry":{"type":"Point","coordinates":[-80.820221,38.767195]},"properties":{"name":"West Virginia","population":1808344}},
        {"type":"Feature","id":"55","geometry":{"type":"Point","coordinates":[-89.001006,43.728544]},"properties":{"name":"Wisconsin","population":5363675}},
        {"type":"Feature","id":"56","geometry":{"type":"Point","coordinates":[-107.008835,42.675762]},"properties":{"name":"Wyoming","population":493782}},
        {"type":"Feature","id":"72","geometry":{"type":"Point","coordinates":[-66.58765,18.19958]},"properties":{"code":"PR","name":"Puerto Rico","population":3808610}}
        ]};

    var width = 960;
    var height = 600;

    //Create SVG element and append map to the SVG
    var svg = d3.select("#section2").select(".fp-tableCell")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var radius = d3.scaleSqrt()
        .domain([0, 1e4])
        .range([0, 10]);

    var path = d3.geoPath();

    svg.append("path")
        .attr("class", "states")
        .datum(topojson.feature(us, us.objects.states))
        .attr("d", path);

    svg.selectAll(".symbol")
        .data(geoJSON.features.sort(function(a, b) { return b.properties.population - a.properties.population; }))
        .enter().append("path")
        .attr("class", "symbol")
        .attr("d", path.pointRadius(function(d) { console.log(d); return radius(d.properties.population); }));
}

function toGeoJSON(data) {
    var groupedData = d3.nest()
        .key(function(d) { return d.city + ", " + d.state + "," + d.computed_long + "," + d.computed_lat; })
        .entries(data);

    console.log(groupedData);
    var locations = groupedData.map(function(val, index) {
        var key = val["key"];
        var parts = key.split(",");

        return {
            "type": "Feature",
            "id": "" + index,
            "geometry": {
                "type": "Point",
                "coordinates": [parseFloat(parts[2]), parseFloat(parts[3])]
            },
            "properties": {
                "name": parts[0] + ", " + parts[1],
                "size": val["values"].length
            }
        }
    });

    return {"type": "FeatureCollection", "features": locations};
}
