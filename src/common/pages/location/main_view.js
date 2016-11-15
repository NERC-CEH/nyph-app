/** ****************************************************************************
 * Location main view.
 *****************************************************************************/
import $ from 'jquery';
import Marionette from 'backbone.marionette';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/layers-2x.png';
import 'leaflet/dist/images/layers.png';
import OSLeaflet from 'os-leaflet';
import GridRef from 'leaflet.gridref';
import { OsGridRef } from 'geodesy';
import JST from 'JST';
import { LocHelp, StringHelp } from 'helpers';
import CONFIG from 'config';
import 'typeahead';
import mapMarker from './map_view_marker';
import locationNameFinder from './location_name_search';

const DEFAULT_LAYER = 'OS';
const DEFAULT_CENTER = [53.7326306, -2.6546124];
const MAX_OS_ZOOM = L.OSOpenSpace.RESOLUTIONS.length - 1;
const OS_ZOOM_DIFF = 6;
const OS_CRS = L.OSOpenSpace.getCRS(); // OS maps use different projection

const GRID_STEP = 100000; // meters

import './styles.scss';

const LocationView = Marionette.View.extend({
  template: JST['common/location/location'],

  triggers: {
    'click #gps-button': 'gps:click',
  },
  
  events: {
    'change #location-name': 'changeName',
    'typeahead:select #location-name': 'changeName',
	  'change #location-gridref': 'changeGridRef',
    'keyup #location-gridref': 'keyupGridRef',
    //'click #gps-button': 'geolocationStart',
  },

  changeName(e) {
    this.triggerMethod('location:name:change', $(e.target).val());
  },
  
  /**
   * after delay, if gridref is valid then apply change
   */
  keyupGridRef(e) {
    switch (e.keyCode) {
      case 13:
      // press Enter
      case 38:
      // Up
      case 40:
        // Down
        break;
      default:
        // Other
        let gr = e.target.value.replace(/\s+/g, '').toUpperCase();
        
        if (gr === this._getCurrentLocation().gridref) {
          return; // gridref hasn't changed meaningfully
        }
        
        if (gr === '' || LocHelp.grid2coord(gr)) {
          // gr syntax ok (or blank)
          
          this._refreshGrErrorState(false);
          
          // Clear previous timeout
          this._clearGrTimeout();

          const that = this;
          // Set new timeout - don't run if user is typing
          this.grRefreshTimeout = setTimeout(function () {
            // let controller know
            that.trigger('location:gridref:change', gr);
          }, 200);
        } else {
          this._refreshGrErrorState(true);
        }
    }
  },
  
  /**
   * stop any delayed gridref refresh
   */
  _clearGrTimeout() {
    if (this.grRefreshTimeout) {
      clearTimeout(this.grRefreshTimeout);
      this.grRefreshTimeout = null;
    }
  },
  
  changeGridRef(e) {
    this._clearGrTimeout();
    this.triggerMethod('location:gridref:change', $(e.target).val());
  },

  initialize() {
    this.map = null;
    this.layers = this._getLayers();

    this.currentLayerControlSelected = false;
    this.currentLayer = null;
    this.markerAdded = false;
    
    const recordModel = this.model.get('recordModel');
    
    //this.listenTo(recordModel, 'geolocation:start geolocation:stop geolocation:error', this.render);
    this.listenTo(recordModel, 'geolocation:start', this.geolocationStart);
    this.listenTo(recordModel, 'geolocation:stop', this.geolocationStop);
    this.listenTo(recordModel, 'geolocation:error', this.geolocationError);
    this.listenTo(recordModel, 'geolocation:update', this.geolocationUpdate);
    this.listenTo(recordModel, 'geolocation:success', this.geolocationSuccess);
    this.listenTo(recordModel, 'change:location', this.locationChange);
  },

  onAttach() {
    // set full remaining height
    const mapHeight = $(document).height() - 47 - 47 - 44;// - 47 - 38.5;
    this.$container = this.$el.find('#map')[0];
    $(this.$container).height(mapHeight);

    this.initMap();
    this.addLocationNameSearch();
  },

  addLocationNameSearch() {
    this.$el.find('.typeahead').typeahead({
      hint: false,
      highlight: false,
      minLength: 0,
    },
      {
        limit: 3,
        name: 'names',
        source: locationNameFinder(3),
      });
  },

  initMap() {
    this.map = L.map(this.$container);

    // default layer
    this.currentLayer = this._getCurrentLayer();
    if (this.currentLayer === 'OS') this.map.options.crs = OS_CRS;

    // position view
    this.map.setView(this._getCenter(), this._getZoomLevel());

    // show default layer
    this.layers[this.currentLayer].addTo(this.map);
    this.$container.dataset.layer = this.currentLayer; // fix the lines between the tiles

    this.map.on('baselayerchange', this._updateCoordSystem, this);
    this.map.on('zoomend', this.onMapZoom, this);

    // Controls
    this.addControls();

    // Marker
    this.addMapMarker();

    // Graticule
    this.addGraticule();
  },

  _getLayers() {
    const layers = {};
    layers.Satellite = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      id: CONFIG.map.mapbox_satellite_id,
      accessToken: CONFIG.map.mapbox_api_key,
      tileSize: 256, // specify as, OS layer overwites this with 200 otherwise,
      minZoom: 5,
    });

    layers.OSM = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      id: CONFIG.map.mapbox_osm_id,
      accessToken: CONFIG.map.mapbox_api_key,
      tileSize: 256, // specify as, OS layer overwites this with 200 otherwise
      minZoom: 5,
    });

    const start = OsGridRef.osGridToLatLon(OsGridRef(0, 0));
    const end = OsGridRef.osGridToLatLon(OsGridRef(7 * GRID_STEP, 13 * GRID_STEP));
    const bounds = L.latLngBounds([start.lat, start.lon], [end.lat, end.lon]);

    layers.OS = L.tileLayer.OSOpenSpace(CONFIG.map.os_api_key);

    layers.OS.options.bounds = bounds;

    layers.OS.on('tileerror', (tile) => {
      let index = 0;
      const result = tile.tile.src.match(/missingTileString=(\d+)/i);
      if (result) {
        index = parseInt(result[1], 10);
        index++;

        // don't do it more than few times
        if (index < 4) {
          tile.tile.src = tile.tile.src.replace(/missingTileString=(\d+)/i, '&missingTileString=' + index);
        }
      } else {
        if (index === 0) {
          tile.tile.src = tile.tile.src + '&missingTileString=' + index;
        }
      }
    });
    return layers;
  },

  _getCurrentLayer() {
    let layer = DEFAULT_LAYER;
    const zoom = this._getZoomLevel();
    const currentLocation = this._getCurrentLocation();
    const inUK = LocHelp.isInUK(currentLocation);
    if (zoom > MAX_OS_ZOOM - 1) {
      layer = 'Satellite';
    } else if (inUK === false) {
      this.currentLayerControlSelected = true;
      layer = 'Satellite';
    }

    return layer;
  },

  _getCenter() {
    const currentLocation = this._getCurrentLocation();
    let center = DEFAULT_CENTER;
    if (currentLocation.latitude) {
      center = [currentLocation.latitude, currentLocation.longitude];
    }
    return center;
  },

  addControls() {
    this.controls = L.control.layers({
      OS: this.layers.OS,
      OSM: this.layers.OSM,
      Satellite: this.layers.Satellite,
    }, {});
    this.map.addControl(this.controls);
  },

  addGraticule() {
    const appModel = this.model.get('appModel');
    const useGridRef = appModel.get('useGridRef');
    const useGridMap = appModel.get('useGridMap');
    if (!useGridRef || !useGridMap) return;

    const that = this;

    function getColor() {
      'use strict';
      let color;
      switch (that.currentLayer) {
        case 'OS':
          color = '#08b7e8';
          break;
        case 'OSM':
          color = 'gray';
          break;
        default:
          color = 'white';
      }
      return color;
    }

    const gridRef = new L.GridRef({ color: getColor() });

    gridRef.update = () => {
      let zoom = that.map.getZoom();
      // calculate granularity
      const color = getColor();
      if (that.currentLayer === 'OS') zoom += OS_ZOOM_DIFF;

      const bounds = that.map.getBounds();
      const granularity = gridRef._getGranularity(zoom);
      const step = GRID_STEP / granularity;

      const polylinePoints = gridRef._calcGraticule(step, bounds);
      gridRef.setStyle({ color });
      gridRef.setLatLngs(polylinePoints);
    };
    gridRef.addTo(this.map);
  },
  
  _normalize_zoom_by_layer(zoom) {
    if (this.currentLayer && this.currentLayer === 'OS') {
      zoom += OS_ZOOM_DIFF;
      
      if (zoom > MAX_OS_ZOOM - 1) {
        zoom = MAX_OS_ZOOM - 1;
      }
    } 
    
    return zoom;
  },

  /**
   * 1 gridref digits. (10000m)  -> < 3 map zoom lvl
   * 2 gridref digits. (1000m)   -> 5
   * 3 gridref digits. (100m)    -> 7
   * 4 gridref digits. (10m)     -> 9
   * 5 gridref digits. (1m)      ->
   */
  _getZoomLevel() {
    const currentLocation = this._getCurrentLocation();
    let mapZoomLevel = 1;
    // check if record has location
    if (currentLocation.latitude && currentLocation.longitude) {
      // transform location accuracy to map zoom level
      switch (currentLocation.source) {
        case 'map':
          mapZoomLevel = currentLocation.mapZoom || 1;
          
          // no need to show area as it would be smaller than the marker
          break;
        case 'gps':
          /**
           * 1 gridref digits. (10000m)  -> 4 OS map zoom lvl
           * 2 gridref digits. (1000m)   -> 8 OS
           * 3 gridref digits. (100m)    -> 16 OSM
           * 4 gridref digits. (10m)     -> 18 OSM
           * 5 gridref digits. (1m)      ->
           */
          if (currentLocation.accuracy) {
            if (currentLocation.accuracy > 1000) {
              mapZoomLevel = 4;
            } else if (currentLocation.accuracy > 100) {
              mapZoomLevel = 8;
            } else if (currentLocation.accuracy > 10) {
              mapZoomLevel = 16;
            } else {
              mapZoomLevel = 18;
            }
          } else {
            mapZoomLevel = 1;
          }
          break;
        case 'gridref':
          if (currentLocation.accuracy < (MAX_OS_ZOOM - 1)) {
            mapZoomLevel = currentLocation.accuracy + 1;
          } else {
            // normalize to OSM zoom
            mapZoomLevel = 18;
          }

          break;
        default:
          mapZoomLevel = MAX_OS_ZOOM - 2;
      }
    }
    //return this._normalize_zoom_by_layer(mapZoomLevel);
    return mapZoomLevel;
  },

  _updateCoordSystem(e) {
    this.currentLayerControlSelected = this.controls._handlingClick;

    const center = this.map.getCenter();
    let zoom = this.map.getZoom();
    this.map.options.crs = e.name === 'OS' ? OS_CRS : L.CRS.EPSG3857;
    if (e.name === 'OS') {
      zoom -= OS_ZOOM_DIFF;
      if (zoom > MAX_OS_ZOOM - 1) {
        zoom = MAX_OS_ZOOM - 1;
      }
    } else if (this.currentLayer === 'OS') {
      zoom += OS_ZOOM_DIFF;
    }
    this.currentLayer = e.name;
    this.map.setView(center, zoom, { reset: true });
    this.$container.dataset.layer = this.currentLayer; // fix the lines between the tiles
  },

  onMapZoom() {
    const zoom = this.map.getZoom();
    const inUK = LocHelp.isInUK(this._getCurrentLocation());

    // -2 and not -1 because we ignore the last OS zoom level
    if (zoom > MAX_OS_ZOOM - 1 && this.currentLayer === 'OS') {
      this.map.removeLayer(this.layers.OS);
      this.map.addLayer(this.layers.Satellite);
    } else if ((zoom - OS_ZOOM_DIFF) <= MAX_OS_ZOOM - 1 && this.currentLayer === 'Satellite') {
      // only change base layer if user is on OS and did not specificly
      // select OSM/Satellite
      if (!this.currentLayerControlSelected && inUK !== false) {
        this.map.removeLayer(this.layers.Satellite);
        this.map.addLayer(this.layers.OS);
      }
    }
  },
  
  geolocationStart() {
    this._set_gps_progress_feedback('pending');
  },
  
  /**
   * Update the temporary location fix
   * @param location
   */
  geolocationUpdate(location) {
    this.locationUpdate = location;
    this._set_gps_progress_feedback('pending');
  },

  geolocationSuccess(location) {
    this.locationUpdate = location;
    this._set_gps_progress_feedback('fixed');
  },
  
  geolocationStop() {
    this._set_gps_progress_feedback('');
  },
  
  geolocationError() {
    this._set_gps_progress_feedback('failed');
  },
  
  _set_gps_progress_feedback(state) {
    const gpsButtonEl = document.getElementById('gps-button');
    if (gpsButtonEl) {
      gpsButtonEl.setAttribute('data-gps-progress', state);
    }
  },
  
  _refreshGrErrorState(isError) {
    const grInputEl = document.getElementById('location-gridref');
    if (grInputEl) {
      if (isError) {
        grInputEl.setAttribute('data-gr-error', 'error');
        this._removeMapMarker();
      } else {
        grInputEl.removeAttribute('data-gr-error');
      }
    }
  },
  
  locationChange() {
    this._clearGrTimeout();
    const location = this._getCurrentLocation();
    
    this._refreshGrErrorState(false);
    
    this.updateMapMarker(location);
    
    this.map.setView(this._getCenter(), location.source !== 'map' ? this._getZoomLevel() : null);
    this._refreshGridRefElement(location);
  },

  _getCurrentLocation() {
    return this.model.get('recordModel').get('location') || {};
  },
  
  _refreshGridRefElement(location) {
    // rather than full refresh of the view, directly update the relavant input element
    const grEl = document.getElementById('location-gridref');
    grEl.value = location.gridref;
    grEl.setAttribute('data-source', location.source);
    
    const gpsButtonEl = document.getElementById('gps-button');
    if (gpsButtonEl) {
      gpsButtonEl.setAttribute('data-source', location.source);
      
      if (location.source !== 'gps') {
        this._set_gps_progress_feedback('');
      }
    }
  },

  serializeData() {
    const location = this._getCurrentLocation();
    let gridref;

    // avoid testing location.longitude as this can validly be zero within the UK
    if (location.source !== 'gridref' && location.latitude) {
      gridref = LocHelp.coord2grid(location);
    } else {
      gridref = location.gridref;
    }

    return {
      name: location.name,
      gridref: gridref,
      locationSource: location.source,
      accuracy: location.accuracy,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracyLimit: CONFIG.gps_accuracy_limit, // TODO: get from GPS
    };
  },
});

export default LocationView.extend(mapMarker);