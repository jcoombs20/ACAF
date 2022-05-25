#!/bin/bash
# Comment line, run script from command line using ./bash_zip.sh after changing to the directory the bash file is in

declare -a sppShort=("alfl" "amgo" "amwo" "brth" "bwwa" "cawa" "cawr" "cewa" "deju" "fisp" "gwwa" "howr" "lisp" "mawa" "mowa" "nawa" "nobo" "noca" "nomo" "pawa" "rthu" "rubl" "rugr" "sosp" "swsp" "tewa" "wevi" "wifl" "wisn" "wiwa" "wtsp" "ybch" "ybcu" "yewa")

sppLength=${#sppShort[@]}
echo $sppLength

for (( i=0; i<${sppLength}; i++ ));
  do
    7z a "/data_cl/birds/occupancy/"${sppShort[$i]}".zip" "/data_cl/birds/occupancy/"${sppShort[$i]}"_wgs84.tif"
    ln -sv "/data_cl/birds/occupancy/"${sppShort[$i]}".zip" "/home/jason/crossings/web/views/birds/zips/"${sppShort[$i]}".zip"
    raster2pgsql -d -I -C -M -l 2 -s 4326 -t 1000x1000 "/data_cl/birds/occupancy/"${sppShort[$i]}"_wgs84.tif" "gis."${sppShort[$i]} | PGPASSWORD='Jason20!' psql -U Jason -d birds
  done