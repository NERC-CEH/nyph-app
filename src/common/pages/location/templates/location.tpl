<div class="input-group">
  <div class="input-row">
    <button id="gps-button" class="btn btn-positive btn-gps" data-source="<%- obj.locationSource %>" title="refresh GPS location">GPS</button>
    <label class="media-object pull-left icon icon-location" for="location-gridref" />
    <input type="text" id="location-gridref" placeholder="Grid Reference" value="<%- obj.gridref %>" data-source="<%- obj.locationSource %>" />
  </div>
  <div class="input-row tt">
    <label class="media-object pull-left icon icon-address" for="location-name" />
    <input class="typeahead" type="text" id="location-name" placeholder="Nearest named place" value="<%= obj.name %>"/>
  </div>
</div>

<div id="map-container">
  <div id="map"></div>
</div>
