var trackLoc = true;
var notifications = true;
var zoom = 17;

var mapElements = [];

function initMap () {
  var map = new google.maps.Map(document.getElementById('map'), {
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
      mapTypeIds: [
        google.maps.MapTypeId.ROADMAP,
        google.maps.MapTypeId.HYBRID,
        google.maps.MapTypeId.SATELLITE,
        google.maps.MapTypeId.TERRAIN
      ]
    },
    scrollwheel: true,
    rotateControl: true,
    tilt: 45,
    streetViewControl: true,
    center: {
      lat:34.0201813,
      lng:-118.6919205
    }
  });

  var currentLocationMarker = new google.maps.Marker({
    visible: false,
    draggable: false,
    icon: {
      url:"static/images/currLocMarker.png",
      scaledSize: new google.maps.Size(30,30),
      anchor: new google.maps.Point(15,15)
    },
    map: map
  });
  var currLoc;
  navigator.geolocation.watchPosition(function(location) {
   currLoc = {
      lat: location.coords.latitude,
      lng: location.coords.longitude
    };
    if(trackLoc) {
      map.setCenter(currLoc);
      map.setZoom(zoom);
    }
    currentLocationMarker.setPosition(currLoc);
    currentLocationMarker.setVisible(true);
    var keepVisible = false;
    for(var i = 0; i<mapElements.length; i++) {

      newDistance = Math.sqrt(Math.pow(currLoc.lat-mapElements[i].coordinates[1],2)+Math.pow(currLoc.lng-mapElements[i].coordinates[0],2));
      if(mapElements[i].distance!=undefined){
        if(Math.abs(newDistance-mapElements[i].distance)>0.00005) {
          if(mapElements[i].distance>newDistance)
            mapElements[i].closeStreak++;
          else
            mapElements[i].closeStreak=0;
          mapElements[i].distance = newDistance;
        }
      }
      if(mapElements[i].distance == undefined)
        mapElements[i].distance = newDistance;
      if(mapElements[i].closeStreak>3 && mapElements[i].distance<0.005) {
        $("#alertShortTitle").html(mapElements[i].description.split("|")[2]);
        $("#alertTitle").html(mapElements[i].name);
        $("#alertDescription").html(mapElements[i].description.split("|")[0]);
        $("#roadAlert").css("background-color", mapElements[i].description.split("|")[3]);
        $("#roadAlert").css("border-left-color", mapElements[i].description.split("|")[3]);
        $("#roadAlert").css("border-right-color", mapElements[i].description.split("|")[3]);
        $("#roadAlert").css("border-top-color", mapElements[i].description.split("|")[3]);
        $("#roadAlert").css("border-bottom-color", mapElements[i].description.split("|")[3]);
        $("#roadAlert").css("color", mapElements[i].description.split("|")[4]);
        $("#roadAlert").show();
        keepVisible = true;
      }
    }
    if(!keepVisible) {
      $("#roadAlert").hide();
    }
  });

  $('.alert .close').on('click', function(e) {
      $(this).parent().hide();
  });

  $.ajax({
    dataType: "xml",
    url: "static/mapdata/map.kml",
    success: function(data) {
      $(data).find('kml').find('Document').find('Folder').each(function(){
        $(this).find('Placemark').each(function() {
          if($(this).find('Point')[0]!=undefined) {
            var coordinates = $(this).find('Point').find('coordinates').text().split(',');
            mapElements.push({
              name: $(this).find('name').text(),
              coordinates: [
                coordinates[0],
                coordinates[1]
              ],
              description: $(this).find('description').text().substring(),
              closeStreak: 0,
              distance: undefined
            });
          }
        });
      });
      console.log(mapElements);
    }
  });

  var transitLayer = new google.maps.TransitLayer();
  transitLayer.setMap(map);

  var traffic = new google.maps.TrafficLayer({
    map: map
  });

  google.maps.event.addListener(map, "drag", function(event) {
    trackLoc = false;
    $("#recenterButton").show();
  });

  google.maps.event.addListener(map, "zoom_changed", function(event) {
    zoom = map.getZoom();
  });

  var infoLayer = new google.maps.KmlLayer({
    url: 'https://jonathandamico.me/Pilot/static/mapdata/map.kmz',
    map: map
  });

  google.maps.event.addListener(infoLayer, "status_changed", function(event) {
    zoom = 17;
    map.setZoom(zoom);
    map.setCenter(currLoc);
  });

  $("#recenterButton").click(function(){
    trackLoc = true;
    map.setCenter(currLoc);
    $("#recenterButton").hide();
  });

  var searchBox = new google.maps.places.SearchBox(document.getElementById('googlePlaceSearchBox'));
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();

    if (places.length == 0)
      return;

    places.forEach(function(place){
      originMarker.setPosition(place.geometry.location);
    });
    updateBounds();
    update();
  });
}
