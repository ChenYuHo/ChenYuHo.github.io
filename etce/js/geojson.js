
function getGeoJson(fileUrl, jsonFileUrl){
    
    shp(fileUrl).then(function(geojson){
    	var featuresArr = geojson.features;
    	var featuresLength = featuresArr.length;
    	var dataJson = getJsonFile(jsonFileUrl);
    	console.log("featuresLength:"+featuresLength);
    	for(var i = 0; i < featuresLength; i++){
    		var countryName = featuresArr[i].properties["NAME"];
    		console.log(featuresArr[i].properties["NAME"]);
    		//featuresArr[i].properties["AMOUNT"] = dataJson.data[countryName];
        }
    			
        document.getElementById("test").innerHTML = JSON.stringify(geojson);
    	getJsonFile();
    	return geojson;
    });
    
}

function getJsonFile(jsonFileUrl){
	$.getJSON(jsonFileUrl, function( data ) {
    	console.log("--> " + JSON.stringify(data));
    	return data;
    });
}