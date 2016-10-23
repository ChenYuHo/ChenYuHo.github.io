var map;
var places;
var geocoder = new google.maps.Geocoder;
var directionsService = new google.maps.DirectionsService;
var directionsDisplay = new google.maps.DirectionsRenderer;
// Array of markers
var array = [];
var spiderMarker = [];

var intersections = [];

// Default travel mode of the map
var travelMode = google.maps.TravelMode.WALKING;
// Mode map from chinese to google map travel mode
var modes = {
	"自行開車": google.maps.TravelMode.DRIVING,
	"大眾運輸": google.maps.TravelMode.TRANSIT,
	"走路": google.maps.TravelMode.WALKING
}

google.maps.event.addDomListener(window, 'load', initialize);

function initialize() {
	var mapProp = {
		center: new google.maps.LatLng(25.038051, 121.548524),
		zoom: 10,
		mapTypeControl: false,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};

	map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
	directionsDisplay.setMap(map);
	places = new google.maps.places.PlacesService(map);
	google.maps.event.addListener(map, 'click', function(event) {
		placeMarker(event.latLng);
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
	geocoder.geocode({
		'location': latlng
	}, function(results, status) {
		if (status === google.maps.GeocoderStatus.OK) {
			if (results[0]) {
				var result = (results[1].formatted_address === '台灣臺北' || results[1].formatted_address === 'Taipei, Taiwan') ? results[0] : results[1];
				var marker = new google.maps.Marker({
					position: latlng,
					map: map,
					draggable: true
				});
				var data = "<li><span>" + result.formatted_address + "</span><div class=cancel></div></li>"
				$('#location ul').append(data);
				array.push(marker);
				calculateAndDisplayRoute();

				google.maps.event.addListener(marker, 'dragend', function(event) {
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
			else {
				window.alert('No results found');
			}
		}
		else {
			window.alert('Geocoder failed due to: ' + status);
		}
	});
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
		calculateAndDisplayRoute();
	});
});

function AutoLength(text) {
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
	var length = spiderMarker.length;
	for (var i = 0; i < length; i++) {
		spiderMarker[i].setMap(null);
		spiderMarker[i] = null;

	};
	spiderMarker = [];
	var waypts = [];
	for (var i = 1; i < array.length - 1; i++) {
		waypts.push({
			location: new google.maps.LatLng(array[i].position.lat(), array[i].position.lng()),
			stopover: true
		});
	}
	if (array.length <= 1) return;
	
	directionsService.route({
		origin: new google.maps.LatLng(array[0].position.lat(), array[0].position.lng()),
		destination: new google.maps.LatLng(array[array.length - 1].position.lat(), array[array.length - 1].position.lng()),
		waypoints: waypts,
		travelMode: travelMode
	}, function(response, status) {
		if (status === google.maps.DirectionsStatus.OK) {
			var data = response.routes[0].overview_path;
			var latlng=[];
			for(var x=0;x<data.length;x++){
				latlng.push({L:data[x].lat(),H:data[x].lng()});
			}
			var settings = {
				"async": true,
				"crossDomain": true,
				"url": "http://stock.chenyuho.com/geo/lineString",
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
				setMarkers();
			});
			directionsDisplay.setMap(map);
			directionsDisplay.setDirections(response);
		}
		else {
			window.alert('Directions request failed due to ' + status);
		}
	});
}

function cancelMarker(idx) {
	if (idx == -1) return;
	array[idx].setMap(null);
	array.splice(idx, 1);
	$('#locations li').eq(idx).remove();
	calculateAndDisplayRoute();
	if(array.length<=1){
		directionsDisplay.setMap(null)
	}
}



function setMarkers() {
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
		if (patientNum > 10000) {
		}
		else if (patientNum > 1000) {
			marker.icon.url = 'img/orange.png';
		}
		else if (patientNum > 50) {
			marker.icon.url = 'img/yellow.png';
		}
		else if (patientNum > 10) {
			marker.icon.url = 'img/purple.png';
		}
		else  {
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
		// google.maps.event.addListener(marker, 'mouseout', (function(marker, infowindow) {
		// 	return function() {
		// 		infowindow.close();
		// 	};
		// })(marker, infowindow));
		///// infowindow end ////
		
		//使marker跳躍
		marker.setAnimation(google.maps.Animation.BOUNCE);
	}
}