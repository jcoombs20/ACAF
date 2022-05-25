function socket_emit() {
  socket = io.connect();
  //socket = io.connect('http://ecosheds.org:3415');



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






  socket.on('get_bcr', function(bcrData) {
    queryBCR = bcrData[0][0].bcr;
    socket.emit("get_pif", {"bcr": queryBCR});
  });





  socket.on('get_pif', function(pifData) {
    var tmpPIF = pifData[0].map(function(d) { return d.scientificname; });
    queryPIF = [];
    
    for(spp in birds.latin) {
      if(tmpPIF.indexOf(birds.latin[spp]) > -1) {
        if(pifData[0][tmpPIF.indexOf(birds.latin[spp])].rcs_b != null) {
          queryPIF.push(pifData[0][tmpPIF.indexOf(birds.latin[spp])].rcs_b);
        }
        else {
          queryPIF.push("");
        }
      }
      else {
        queryPIF.push("");
      }
    }

    socket.emit("get_occ", {"geom": drawnItems.toGeoJSON().features[0].geometry, "birds": birdID, "queryType": queryType, "centGeom": queryCentroid, "rid": queryRID});
  });






  socket.on('get_occ', function(occData) {
    d3.select("#resultsTableBody").selectAll("tr").remove();

    var conVal = 0;
    var likelySpp = 0;
    d3.select("#conVal").select("span").text("");
    d3.select("#likelySpp").select("span").text("");

    var tmpDate = new Date();
    var tmpCSV = "PACT Management Opening Analysis: " + (parseInt(tmpDate.getMonth()) + 1) + "/" + tmpDate.getDate() + "/" + tmpDate.getFullYear() + " " + tmpDate.getHours() + ":" + tmpDate.getMinutes() + ":" + tmpDate.getSeconds() + "\n";
    tmpCSV += "Opening Area (" + document.getElementById("areaUnit").value + "): " + d3.select("#areaText").property("value") + "\n";  //attr("data-ha")).toFixed(3) + "\n";
    tmpCSV += "Opening Perimeter (" + document.getElementById("edgeUnit").value + "): " + d3.select("#edgeText").property("value") + "\n";  //attr("data-m")).toFixed(1) + "\n";
    tmpCSV += "Large Opening within 3 KM: " + document.querySelector('input[name=sourcePop]:checked').value + "\n";
    if(document.querySelector('input[name=sourcePop]:checked').value == "yes") {
      tmpCSV += "Large Opening Distance (m): " + d3.select("#openSourceDist").property("value") + "\n";
    }
    tmpCSV += "Basal Area (" + document.getElementById("basalAreaUnits").value + "): " + d3.select("#basalArea").property("value") + "\n";
    tmpCSV += "Time Since Treatment (Years): " + d3.select("#tstTime").property("value") + "\n";
    var tmpBbox = drawnItems.getBounds();
    tmpCSV += "Opening Bounding Box (degrees): [[" + tmpBbox._northEast.lat.toFixed(4) + ";" + tmpBbox._northEast.lng.toFixed(4) + "][" + tmpBbox._southWest.lat.toFixed(4) + ";" + tmpBbox._southWest.lng.toFixed(4) + "]]\n";
    var tmpData = "Species,Regional Occupancy,Opening Area Occupancy,Basal Area Occupancy,Time Since Treatment Occupancy,Habitat Occupancy,Final Occupancy,PIF Score\n";

    tmpBirdID = [];
    birdID.forEach(function(spp) { tmpBirdID.push(spp.slice(0,4)); });

    //***Load coefficients for basal area model
    if(jQuery.isEmptyObject(birds.basal) == true) {
      loadBasalParams()
    }

    //***Load coefficients for succession model
    if(jQuery.isEmptyObject(birds.succession) == true) {
      loadSuccessionParams()
    }

    var tmpArea = parseFloat(d3.select("#areaText").attr("data-ha"));
    var tmpAreaTrue = convertHectareVal(tmpArea);

    var tmpBasal = parseFloat(d3.select("#basalArea").attr("data-msph"));
    if(document.getElementById("basalAreaUnits").value == "% Retained") {
      var tmpBasalTrue = tmpBasal * 100;
    }
    else {
      var tmpBasalTrue = parseFloat(d3.select("#basalArea").property("value"));
    }

    var tmpTST = parseFloat(d3.select("#tstTime").property("value"));
  
    //***Add in slider reset values
    d3.select("#areaReset").property("value", tmpAreaTrue); 
    d3.select("#basalReset").property("value", tmpBasalTrue);
    //d3.select("#timeReset").property("value", 6);
    d3.select("#timeReset").property("value", tmpTST);

    //***Adjust area slider labels, title, and min and max values 
    d3.select("#areaSliderLabels").html(function() { return getAreaLabels(); });
    d3.select("#areaSliderTitle").text(function() { return document.getElementById("areaUnit").value; });
    d3.select("#areaSlider").property("max", function() { return getAreaMax(); }).property("step", function() { return getAreaStep(); });

    //***Adjust basal slider labels, title, and min and max values 
    d3.select("#basalSliderLabels").html(function() { return getBasalLabels(); });
    d3.select("#basalSliderTitle").text(function() { return getBasalTitle(); });
    d3.select("#basalSlider").property("min", function() { return getBasalMinMax("min"); }).property("max", function() { return getBasalMinMax("max"); }).property("step", function() { return getBasalStep(); });

    //***Set area slider and basal slider to specified level, and time slider to 6
    d3.select("#areaSlider").property("name", document.getElementById("areaUnit").value).property("value", tmpAreaTrue);
    d3.select("#basalSlider").property("name", document.getElementById("basalAreaUnits").value).property("value", tmpBasalTrue);
    //d3.select("#timeSlider").property("value", 6);
    d3.select("#timeSlider").property("value", tmpTST);

    prawSource = document.querySelector('input[name=sourcePop]:checked').value;
    tmpHA = parseFloat(d3.select("#areaText").attr("data-ha"));
    openSourceDist = parseFloat(d3.select("#openSourceDist").property("value"));

    d3.select("#resultsTableBody").selectAll("tr")
      .data(birdTitles)
      .enter()
        .append("tr")
        //.on("click", function() { viewSpecies(d3.select(this).select("td")[0][0]); }) 
        .html(function(d,i) {
          birds.occ[tmpBirdID[i]] = {"model": {}};

          if(queryType == "stats") {
            var regOcc = occData[i][0].mean;
            birds.occ[tmpBirdID[i]].reg = occData[i][0].mean;
          }
          else {
            var regOcc = occData[i][0].val;
            birds.occ[tmpBirdID[i]].reg = occData[i][0].val;
          }

          //***Get opening area occupancy value
          var areaOcc = openingArea(tmpBirdID[i], prawSource, tmpHA, openSourceDist);

          //***Get basal area occupancy
          var baOcc = basalArea(tmpBasal, tmpBirdID[i]);

          //***Get time since treatment occupancy
          //var tstOcc = succession(6, tmpBirdID[i]);
          var tstOcc = succession(tmpTST, tmpBirdID[i]);

          //***Add occ values to birds objects
          birds.occ[tmpBirdID[i]].area =  areaOcc;
          birds.occ[tmpBirdID[i]].basal =  baOcc;
          birds.occ[tmpBirdID[i]].time =  tstOcc;
          birds.occ[tmpBirdID[i]].pif = queryPIF[i];

          habOcc = (areaOcc * baOcc * tstOcc);

          birds.occ[tmpBirdID[i]].hab = habOcc;

          if(habOcc == "") {
            var locOcc = "";
          }
          else {
            var locOcc = (regOcc * habOcc);
          }

          birds.occ[tmpBirdID[i]].loc = locOcc;
 
          if(locOcc != "" && queryPIF[i] != "") {
            conVal += (locOcc * queryPIF[i]);
          }

          if(locOcc >= 0.5) {
            likelySpp += 1;
          }

          tmpData += d + "," + regOcc + "," + areaOcc + "," + baOcc + "," + tstOcc + "," + habOcc + "," + locOcc + "," + queryPIF[i] + "\n";
          return '<td value="' + birdID[i] + '" title="' + d + ' (' + birds.latin[birdTitles[i].replace(" ","_").toLowerCase()] + '), click to see and hear" onclick="viewSpecies(&#34;' + birdID[i] + '&#34;)">' + d +'</td><td title="Regional Occupancy: ' + regOcc.toFixed(2) + '">' + regOcc.toFixed(2)  + '</td><td title="Habitat Occupancy: ' + habOcc.toFixed(2) + '">' + habOcc.toFixed(2) + '<span></span></td><td title="Final Occupancy: ' + locOcc.toFixed(2) + '">' + locOcc.toFixed(2) + '<span></span></td><td title="PIF Score: ' + queryPIF[i] + '">' + queryPIF[i] + '</td><td><span class="glyphicon glyphicon-stats" title="Click to view occupancy distribution models" value="' + birdID[i].slice(0,4) + '" data-i="' + i + '" onclick="chkSppGraphs(this)"></span></td>';             
        });

    d3.select("#resultsTableBody").selectAll("tr")
      .classed("likely", function() {
        var tmpResponse;
        d3.select(this).selectAll("td")[0].some(function(d,i) {
          if(i == 3) {
            if(parseFloat(d3.select(d).text()) >= 0.5) {
              tmpResponse = true;
            }
            else {
              tmpResponse = false;
            }
          }
          return i == 3;
        });
        return tmpResponse;
      });

    birds.occ.conVal = conVal;
    birds.occ.likelySpp = likelySpp;

    tmpCSV += "Bird Conservation Region: " + queryBCR + "\n";
    tmpCSV += "Conservation Value: " + conVal.toFixed(2) + "\n";
    tmpCSV += "Predicted Number of Species Present: " + likelySpp + "\n";
    //tmpCSV += "Species,Regional Occupancy,Habitat Occupancy,Final Occupancy,PIF Score\n";
    tmpCSV += tmpData;
    d3.select("#conVal").select("p").text(conVal.toFixed(2));
    d3.select("#likelySpp").select("p").text(likelySpp);
    d3.select("#exportResultsA").attr("href", "data:attachment/csv," +   encodeURIComponent(tmpCSV));
    d3.select("#resultsDefaultDiv").style("display", "none");
    d3.select("#resultsActualDiv").style("display", "block");

    sortResults(3, d3.select(".sort.active")[0][0]);

    if(d3.select("#resultsDiv").style("opacity") == 0) { toolWindowToggle("results"); }
    d3.select("#hcResultsDiv").classed("inactive", false);
    d3.select("#waitingDiv").style("display", "none");
    setTimeout(function() {
      resizePanels();
    }, 300);
  });


  socket.on('disconnect', function(err) {
    console.log(err);
    console.log('Socket has been disconnected');
  });


  socket.on('error', function(err) {
    console.log(err.error);
  });

  //habOccModels = {"alfl": praw_roberts, "amgo": praw_roberts, "baww": baww_roberts, "bwwa": coye_roberts, "brth": praw_roberts, "cawa": praw_roberts, "cewa": praw_roberts, "cswa": cswa_roberts, "coye": coye_roberts, "deju": grca_roberts, "eato": eato_roberts, "fisp": praw_roberts, "gwwa": praw_roberts, "grca": grca_roberts, "inbu": inbu_roberts, "mowa": coye_roberts, "nawa": coye_roberts, "praw": {"isolated": praw_roberts, "connected":praw_6_ha_roberts}, "sosp": praw_roberts, "wevi": praw_roberts, "wtsp": inbu_roberts, "ybcu": praw_roberts};
  habOccModels = {"alfl": praw_roberts, "amgo": area_occ_null, "baww": baww_roberts, "bwwa": area_occ_null, "brth": praw_roberts, "cawa": area_occ_null, "cewa": coye_roberts, "cswa": cswa_roberts, "coye": coye_roberts, "deju": grca_roberts, "eato": eato_roberts, "fisp": praw_roberts, "gwwa": praw_roberts, "grca": grca_roberts, "inbu": inbu_roberts, "mowa": coye_roberts, "nawa": area_occ_null, "praw": {"isolated": praw_roberts, "connected":praw_6_ha_roberts}, "sosp": area_occ_null, "wevi": praw_roberts, "wtsp": inbu_roberts, "ybcu": area_occ_null};

}





//******Change the glyph and call sort function
function startSort(tmpTH) {
  var tmpSpan = d3.select(tmpTH).select(".sort");
  if(tmpSpan.classed("active") == true) {
    if(tmpSpan.classed("glyphicon-sort-by-attributes") == true) {
      tmpSpan.classed("glyphicon-sort-by-attributes", false).classed("glyphicon-sort-by-attributes-alt", true).property("title", "Click to sort column in ascending order");
    }
    else {
      tmpSpan.classed("glyphicon-sort-by-attributes-alt", false).classed("glyphicon-sort-by-attributes", true).property("title", "Click to sort column in descending order");
    }
  }
  else {
    d3.selectAll(".sort").classed("active", false); 
    tmpSpan.classed("active", true);
    d3.selectAll(".sort").property("title", function() {
      var tmpD = d3.select(this); 
      if(tmpD.classed("active") == true) {
        if(tmpD.classed("glyphicon-sort-by-attributes") == true) {
          return "Click to sort column in descending order";
        }
        else {
          return "Click to sort column in ascending order";
        }
      }
      else {
        if(tmpD.classed("glyphicon-sort-by-attributes") == true) {
          return "Click to sort column in ascending order";
        }
        else {
          return "Click to sort column in descending order";
        }
      }
    });
  }
  sortResults(tmpSpan.attr("data-sort"), tmpSpan[0][0]);
}




//******Sort the results table
function sortResults(tmpCol, tmpSpan) {
  var tmpArray = [];
  var tmpTRs = d3.select("#resultsTableBody").selectAll("tr");

  tmpTRs.each(function() { 
    var tmpTD = d3.select(this).selectAll("td");  
    if(tmpCol == 0) {
      tmpArray.push(d3.select(tmpTD[0][0]).text());
    }
    else {
      tmpArray.push(parseFloat(d3.select(tmpTD[0][tmpCol]).text()))
    }
  });

  if(d3.select(tmpSpan).classed("glyphicon-sort-by-attributes") == true) {
    if(tmpCol == 4) {
      tmpArray.sort(function(a,b) {
        if( !isFinite(a) && !isFinite(b) ) {
          return 0;
        }
        if( !isFinite(a) ) {
          return 1;
        }
        if( !isFinite(b) ) {
          return -1;
        }
        return a - b; 
      });
    }
    else {
      tmpArray.sort();
    }
  }
  else {
    if(tmpCol == 4) {
      tmpArray.sort(function(a,b) { 
        if( !isFinite(a) && !isFinite(b) ) {
          return 0;
        }
        if( !isFinite(a) ) {
          return 1;
        }
        if( !isFinite(b) ) {
          return -1;
        }
        return a - b; 
      }).reverse();
    }
    else {
      tmpArray.sort().reverse();
    }
  }
  
  d3.select("#resultsTableBody").selectAll("tr").remove();

  tmpArray.forEach(function(tmpVal) { 
    var tmpTable = d3.select("#resultsTableBody");
    tmpTRs.each(function() {
      var TR = this;
      var tmpTD = d3.select(this).selectAll("td");  
      if(tmpCol == 0) {
        if(d3.select(tmpTD[0][0]).text() == tmpVal) {
          tmpTable.append(function() { return TR; });
        }
      }
      else {
        if(parseFloat(d3.select(tmpTD[0][tmpCol]).text()) == tmpVal || (isNaN(parseFloat(d3.select(tmpTD[0][tmpCol]).text())) == true && isNaN(tmpVal) == true)) {
          tmpTable.append(function() { return TR; });
        }
      }
      
    });
  });
}



//******Display species occupancy graphs
function chkSppGraphs(tmpGlyph) {
  if(graphSpp.indexOf(d3.select(tmpGlyph).attr("value")) < 0) {
    graphSpp.push(d3.select(tmpGlyph).attr("value"));
    addGraphs(d3.select(tmpGlyph).attr("value"));
    [document.getElementById("areaSlider"), document.getElementById("basalSlider"), document.getElementById("timeSlider")].forEach(function(tmpSlider) {
      update_occupancy(tmpSlider);
    });
  }

  if(d3.select("#graphsDiv").style("opacity") == 0) {
    toolWindowToggle("graphs");
  }

}


function viewSpecies(tmpSpp) {
  if(d3.select("#songsDiv").style("opacity") == 0) {
    toolWindowToggle("songs");
  }

  //var spp = d3.select(tmpSpp).attr("value");
  var j = -1;

  d3.select("#songSelect").selectAll("option")[0].some(function(d,i) {
    if(d3.select(d).attr("data-spp") == tmpSpp) {
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


function area_occ_null(x_in) {
  return 1;
}





function openingArea(tmpBird, prawSource, tmpHA, openSourceDist) {
  if(d3.keys(habOccModels).indexOf(tmpBird) > -1) {
    if(tmpBird == "praw") {
      if(prawSource == "yes") {
        if(tmpHA <= 3) {
          var areaOcc = Math.max(habOccModels.praw.connected(openSourceDist, tmpHA), habOccModels.praw.isolated(tmpHA));
        }
        else {
          var areaOcc = (1);
        }
      }
      else {
        if(tmpHA <= 3) {
          var areaOcc = habOccModels.praw.isolated(tmpHA);
        }
        else {
          var areaOcc = (1);
        }
      }
    }
    else {
      if(habOccModels[tmpBird] == praw_roberts && tmpHA > 3) {
        var areaOcc = (1);
      }
      else {
        var areaOcc = habOccModels[tmpBird](tmpHA);
      }
    }      
  }
  else {
    var areaOcc = "";
  }

  return areaOcc;
}



function basalArea(percForRet, spp) {
  switch(birds.basal[spp].model) {
    case "linear":
      var basalOcc = Math.exp((birds.basal[spp].a * percForRet) + birds.basal[spp].b)/birds.basal[spp].max;
      break;
    case "quadratic":
      var basalOcc = Math.exp((birds.basal[spp].a * Math.pow(percForRet,2)) + (birds.basal[spp].b * percForRet) + birds.basal[spp].c)/birds.basal[spp].max;
      break;
    case "null":
      var basalOcc = 1;
      break;
  }

  if(basalOcc > 1) {
    return 1;
  }
  else {
    return basalOcc;
  }
}


function loadBasalParams() {
  //For linear models: a = slope, b = intercept; For quadratic models: a = quadratic, b = slope, c = intercept
  birds.basal.alfl = {"model": "linear", "a": -1.97, "b": -0.606, "max": 0.545528625};
  birds.basal.amgo = {"model": "linear", "a": -1.429, "b": -0.525, "max": 0.591555364};
  birds.basal.baww = {"model": "null", "a": 1};
  birds.basal.bwwa = {"model": "linear", "a": -1.34, "b": -1.081, "max": 0.3392561};
  birds.basal.brth = {"model": "quadratic", "a": -2.023, "b": 1.352, "c": -1.361, "max": 0.321386851};  //****Using GRCA coefficients
  birds.basal.cawa = {"model": "linear", "a": -0.599, "b": -1.228, "max": 0.292877748};
  birds.basal.cewa = {"model": "linear", "a": -1.18, "b": -0.451, "max": 0.636990842};
  birds.basal.cswa = {"model": "quadratic", "a": -2.235, "b": 0.044, "c": 0.355, "max": 1.426489534};
  birds.basal.coye = {"model": "linear", "a": -2.298, "b": 0.336, "max": 1.399339025};
  birds.basal.deju = {"model": "null", "a": 1};
  birds.basal.eato = {"model": "linear", "a": -2.012, "b": 0.389, "max": 1.475504551};
  birds.basal.fisp = {"model": "linear", "a": -1.655, "b": -0.409, "max": 0.664314232};
  birds.basal.gwwa = {"model": "linear", "a": -2.298, "b": 0.336, "max": 1.399339025};  //****Using COYE coefficients
  birds.basal.grca = {"model": "quadratic", "a": -2.023, "b": 1.352, "c": -1.361, "max": 0.321386851};
  birds.basal.inbu = {"model": "quadratic", "a": -2.637, "b": 0.814, "c": -0.102, "max": 0.961574933};
  birds.basal.mowa = {"model": "quadratic", "a": -4.222, "b": 2.838, "c": -0.956, "max": 0.619353633};
  birds.basal.nawa = {"model": "linear", "a": -1.022, "b": -1.354, "max": 0.258205371};
  birds.basal.praw = {"model": "linear", "a": -2.377, "b": 0.056, "max": 1.057597684};
  birds.basal.sosp = {"model": "linear", "a": -1.943, "b": -0.378, "max": 0.685230501};
  birds.basal.wevi = {"model": "linear", "a": -2.046, "b": -0.135, "max": 0.873715912};
  birds.basal.wtsp = {"model": "linear", "a": -2.499, "b": 0.559, "max": 1.748922703};
  birds.basal.ybcu = {"model": "null", "a": 1};
}






function succession(tst, spp) {
  switch(birds.succession[spp].model) {
    case "linear":
      var tstOcc = Math.exp((birds.succession[spp].a * tst) + birds.succession[spp].b)/(1 + Math.exp((birds.succession[spp].a * tst) + birds.succession[spp].b))/birds.succession[spp].max;
      break;
    case "quadratic":
      var tstOcc = Math.exp((birds.succession[spp].a * Math.pow(tst,2)) + (birds.succession[spp].b * tst) + birds.succession[spp].c)/(1 + Math.exp((birds.succession[spp].a * Math.pow(tst,2)) + (birds.succession[spp].b * tst) + birds.succession[spp].c))/birds.succession[spp].max;
      break;
    case "null":
      var tstOcc = 1;
      break;
  }

  return tstOcc;
}


function loadSuccessionParams() {
  //For linear models: a = slope, b = intercept; For quadratic models: a = quadratic, b = slope, c = intercept
  birds.succession.alfl = {"model": "quadratic", "a": -0.02761, "b": 0.46532, "c": -2.91871, "t6": 0.24587219275425412, max: 0.277245947};
  birds.succession.amgo = {"model": "quadratic", "a": -0.04284, "b": 0.73445, "c": -2.27423, "t6": 0.6434179166341512, max: 0.705499873};  //***Using CSWA coefficients
  birds.succession.baww = {"model": "linear", "a": 0.26188, "b": -2.68389, "t6": 0.24738462414802126, max: 0.927822361};
  birds.succession.bwwa = {"model": "quadratic", "a": -0.04284, "b": 0.73445, "c": -2.27423, "t6": 0.6434179166341512, max: 0.705499873};  //***Using CSWA coefficients
  birds.succession.brth = {"model": "quadratic", "a": -0.04284, "b": 0.73445, "c": -2.27423, "t6": 0.6434179166341512, max: 0.705499873};  //***Using CSWA coefficients  
  birds.succession.cawa = {"model": "quadratic", "a": -0.03882, "b": 0.81713, "c": -4.50385, "t6": 0.2692187344964851, max: 0.449209164};
  birds.succession.cewa = {"model": "linear", "a": -0.19424, "b": 0.48724, "t6": 0.33666316227726084, max: 0.619456032};
  birds.succession.cswa = {"model": "quadratic", "a": -0.04284, "b": 0.73445, "c": -2.27423, "t6": 0.6434179166341512, max: 0.705499873};
  birds.succession.coye = {"model": "quadratic", "a": -0.02864, "b": 0.35029, "c": -0.33934, "t6": 0.6751036442415684, max: 0.675187292};
  birds.succession.deju = {"model": "quadratic", "a": 0.01752, "b": -0.58904, "c": 2.33263, "t6": 0.36103148736844415, max: 0.911543628};
  birds.succession.eato = {"model": "linear", "a": -0.19989, "b": 0.37432, "t6": 0.30469909348476604, max: 0.592502429};
  birds.succession.fisp = {"model": "quadratic", "a": -0.13687, "b": 1.80323, "c": -2.8614, "t6": 0.953940181, max: 0.955971148};  
  birds.succession.gwwa = {"model": "quadratic", "a": -0.06916, "b": 1.30762, "c": -3.60057, "t6": 0.8526313496270167, max: 0.929581534};  
  birds.succession.grca = {"model": "linear", "a": -0.15587, "b": -0.54894, "t6": 0.18479989796562146, max: 0.366110372};
  birds.succession.inbu = {"model": "linear", "a": -0.26774, "b": 0.64398, "t6": 0.2763859323329537, max: 0.65565259};
  birds.succession.mowa = {"model": "quadratic", "a": -0.02063, "b": 0.24519, "c": -0.53929, "t6": 0.5471519715490976, max: 0.547168837};
  birds.succession.nawa = {"model": "quadratic", "a": -0.03557, "b": 0.60386, "c": -3.26571, "t6": 0.2843327738207411, max: 0.331185598};
  birds.succession.praw = {"model": "quadratic", "a": -0.10623, "b": 1.85625, "c": -4.48487, "t6": 0.9441887167368233, max: 0.974019909};
  birds.succession.sosp = {"model": "linear", "a": -0.21686, "b": -0.1771, "t6": 0.1856903798789213, max: 0.45584036};
  birds.succession.wevi = {"model": "quadratic", "a": -0.02864, "b": 0.35029, "c": -0.33934, "t6": 0.6751036442415684, max: 0.675187292};  //***Using COYE coefficients
  birds.succession.wtsp = {"model": "linear", "a": -0.27658, "b": 2.28833, "t6": 0.6522286574775128, max: 0.907905912};
  birds.succession.ybcu = {"model": "null", "a": 1};
}


function update_occupancy(tmpSlider) {
  tooltip.html(function() { return parseFloat(tmpSlider.value).toFixed(3); });

  if(tmpSlider.id == "areaSlider") {
    var areaVal = getAreaSliderVal(tmpSlider.value);
    var baVal = getBasalSliderVal(d3.select("#basalSlider").property("value"));
    var tstVal = d3.select("#timeSlider").property("value");
    d3.select("#areaSlider").property("value", tmpSlider.value);
  }
  else if(tmpSlider.id == "basalSlider") {
    var areaVal = getAreaSliderVal(d3.select("#areaSlider").property("value"));
    var baVal = getBasalSliderVal(tmpSlider.value);
    var tstVal = d3.select("#timeSlider").property("value");
    d3.select("#basalSlider").property("value", tmpSlider.value);
  }
  else if(tmpSlider.id == "timeSlider") {
    var areaVal = getAreaSliderVal(d3.select("#areaSlider").property("value"));
    var baVal = getBasalSliderVal(d3.select("#basalSlider").property("value"));
    var tstVal = tmpSlider.value;
    d3.select("#timeSlider").property("value", tmpSlider.value);
  }

  var conVal = 0;
  var likelySpp = 0;
  var habOcc = [];
  var habDiff = [];
  var locOcc = [];
  var locDiff = [];

  birdID.forEach(function(spp,i) {
    var tmpSpp = spp.slice(0,4);

    var areaOcc = openingArea(tmpSpp, prawSource, areaVal, openSourceDist);
    var baOcc = basalArea(baVal, tmpSpp);
    var tstOcc = succession(tstVal, tmpSpp);

    //***Add slider occupancy to birds JSON
    birds.occ[tmpSpp].model.areaOcc = areaOcc;
    birds.occ[tmpSpp].model.basalOcc = baOcc;
    birds.occ[tmpSpp].model.timeOcc = tstOcc;

    habOcc.push(areaOcc * baOcc * tstOcc);
    habDiff.push(habOcc[i] - birds.occ[tmpSpp].hab);
    locOcc.push(birds.occ[tmpSpp].reg * habOcc[i]);
    locDiff.push(locOcc[i] - birds.occ[tmpSpp].loc);

    birds.occ[tmpSpp].model.habOcc = habOcc[i];

    if(locOcc[i] != "" && birds.occ[tmpSpp].pif != "") {
      conVal += (locOcc[i] * birds.occ[tmpSpp].pif);
    }

    if(locOcc[i] >= 0.5) {
      likelySpp += 1;
    }
  });

  //***update results table
  d3.select("#resultsTableBody").selectAll("tr")[0].forEach(function(row,i) {
    var x = i;
    d3.select(row).selectAll("td")[0].forEach(function(cell,j) {
      if(j == 0) {
        var tmpTitle = d3.select(cell).text();
        birdTitles.some(function(spp,n) {
          if(spp == tmpTitle) { 
            x = n;
            return true;
          }
          return false;
        })
      }

      if(j == 2 || j == 3) {
        d3.select(cell).select("span").text(function() { 
          if(j == 2) { var tmpOcc = habDiff[x]; } else { var tmpOcc = locDiff[x]; }

          if(tmpOcc < -0.001) { 
            d3.select(this).classed("occMinus", true).classed("occPlus", false); 
            return " " + tmpOcc.toFixed(2); 
          }
          else if(tmpOcc > 0.001) {
            d3.select(this).classed("occPlus", true).classed("occMinus", false);
            return " +" + tmpOcc.toFixed(2);
          }
          else {
            d3.select(this).classed("occPlus", false).classed("occMinus", false);
            return "";
          }
        });
      }
    });

    if(locOcc[x] >= 0.5) {
      d3.select(row).classed("likely", true);
    }    
    else {
      d3.select(row).classed("likely", false);
    }    
  });

  var conValDiff = conVal - birds.occ.conVal;
  d3.select("#conVal").select("span").text(function() {
    if(conValDiff < -0.0099) {
      d3.select(this).classed("occMinus", true).classed("occPlus", false);
      return " " + conValDiff.toFixed(2);
    }
    else if(conValDiff > 0.0099) {
      d3.select(this).classed("occPlus", true).classed("occMinus", false);
      return " +" + conValDiff.toFixed(2);
    }
    else {
      d3.select(this).classed("occPlus", false).classed("occMinus", false);
      return "";
    }
  });

  var likelySppDiff = likelySpp - birds.occ.likelySpp;
  d3.select("#likelySpp").select("span").text(function() {
    if(likelySppDiff < 0) {
      d3.select(this).classed("occMinus", true).classed("occPlus", false);
      return " " + likelySppDiff;
    }
    else if(likelySppDiff > 0) {
      d3.select(this).classed("occPlus", true).classed("occMinus", false);
      return " +" + likelySppDiff;
    }
    else {
      d3.select(this).classed("occPlus", false).classed("occMinus", false);
      return "";
    }
  });

  updatePlots(tmpSlider);
}




//******update any plots that are created
function updatePlots(tmpSlider) {
  if(tmpSlider.id.includes("area")) {
    var type = "area";
  }
  else if(tmpSlider.id.includes("basal")) {
    var type = "basal";
  }
  else {
    var type = "time";
  }

  graphSpp.forEach(function(spp) {
    var tmpDiv = d3.select("#" + spp + "_" + type + "Div");

    tmpDiv.select(".point2")
      .attr("cx", birds.occ[spp].model[type + "X"](parseFloat(tmpSlider.value)))
      .attr("cy", birds.occ[spp].model[type + "Y"](birds.occ[spp].model[type + "Occ"]))
      .classed("point2Pos", birds.occ[spp].model[type + "Occ"] > birds.occ[spp][type])
      .classed("point2Neg", birds.occ[spp].model[type + "Occ"] < birds.occ[spp][type])
      .select("title")
      .text(parseFloat(tmpSlider.value).toFixed(2) + "," + birds.occ[spp].model[type + "Occ"].toFixed(2));

    d3.select("#" + spp + "OccP")
      .text(birds.occ[spp].model.habOcc.toFixed(2))
      .classed("point2Pos", birds.occ[spp].model.habOcc - birds.occ[spp].hab > 0.001)
      .classed("point2Neg", birds.occ[spp].model.habOcc - birds.occ[spp].hab < -0.001);      
  });
  
}


//******Get the value for the area slider using the selected opening area input
function getAreaSliderVal(tmpVal) {
  switch(d3.select("#areaSlider").property("name")) {
    case "Square Meters":
      return tmpVal/10000;
      break;
    case "Hectares":
      return tmpVal;
      break;
    case "Square Kilometers":
      return tmpVal/0.01;
      break;
    case "Square Feet":
      return tmpVal/107639;
      break;
    case "Acres":
      return tmpVal/2.47105;
      break;
    case "Square Miles":
      return tmpVal/0.00386102;
      break;
  }
}



//******Convert the opening area hectare value to the selected opening area unit
function convertHectareVal(tmpVal) {
  switch(document.getElementById("areaUnit").value) {
    case "Square Meters":
      return tmpVal * 10000;
      break;
    case "Hectares":
      return tmpVal;
      break;
    case "Square Kilometers":
      return tmpVal * 0.01;
      break;
    case "Square Feet":
      return tmpVal * 107639;
      break;
    case "Acres":
      return tmpVal * 2.47105;
      break;
    case "Square Miles":
      return tmpVal * 0.00386102;
      break;
  }
}





//******Get the value for the basal slider using the selected basal input
function getBasalSliderVal(tmpVal) {
  switch(d3.select("#basalSlider").property("name")) {
    case "M^2/HA":
      return basalArea2percForRet(tmpVal);
      break;
    case "FT^2/AC":
      return basalArea2percForRet(tmpVal/4.356);
      break;
    case "% Retained":
      return tmpVal/100;
      break;
  }
}




function basalArea2percForRet(y) {
  return (y - 0.2968)/25.9421;
}

function percForRet2basalArea(x) {
  return (25.9421 * x) + 0.2968;
}
