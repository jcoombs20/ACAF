function socket_emit() {
  socket = io.connect('http://ecosheds.org:3415');



  socket.on('check_stats', function(occData) {
    if(occData[0][0].count > 0) {
      queryType = "stats";
    }
    else {
      socket.emit('get_centroid', {"geom": drawnItems.toGeoJSON().features[0].geometry});
      queryType = "points";
    }

    queryRID = [];
    occData[1].forEach(function(rid) {
      queryRID.push(rid.rid);
    });
  });





  socket.on('get_centroid', function(centData) {
    queryCentroid = centData[0][0].geom;
  });





  socket.on('get_occ', function(occData) {
    d3.select("#resultsTableBody").selectAll("tr").remove();
    d3.select("#resultsTableBody").selectAll("tr")
      .data(birdTitles)
      .enter()
        .append("tr")
        .on("click", function() { viewSpecies(d3.select(this).select("td")[0][0]); }) 
        .html(function(d,i) {
          if(queryType == "stats") {
            var regOcc = occData[i][0].mean.toFixed(3);
          }
          else {
            var regOcc = occData[i][0].val.toFixed(3);
          }

          if(d3.keys(locOccModels).indexOf(birdID[i]) > -1) {
            if(birdID[i] == "praw") {
              var prawSource = document.querySelector('input[name=sourcePop]:checked').value;

              if(prawSource == "yes") {
                if(parseFloat(d3.select("#areaText").attr("data-ha")) <= 3) {
                  var locOcc = Math.max(locOccModels.praw.connected(parseFloat(d3.select("#openSourceDist").property("value")), parseFloat(d3.select("#areaText").attr("data-ha"))).toFixed(3), locOccModels.praw.isolated(parseFloat(d3.select("#areaText").attr("data-ha"))).toFixed(3));
                }
                else {
                  var locOcc = (1).toFixed(3);
                }
              }
              else {
                if(parseFloat(d3.select("#areaText").attr("data-ha")) <= 3) {
                  var locOcc = locOccModels.praw.isolated(parseFloat(d3.select("#areaText").attr("data-ha"))).toFixed(3);
                }
                else {
                  var locOcc = (1).toFixed(3);
                }
              }
            }
            else {
              var locOcc = locOccModels[birdID[i]](parseFloat(d3.select("#areaText").attr("data-ha"))).toFixed(3);
            }              
          }
          else {
            var locOcc = "";
          }
 
          return '<td value="' + birdID[i] + '" title="' + d + '">' + d + '</td><td title="Regional Occupancy: ' + regOcc + '">' + regOcc  + '</td><td title="Local Occupancy: ' + locOcc + '">' + locOcc + '</td>';             
        });
    d3.select("#resultsDefaultDiv").style("display", "none");
    d3.select("#resultsActualDiv").style("display", "block");
    if(d3.select("#resultsDiv").style("opacity") == 0) { toolWindowToggle("results"); }
    d3.select("#hcResultsDiv").classed("inactive", false);
  });



  socket.on('disconnect', function(err) {
    console.log(err);
    console.log('Socket has been disconnected');
  });


  socket.on('error', function(err) {
    console.log(err.error);
  });

  locOccModels = {"baww": baww_roberts, "cswa": cswa_roberts, "coye": coye_roberts, "eato": eato_roberts, "grca": grca_roberts, "inbu": inbu_roberts, "praw": {"isolated": praw_roberts, "connected":praw_6_ha_roberts}};
}

function viewSpecies(tmpSpp) {
  if(d3.select("#songsDiv").style("opacity") == 0) {
    toolWindowToggle("songs");
  }

  var spp = d3.select(tmpSpp).attr("value");
  var j = -1;
  d3.select("#songSelect").selectAll("option")[0].some(function(d,i) {
    if(d3.select(d).attr("data-spp") == spp) {
      j = i;
    }
    return j >= 0;
  });

  d3.select("#songSelect").property("selectedIndex", j);
  changeSpecies(d3.select("#songSelect")[0][0]);
}


function baww_roberts(x_in) {
  var temp;
  temp = 0.0;

  // coefficients
  var a1 = 2.4517012088811399E-01;
  var b1 = 1.1895368258497366E-01;
  var c1 = 3.2590532404858485E-02;
  var a2 = 4.6410213982953230E-01;
  var b2 = 1.2056675324797132E-01;
  var c2 = 2.5072317929912134E-02;
  var a3 = 2.9072773929643814E-01;
  var b3 = 1.1895247933682274E-01;
  var c3 = 3.2606941872535690E-02;

  temp = a1 / (1.0 + Math.exp(-1.0 * (x_in - b1) / c1)) + a2 / (1.0 + Math.exp(-1.0 * (x_in - b2) / c2)) + a3 / (1.0 + Math.exp(-1.0 * (x_in - b3) / c3));
  return temp;
}

function cswa_roberts(x_in) {
  var temp;
  temp = 0.0;

  // coefficients
  var a1 = 1.8230946103510554E-01;
  var b1 = -1.8456610711636678E-01;
  var c1 = 1.9533218620175946E-01;
  var a2 = 4.1868820495514947E-01;
  var b2 = -1.3304137433829305E-01;
  var c2 = 1.8096197476383741E-01;
  var a3 = 3.9900233471619229E-01;
  var b3 = -1.0079036514466322E-01;
  var c3 = 1.7187071120501346E-01;

  temp = a1 / (1.0 + Math.exp(-1.0 * (x_in - b1) / c1)) + a2 / (1.0 + Math.exp(-1.0 * (x_in - b2) / c2)) + a3 / (1.0 + Math.exp(-1.0 * (x_in - b3) / c3));
  return temp;
}

function coye_roberts(x_in) {
  var temp;
  temp = 0.0;

  // coefficients
  var a1 = 2.5329551270264500E-01;
  var b1 = 5.0080168919667850E-02;
  var c1 = 9.0928957048031389E-02;
  var a2 = 2.5618316544966879E-01;
  var b2 = 5.0581779694603951E-02;
  var c2 = 9.6789938943060413E-02;
  var a3 = 4.9052132187475361E-01;
  var b3 = 6.7577126572874235E-02;
  var c3 = 8.8671888761788970E-02;

  temp = a1 / (1.0 + Math.exp(-1.0 * (x_in - b1) / c1)) + a2 / (1.0 + Math.exp(-1.0 * (x_in - b2) / c2)) + a3 / (1.0 + Math.exp(-1.0 * (x_in - b3) / c3));
  return temp;
}

function eato_roberts(x_in) {
  var temp;
  temp = 0.0;

  // coefficients
  var a1 = 2.0815542127541031E-01;
  var b1 = 1.0420078637934362E-01;
  var c1 = 8.6882121884352570E-02;
  var a2 = 2.6963936730726268E-01;
  var b2 = 9.9605159894322989E-02;
  var c2 = 1.2502607820036954E-01;
  var a3 = 5.2220521140463427E-01;
  var b3 = 1.0782805652435903E-01;
  var c3 = 8.0063797335245490E-02;

  temp = a1 / (1.0 + Math.exp(-1.0 * (x_in - b1) / c1)) + a2 / (1.0 + Math.exp(-1.0 * (x_in - b2) / c2)) + a3 / (1.0 + Math.exp(-1.0 * (x_in - b3) / c3));
  return temp;
}

function grca_roberts(x_in) {
  var temp;
  temp = 0.0;

  // coefficients
  var a1 = 2.7427024300968633E-01;
  var b1 = 2.7448092447616990E-01;
  var c1 = 1.4905858511271172E-01;
  var a2 = 2.5033536904115827E-01;
  var b2 = 2.2156601428959899E-01;
  var c2 = 9.2283145072560732E-02;
  var a3 = 4.7539438447078475E-01;
  var b3 = 2.2222949511398196E-01;
  var c3 = 1.0275170550596831E-01;

  temp = a1 / (1.0 + Math.exp(-1.0 * (x_in - b1) / c1)) + a2 / (1.0 + Math.exp(-1.0 * (x_in - b2) / c2)) + a3 / (1.0 + Math.exp(-1.0 * (x_in - b3) / c3));
  return temp;
}

function inbu_roberts(x_in) {
  var temp;
  temp = 0.0;

  // coefficients
  var a1 = 5.4241930788287773E-01;
  var b1 = 5.6604185564237397E-01;
  var c1 = 6.7205848773535082E-02;
  var a2 = 1.3317833380622518E-01;
  var b2 = 5.9003989543406699E-01;
  var c2 = 7.6656542743027356E-02;
  var a3 = 3.2440260813925581E-01;
  var b3 = 5.5293398777413072E-01;
  var c3 = 4.7790477407615953E-02;

  temp = a1 / (1.0 + Math.exp(-1.0 * (x_in - b1) / c1)) + a2 / (1.0 + Math.exp(-1.0 * (x_in - b2) / c2)) + a3 / (1.0 + Math.exp(-1.0 * (x_in - b3) / c3));
  return temp;
}

function praw_roberts(x_in) {
  var temp;
  temp = 0.0;

  // coefficients
  var a1 = 2.1043570865004272E-06;
  var b1 = 2.2212717376942797E+00;
  var c1 = 5.8065799770711010E-02;
  var a2 = 1.0000000000532698E+00;
  var b2 = 1.1073507500628841E+00;
  var c2 = 1.3661564390541989E-01;
  var a3 = -7.9533512230921382E+00;
  var b3 = 4.8158865530859856E+01;
  var c3 = 1.1244356192388789E+00;
  var Offset = -2.3732394285088086E-11;

  temp = a1 / (1.0 + Math.exp(-1.0 * (x_in - b1) / c1)) + a2 / (1.0 + Math.exp(-1.0 * (x_in - b2) / c2)) + a3 / (1.0 + Math.exp(-1.0 * (x_in - b3) / c3));
  temp += Offset;
  return temp;
}

function praw_6_ha_roberts(dist, area) {
  var temp;
  temp = 0.0;

  var x_in = dist + (((0.6 - area) * 4000) - (((0.6 - area) - 0.2) * 500));
  //var x_in = dist + ((0.6 - area) * 3875);

  // coefficients
  var a = -1.0000000054906386E+00;
  var b = 1.1890222235088145E+03;
  var c = 5.1352891197522740E+02;
  var d = 9.9999993550904276E-01;
  var Offset = 1.0000000065266081E+00;

  temp = a / Math.pow(1.0 + Math.exp(-1.0 * (x_in - b) / c), d);
  temp += Offset;
  return temp;
}

function praw_4_ha_roberts(x_in) {
  var temp;
  temp = 0.0;

  // coefficients
  var a = 1.0000000155931505E+00;
  var b = 3.8830959316675961E+02;
  var c = -5.1352893615315134E+02;
  var d = 1.0000000559134734E+00;
  var Offset = 5.8068834303056150E-10;

  temp = a / Math.pow(1.0 + Math.exp(-1.0 * (x_in - b) / c), d);
  temp += Offset;
  return temp;
}

function praw_2_ha_roberts(x_in) {
  var temp;
  temp = 0.0;

  // coefficients
  var a = 9.9999980316743442E-01;
  var b = -3.2418890928526656E+02;
  var c = -5.1352882605211175E+02;
  var d = 9.9999978311165139E-01;
  var Offset = -3.1798283975790151E-10;

  temp = a / Math.pow(1.0 + Math.exp(-1.0 * (x_in - b) / c), d);
  temp += Offset;
  return temp;
}
