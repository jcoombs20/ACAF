L.Control.birdSong = L.Control.extend({
    options: {
        position: 'topright',
    },

    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-control-birdSong');
        L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
            .addListener(controlDiv, 'click', function () {
              if (d3.select("#songs").style("display") == "block") {
                d3.select("#songs").style("display", "none");
                d3.select("#songControl").property("title", "Click to show songs window");
              }
              else {
                d3.select("#songs").style("display", "block");
                d3.select("#songControl").property("title", "Click to hide songs window");
              }
            });


        var controlUI = L.DomUtil.create('div', 'leaflet-control-birdSong-interior', controlDiv);
        controlUI.id = "songControl";
        controlUI.title = 'Click to show songs window';
        return controlDiv;
    }
});

L.control.birdSong = function (options) {
    return new L.Control.birdSong(options);
};