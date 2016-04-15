var map;
var places;
var geocoder = new google.maps.Geocoder;
var directionsService = new google.maps.DirectionsService;
var directionsDisplay = new google.maps.DirectionsRenderer;
// Array of markers
var array = [];
var spiderMarker = [];
var featureMarker = [];
var batteryMarker = [];
var batteryinfo = [];
var batteryRoute = [];
var intersections = [];

var cbike = false;
var ubike = false;
var parking = false;
var showDisease = false;

// Default travel mode of the map
var travelMode = google.maps.TravelMode.WALKING;
var optimizatonMode = 0;
// Mode map from chinese to google map travel mode
var modes = {
	"自行開車": google.maps.TravelMode.DRIVING,
	"大眾運輸": google.maps.TravelMode.TRANSIT,
	"走路": google.maps.TravelMode.WALKING,
	"Ubike": google.maps.TravelMode.WALKING,
	"Cbike": google.maps.TravelMode.WALKING
}

function plotData(path) {
	map.data.loadGeoJson(path);
}
google.maps.event.addDomListener(window, 'load', initialize);

function initialize() {
	var mapProp = {  //22.628482, 120.356922
		center: new google.maps.LatLng(22.628482,120.356922),
		zoom: 13,
		mapTypeControl: false,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};

	map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
	// map.data.loadGeoJson('/files/data5.json');
	directionsDisplay.setMap(map);
	places = new google.maps.places.PlacesService(map);
	// map.data.loadGeoJson('/files/data4.json');
	google.maps.event.addListener(map, 'click', function(event) {
		placeMarker(event.latLng);
	});

	var input = document.getElementById('pac-input');
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
	var autocomplete = new google.maps.places.Autocomplete(input);
	autocomplete.bindTo('bounds', map);
	autocomplete.addListener('place_changed', function() {
		var place = autocomplete.getPlace();
		if (!place.geometry) {
			window.alert("Autocomplete's returned place contains no geometry");
			return;
		}
		placeMarker(place.geometry.location);
		if (place.geometry.viewport) {
			map.fitBounds(place.geometry.viewport);
		}
		else {
			map.setCenter(place.geometry.location);
			map.setZoom(17); // Why 17? Because it looks good.
		}
	});
	
	

	var goToUserLocation = function() {
		console.log("line 800 ");
	    if (navigator.geolocation && map != undefined) {
	        navigator.geolocation.getCurrentPosition(function(position){
	        	var pos = {
			        lat: position.coords.latitude,
			        lng: position.coords.longitude
			    };
			    var userLocationContentString = '<h1> You are HERE ! </h1>';
			    var infoWindow = new google.maps.InfoWindow({
					content: userLocationContentString
				});
				infoWindow.setPosition(pos);
				var marker = new google.maps.Marker({
				    position: pos,
				    map: map,
				    title: 'Hello World!'
				  });
				infoWindow.open(map, marker);
				map.setCenter(pos);
	        });
	    } else {
	    	alert("Geolocation is not supported by this browser.");
	    }
	}
	
	$('#userLocation').click(function(){
		goToUserLocation();
	});
}

function placeMarker(location) {
	placeAMarker(location.lat(), location.lng());
}

function placeAMarker(lat, lng) {
	var latlng = {
		lat: lat,
		lng: lng
	};
	// if (document.getElementById('pac-input').value !== "") {
	// 	putMarker(document.getElementById('pac-input').value);
	// 	document.getElementById('pac-input').value = "";
	// }
	// else {
	geocoder.geocode({
		'location': latlng
	}, function(results, status) {
		if (status === google.maps.GeocoderStatus.OK) {
			if (results[0]) {
				var result = (results[1].formatted_address === '台灣臺北' || results[1].formatted_address === 'Taipei, Taiwan') ? results[0] : results[1];
				putMarker(result.formatted_address);

			}
			else {
				window.alert('No results found');
			}
		}
		else {
			window.alert('Geocoder failed due to: ' + status);
		}
	});
	// }

	function putMarker(content) {
		var marker = new google.maps.Marker({
			position: latlng,
			map: map,
			draggable: true
		});
		marker.address = content;
		var data = "<li><span>" + content + "</span><div class=cancel></div></li>"
		$('#location ul').append(data);
		array.push(marker);
		calculateAndDisplayRoute();

		google.maps.event.addListener(marker, 'dragend', function(event) {
			/*infowindow.close();
			infowindow = new google.maps.InfoWindow({content:result.formatted_address});
			infowindow.open(map, marker);*/
			//alert(this.position.lat() + ", " + this.position.lng()ng());
			for (var i = 0; i < array.length; i++) {
				if (array[i] === marker) {
					var newlatlng = {
						lat: marker.position.lat(),
						lng: marker.position.lng()
					}
					decodeName(newlatlng, i);
				}
			}
			calculateAndDisplayRoute();
		});


		$('.cancel').click(function() {
			var idx = $(this).parent().index();
			cancelMarker(idx);
		});

		$(function() {
			var startPos;
			var endPos;
			$(".sortable").sortable({
				start: function(event, ui) {
					startPos = ui.item.index();
				},
				stop: function(event, ui) {
					endPos = ui.item.index();
					moveArray(startPos, endPos);
					calculateAndDisplayRoute();
				}
			});
		});
	}
}

$(document).ready(function() {
	$('#cover').click(function() {
		$('#cover').fadeOut(1000);
	});

	$('.menuBtn').click(function() {
		$('.menu').slideToggle();
	});

	$(window).resize(function() {
		if ($(window).width() > 767) {
			$(function() {
				$(".menu").show();
			});
		}
	});

	$('.tit1').click(function() {
		$(this).parent().children("ul").slideToggle();
		$(this).toggleClass("titclosed");
	});


	$('.block1 li').click(function() {
		$('.block1 li').removeClass('action');
		$(this).toggleClass('action');
		travelMode = modes[$(this).text()];
		if ($(this).text() === 'Ubike') {
			ubike = true;
			parking = false;
		} else if($(this).text() === 'Cbike') {
			cbike = true;
			parking = false;
		} else {
			ubike = false;
			cbike = false;
		}
		calculateAndDisplayRoute();
	});


	$('.block2 li').click(function() {
		$('.block1 li').removeClass('action');
		$('.block1 li').eq(0).toggleClass('action');
		$('.block2 li').removeClass('action');
		$(this).toggleClass('action');
		if (!$(this).hasClass('action')) return;
		travelMode = google.maps.TravelMode.DRIVING;
		optimizatonMode = $(this).index();
		if (optimizatonMode == 1) {
			parking = false;
			ubike = false;
			cbike = true;
		}
		if ($(this).text() == '我要停車!') {
			parking = true;
			ubike = false;
			cbike = true;
		}
		else {
			parking = false;
		}
		calculateAndDisplayRoute();
	});
	
	// $('#userLocation').click(goToUserLocation());
});

function AutoLength(text) {
	if (!text) return;
	if (text.value.length > text.size) {
		text.size = text.value.length + 2;
	}
	var wid = $(".search").outerWidth() / 2;
	$(".search").css("right", "calc(50% - " + wid + "px)");
}

function moveArray(start, end) {
	var first, second;
	var b;
	if (start <= end) {
		first = array.slice(0, start);
		second = array.slice(start + 1, end + 1);
		b = (first.concat(second));
		b.push(array[start]);
		array = b.concat(array.slice(end + 1, array.length));
	}
	else {
		first = array.slice(0, end);
		second = array.slice(end, start);
		b = first;
		b.push(array[start]);
		b = b.concat(second);
		array = b.concat(array.slice(start + 1, array.length));
	}
}

function decodeName(latlng, i) {
	geocoder.geocode({
		'location': latlng
	}, function(results, status) {
		if (status === google.maps.GeocoderStatus.OK)
			if (results[0]) {
				var newLocation = (results[1].formatted_address === '台灣臺北' || results[1].formatted_address === 'Taipei, Taiwan') ? results[0] : results[1];
				$("#location li span").eq(i).text(newLocation.formatted_address);
			}
	});
}

function calculateAndDisplayRoute() {
	for (var i = 0; i < featureMarker.length; ++i) {
		featureMarker[i].setMap(null);
	}
	featureMarker = [];
	var length = spiderMarker.length;
	for (var i = 0; i < length; i++) {
		spiderMarker[i].setMap(null);
	};
	spiderMarker = [];
	var length = batteryMarker.length;
	for (var i = 0; i < length; i++) {
		batteryMarker[i].setMap(null);
		batteryMarker[i] = null;

	};
	batteryMarker = [];

	if (array.length === 0) return;
	//treat one point as inquiry if ubike or parking option is enabled
	if (array.length === 1) {
		if (ubike) {
			return;
		}
		else if (parking) {
			return;
		}
		else if (cbike) {
			return;
		}
		else return;
	}


	var waypts = [];

	if (ubike) {
		var settings = {
			//can't be asyncronous since we want those ubike stops
			"async": false,
			"crossDomain": true,
			"url": "http://stock.elton.idv.tw/geo/ubike",
			"method": "POST",
			"headers": {},
			"data": {
				startLat: array[0].position.lat(),
				endLat: array[array.length - 1].position.lat(),
				startLng: array[0].position.lng(),
				endLng: array[array.length - 1].position.lng()
			}
		};
		$.ajax(settings).done(function(response) {
			//origin at the ubike stop nearest to user selected startpoint
			console.log(response)
			waypts.push({
				location: new google.maps.LatLng(parseFloat(response.startStop.lat), parseFloat(response.startStop.lng)),
				stopover: true
			});
			//way points selected by user
			for (var i = 1; i < array.length - 1; i++) {
				waypts.push({
					location: new google.maps.LatLng(array[i].position.lat(), array[i].position.lng()),
					stopover: true
				});
			}
			//destination at the ubike stop nearest to user selected endpoint
			waypts.push({
				location: new google.maps.LatLng(parseFloat(response.endStop.lat), parseFloat(response.endStop.lng)),
				stopover: true
			});
			//put Markers
			var ubikeStartMarker = new google.maps.Marker({
				position: {
					lat: parseFloat(response.startStop.lat),
					lng: parseFloat(response.startStop.lng)
				},
				map: map,
				icon: {
					url: 'img/ubike_resized.png',
					size: new google.maps.Size(47, 46),
					origin: new google.maps.Point(0, 0)
				},
				draggable: false
			})
			featureMarker.push(ubikeStartMarker);
			var startStopMessage = '站點名稱: <h1>' + response.startStop.sna + '</h1><br>目前可借: ' + response.startStop.sbi + ' 輛';
			var infowindow = new google.maps.InfoWindow({
				content: startStopMessage
			});
			google.maps.event.addListener(ubikeStartMarker, 'mouseover', (function(ubikeStartMarker, content, infowindow) {
				return function() {
					infowindow.setContent(content);
					infowindow.open(map, ubikeStartMarker);
				};
			})(ubikeStartMarker, startStopMessage, infowindow));
			google.maps.event.addListener(ubikeStartMarker, 'mouseout', (function(ubikeStartMarker, infowindow) {
				return function() {
					infowindow.close();
				};
			})(ubikeStartMarker, infowindow));

			var ubikeStopMarker = new google.maps.Marker({
				position: {
					lat: parseFloat(response.endStop.lat),
					lng: parseFloat(response.endStop.lng)
				},
				map: map,
				icon: {
					url: 'img/ubike_resized.png',
					size: new google.maps.Size(48, 48),
					origin: new google.maps.Point(0, 0)
				},
				draggable: false,
				zIndex: 10
			})
			featureMarker.push(ubikeStopMarker);
			var endStopMessage = '站點名稱: <h1>' + response.endStop.sna + '</h1><br>目前空位: ' + response.endStop.bemp + ' 輛';
			var infowindow = new google.maps.InfoWindow({
				content: endStopMessage
			});
			google.maps.event.addListener(ubikeStopMarker, 'mouseover', (function(ubikeStopMarker, content, infowindow) {
				return function() {
					infowindow.setContent(content);
					infowindow.open(map, ubikeStopMarker);
				};
			})(ubikeStopMarker, endStopMessage, infowindow));
			google.maps.event.addListener(ubikeStopMarker, 'mouseout', (function(ubikeStopMarker, infowindow) {
				return function() {
					infowindow.close();
				};
			})(ubikeStopMarker, infowindow));
		});
	}
	else if (cbike) {
		var settings = {
			//can't be asyncronous since we want those cbike stops
			"async": false,
			"crossDomain": true,
			"url": "http://stock.elton.idv.tw/geo/cbike",
			"method": "POST",
			"headers": {},
			"data": {
				startLat: array[0].position.lat(),
				endLat: array[array.length - 1].position.lat(),
				startLng: array[0].position.lng(),
				endLng: array[array.length - 1].position.lng()
			}
		};
		$.ajax(settings).done(function(response) {
			//origin at the cbike stop nearest to user selected startpoint
			console.log(response);
			waypts.push({
				location: new google.maps.LatLng(parseFloat(response.startStop.StationLat[0]), parseFloat(response.startStop.StationLon[0])),
				stopover: true
			});
			//way points selected by user
			for (var i = 1; i < array.length - 1; i++) {
				waypts.push({
					location: new google.maps.LatLng(array[i].position.lat(), array[i].position.lng()),
					stopover: true
				});
			}
			//destination at the cbike stop nearest to user selected endpoint
			waypts.push({
				location: new google.maps.LatLng(parseFloat(response.endStop.StationLat[0]), parseFloat(response.endStop.StationLon[0])),
				stopover: true
			});
			//put Markers
			var cbikeStartMarker = new google.maps.Marker({
				position: {
					lat: parseFloat(response.startStop.StationLat[0]),
					lng: parseFloat(response.startStop.StationLon[0])
				},
				map: map,
				icon: {
					url: 'img/bicycle19.png',
					size: new google.maps.Size(64, 64),
					origin: new google.maps.Point(0, 0)
				},
				draggable: false
			})
			featureMarker.push(cbikeStartMarker);
			var startStopMessage = '站點名稱: <h1>' + response.startStop.StationName[0] + '</h1><br>目前可借: ' + response.startStop.StationNums1[0] + ' 輛';
			var infowindow = new google.maps.InfoWindow({
				content: startStopMessage
			});
			google.maps.event.addListener(cbikeStartMarker, 'mouseover', (function(cbikeStartMarker, content, infowindow) {
				return function() {
					infowindow.setContent(content);
					infowindow.open(map, cbikeStartMarker);
				};
			})(cbikeStartMarker, startStopMessage, infowindow));
			google.maps.event.addListener(cbikeStartMarker, 'mouseout', (function(cbikeStartMarker, infowindow) {
				return function() {
					infowindow.close();
				};
			})(cbikeStartMarker, infowindow));

			var cbikeStopMarker = new google.maps.Marker({
				position: {
					lat: parseFloat(response.endStop.StationLat[0]),
					lng: parseFloat(response.endStop.StationLon[0])
				},
				map: map,
				icon: {
					url: 'img/bicycle19.png',
					size: new google.maps.Size(64, 64),
					origin: new google.maps.Point(0, 0)
				},
				draggable: false,
				zIndex: 10
			})
			featureMarker.push(cbikeStopMarker);
			var endStopMessage = '站點名稱: <h1>' + response.endStop.StationName[0] + '</h1><br>目前空位: ' + response.endStop.StationNums2[0] + ' 輛';
			var infowindow = new google.maps.InfoWindow({
				content: endStopMessage
			});
			google.maps.event.addListener(cbikeStopMarker, 'mouseover', (function(cbikeStopMarker, content, infowindow) {
				return function() {
					infowindow.setContent(content);
					infowindow.open(map, cbikeStopMarker);
				};
			})(cbikeStopMarker, endStopMessage, infowindow));
			google.maps.event.addListener(cbikeStopMarker, 'mouseout', (function(cbikeStopMarker, infowindow) {
				return function() {
					infowindow.close();
				};
			})(cbikeStopMarker, infowindow));
		});
	}
	else if (parking) {

	}
	else {
		for (var i = 1; i < array.length - 1; i++) {
			waypts.push({
				location: new google.maps.LatLng(array[i].position.lat(), array[i].position.lng()),
				stopover: true
			});
		}
		if (array.length <= 1) return;
	}
	if (optimizatonMode == 1) {
		var tempArray = [];
		for (var i = 0; i < array.length; i++) {
			tempArray.push({
				lat: array[i].position.lat(),
				lng: array[i].position.lng()
			});
		}
		var stringArray = batteryinfo.concat(tempArray);
		for (var i = 0; i < stringArray.length; i++) {
			console.log(stringArray[i]);
		}
		var settings = {
			"async": true,
			"crossDomain": true,
			"url": "http://stock.elton.idv.tw/geo/charge",
			"method": "POST",
			"headers": {},
			"data": {
				data: JSON.stringify(stringArray)
			}
		};

		$.ajax(settings).done(function(response) {
			var routes = response.route;
			var status = response.status;
			console.log(routes);
			waypts = [];
			batteryRoute = routes;
			for (var i = 1; i < routes.length - 1; i++) {
				if (routes[i].position != undefined) {
					waypts.push({
						location: new google.maps.LatLng(routes[i].position.lat(), routes[i].position.lng()),
						stopover: true
					});

				}
				else {
					if (routes[i].flag == undefined) {
						waypts.push({
							location: new google.maps.LatLng(routes[i].lat, routes[i].lng),
							stopover: true
						});
					}
					else if (routes[i].flag) {
						waypts.push({
							location: new google.maps.LatLng(routes[i].lat, routes[i].lng),
							stopover: true
						});
						setBatteryMarkers(i);

					}
				}
			}
			directionsService.route({
				origin: new google.maps.LatLng(array[0].position.lat(), array[0].position.lng()),
				destination: new google.maps.LatLng(array[array.length - 1].position.lat(), array[array.length - 1].position.lng()),
				waypoints: waypts,
				travelMode: travelMode
			}, function(response, status) {
				if (status === google.maps.DirectionsStatus.OK) {
					if(showDisease){
					var data = response.routes[0].overview_path;
					var latlng = [];
					for (var x = 0; x < data.length; x++) {
						latlng.push({
							L: data[x].lat(),
							H: data[x].lng()
						});
					}
					var settings = {
						"async": true,
						"crossDomain": true,
						"url": "http://stock.elton.idv.tw/geo/lineString",
						"method": "POST",
						"headers": {},
						"data": {
							data: JSON.stringify(latlng)
						}
					};

					$.ajax(settings).done(function(response) {
						var jsonIntersection = response;
						intersections = [];
						for (var i = 0; i < jsonIntersection.length; i++) {
							intersections.push([jsonIntersection[i].properties.name, jsonIntersection[i].geometry.coordinates[1],
								jsonIntersection[i].geometry.coordinates[0], jsonIntersection[i].properties.amount
							]);
						}
						setSpiderMarkers();
					});}
					directionsDisplay.setMap(map);
					directionsDisplay.setOptions({
						suppressMarkers: true
					});
					directionsDisplay.setDirections(response);
				}
				else {
					window.alert('Directions request failed due to ' + status);
				}
			});
		});
	}
	else {

		directionsService.route({
			origin: new google.maps.LatLng(array[0].position.lat(), array[0].position.lng()),
			destination: new google.maps.LatLng(array[array.length - 1].position.lat(), array[array.length - 1].position.lng()),
			waypoints: waypts,
			travelMode: travelMode
		}, function(response, status) {
			if (status === google.maps.DirectionsStatus.OK) {
				if(showDisease){
					var data = response.routes[0].overview_path;
					var latlng = [];
					for (var x = 0; x < data.length; x++) {
						latlng.push({
							L: data[x].lat(),
							H: data[x].lng()
						});
					}
					var settings = {
						"async": true,
						"crossDomain": true,
						"url": "http://stock.elton.idv.tw/geo/lineString",
						"method": "POST",
						"headers": {},
						"data": {
							data: JSON.stringify(latlng)
						}
					};
	
					$.ajax(settings).done(function(response) {
						var jsonIntersection = response;
						intersections = [];
						for (var i = 0; i < jsonIntersection.length; i++) {
							intersections.push([jsonIntersection[i].properties.name, jsonIntersection[i].geometry.coordinates[1],
								jsonIntersection[i].geometry.coordinates[0], jsonIntersection[i].properties.amount
							]);
						}
						setSpiderMarkers();
					});
				}
				directionsDisplay.setMap(map);
				directionsDisplay.setOptions( { suppressMarkers: true } );
				directionsDisplay.setDirections(response);
			}
			else {
				window.alert('Directions request failed due to ' + status);
			}
		});
	}
}

function cancelMarker(idx) {
	if (idx == -1) return;
	array[idx].setMap(null);
	array.splice(idx, 1);
	$('#locations li').eq(idx).remove();
	calculateAndDisplayRoute();
	if (array.length <= 1) {
		directionsDisplay.setMap(null)
	}
}



function setSpiderMarkers() {
	for (var i = 0; i < intersections.length; i++) {
		var intersection = intersections[i];
		var marker = new google.maps.Marker({
			position: {
				lat: intersection[1],
				lng: intersection[2]
			},
			map: map,
			icon: {
				url: 'img/red.png', //在下面判定人數後指定
				// This marker is 20 pixels wide by 32 pixels high.
				size: new google.maps.Size(47, 46),
				// The origin for this image is (0, 0).
				origin: new google.maps.Point(0, 0),
				// The anchor for this image is the base of the flagpole at (0, 32).
				anchor: new google.maps.Point(23.5, 31.5),
				// scaledSize: new google.maps.Size(22, 20),
			},
			shape: {
				coords: [1, 1, 1, 40, 40, 40, 40, 1],
				type: 'poly'
			},
			title: intersection[0],
			//zIndex: intersection[3] //數字越大越上層
		});
		spiderMarker.push(marker);

		//////針對不同疫情，marker作顏色(紅黃綠)三級差別
		var patientNum = intersection[3];
		if (patientNum > 10000) {}
		else if (patientNum > 1000) {
			marker.icon.url = 'img/orange.png';
		}
		else if (patientNum > 50) {
			marker.icon.url = 'img/yellow.png';
		}
		else if (patientNum > 10) {
			marker.icon.url = 'img/purple.png';
		}
		else {
			marker.icon.url = 'img/blue.png';
		}
		///////////////  差別 end

		///// infowindow start /////
		var diseaseContentString = '<h1>' + intersection[0] + '有登革熱>口<</h1> 案例: ' + patientNum + ' 人';

		var infowindow = new google.maps.InfoWindow({
			content: diseaseContentString
		});

		google.maps.event.addListener(marker, 'mouseover', (function(marker, content, infowindow) {
			return function() {
				infowindow.setContent(content);
				infowindow.open(map, marker);
			};
		})(marker, diseaseContentString, infowindow));

		// assuming you also want to hide the infowindow when user mouses-out
		google.maps.event.addListener(marker, 'mouseout', (function(marker, infowindow) {
			return function() {
				infowindow.close();
			};
		})(marker, infowindow));
		///// infowindow end ////
		//使marker跳躍
		marker.setAnimation(google.maps.Animation.BOUNCE);
	}
}


function setBatteryMarkers(i) {
	var point = batteryRoute[i];
	var marker = new google.maps.Marker({
		position: {
			lat: point.lat,
			lng: point.lng
		},
		map: map,
		icon: {
			url: 'img/battery.png', //在下面判定人數後指定
			// This marker is 20 pixels wide by 32 pixels high.
			size: new google.maps.Size(47, 46),
			// The origin for this image is (0, 0).
			origin: new google.maps.Point(0, 0),
			// The anchor for this image is the base of the flagpole at (0, 32).
			anchor: new google.maps.Point(23.5, 31.5),
			// scaledSize: new google.maps.Size(22, 20),
		},
		shape: {
			coords: [1, 1, 1, 40, 40, 40, 40, 1],
			type: 'poly'
		},
		title: '充電站',
		//zIndex: intersection[3] //數字越大越上層
	});
	batteryMarker.push(marker);

	var diseaseContentString = '<h1>' + point.name + '</h1>' + point.address;

	var infowindow = new google.maps.InfoWindow({
		content: diseaseContentString
	});

	google.maps.event.addListener(marker, 'mouseover', (function(marker, content, infowindow) {
		return function() {
			infowindow.setContent(content);
			infowindow.open(map, marker);
		};
	})(marker, diseaseContentString, infowindow));

	// assuming you also want to hide the infowindow when user mouses-out
	google.maps.event.addListener(marker, 'mouseout', (function(marker, infowindow) {
		return function() {
			infowindow.close();
		};
	})(marker, infowindow));
	///// infowindow end ////
	//使marker跳躍
	marker.setAnimation(google.maps.Animation.BOUNCE);
}


// submit the data that the user  input
$('#submit').click(function() {
	batteryinfo[0] = $('#distance').val();
	batteryinfo[1] = $('#power').val();
	$("body, #modal-content, #modal-background").toggleClass("active");
});

$('#disease').click(function(){
	if(showDisease){
		showDisease = false;
		for(var i = 0; i < spiderMarker.length; i++){
			spiderMarker[i].setMap(null);
		}
	}else{
		showDisease = true;
		for(var i = 0; i < spiderMarker.length; i++){
			spiderMarker[i].setMap(map);
		}
	}
});

