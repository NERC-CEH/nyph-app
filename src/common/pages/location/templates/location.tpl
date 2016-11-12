<div class="input-group">
  <div class="input-row">
    <label class="media-object pull-left icon icon-location"></label>
    <input type="text" id="location-gridref" placeholder="Grid Reference" value="<%- obj.gridref %>" />
  </div>
  <div class="input-row tt">
    <label class="media-object pull-left icon icon-address"></label>
    <input class="typeahead" type="text" id="location-name" placeholder="Nearest Named Place" value="<%= obj.name %>"/>
  </div>
</div>

<div id="map-container">
  <div id="map"></div>
</div>
