L.Control.maxExtent = L.Control.extend({
    options: {
        position: 'bottomright',
    },

    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-control-maxExtent');
        L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
        .addListener(controlDiv, 'click', function () { map.fitBounds([[32, -90],[60, -60]]); });


        var controlUI = L.DomUtil.create('div', 'leaflet-control-maxExtent-interior', controlDiv);
        controlUI.title = 'Zoom to full extent';
        return controlDiv;
    }
});

L.control.maxExtent = function (options) {
    return new L.Control.maxExtent(options);
};