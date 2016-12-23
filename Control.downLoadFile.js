L.Control.downLoadFile = L.Control.extend({
    options: {
        position: 'topright',
        text: 'Download',
        collapsed: true
    },

    onAdd: function (map) {
        this._map = map;
        var className = 'leaflet-control-downLoadFile';
        var container = this._container = L.DomUtil.create('div', className);

        L.DomEvent.disableClickPropagation(container);

        var form = this._form = L.DomUtil.create('form', className + '-form');
        form.id = "dlForm";

        var dlTitle = this._input = L.DomUtil.create('h5', className + '-h5', form);
        dlTitle.innerHTML = "Download Treatment Shape";
        
        this._input = L.DomUtil.create('hr', className + '-hr', form);

        var drawnDiv = this._input = L.DomUtil.create('div', className + '-div', form);

        //******Output select box
        var dlSelectDiv = this._input = L.DomUtil.create('div', className + '-dlSelectDiv', form);

        var dlSelect = this._input = L.DomUtil.create('select', className + '-dlSelect', dlSelectDiv);
        dlSelect.id = "dlSelect";
        dlSelect.title = "Select the format for the output file";

        //var dlCSV = this._input = L.DomUtil.create('option', className + '-dlOption', dlSelect);
        //dlCSV.value = "csv";
        //dlCSV.text = "CSV";

        var dlShape = this._input = L.DomUtil.create('option', className + '-dlOption', dlSelect);
        dlShape.value = "zip";
        dlShape.text = "Shapefile";

        var dlGeo = this._input = L.DomUtil.create('option', className + '-dlOption', dlSelect);
        dlGeo.value = "json";
        dlGeo.text = "GeoJSON";

	var submit = this._input = L.DomUtil.create('a', className + '-a', form);
	submit.id = "dlButton";
        submit.href = "#";
        submit.onclick = this._downLoadFile;
        submit.innerHTML = "Download";
        submit.title = "Download the treatment shape to the specified output format";

        form.appendChild(submit);

        if (this.options.collapsed) {
            L.DomEvent.on(container, 'mouseover', this._expand, this);
            L.DomEvent.on(container, 'mouseout', this._collapse, this);

            var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
            link.href = '#';
            link.title = 'File Downloader';

            L.DomEvent.on(link, L.Browser.touch ? 'click' : 'focus', this._expand, this);

            this._map.on('movestart', this._collapse, this);
        } else {
            this._expand();
        }

        container.appendChild(form);

        return container;
    },

    _downLoadFile: function(event) {
      var strOutData = {};
      strOutData.type = 'FeatureCollection';
      strOutData.features = [tmpGeo];
      var outLayer = "treatment";

      //******Shapefile output
      if (d3.select("#dlSelect").node().value == "zip") {
        var shpwrite = require('shp-write');
        


        var options = {
          folder: outLayer,
          types: {
            point: outLayer,
            polygon: outLayer,
            line: outLayer,
            polyline: outLayer
          }
        }

        var byteString = shpwrite.zip(strOutData, options);

        var byteCharacters = window.atob(byteString);

        var byteNumbers = new Array(byteCharacters.length);
        for (var i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        var blob = new Blob([byteArray], {type: 'application/zip'});             
      }

      //******GeoJSON output
      else {
        strOutData = JSON.stringify(strOutData);
        var blob = new Blob([strOutData], {type: "text/plain"});
      }       

      //*******Add to download link
      //var blob = new Blob([strOutData], {type: "text/plain"});
      var url = URL.createObjectURL(blob);
      var a = d3.select("#dlButton");
      a.property("download", outLayer + "." + d3.select("#dlSelect").node().value);
      a.property("href", url);
    },


    _expand: function () {
        L.DomUtil.addClass(this._container, 'leaflet-control-downLoadFile-expanded');
    },

    _collapse: function () {
        L.DomUtil.removeClass(this._container, 'leaflet-control-downLoadFile-expanded');
    }

});

L.control.downLoadFile = function (options) {
    return new L.Control.downLoadFile(options);
};
