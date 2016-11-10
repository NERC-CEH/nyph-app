/** ****************************************************************************
 * Main app configuration file.
 *****************************************************************************/
import { DateHelp, LocHelp } from 'helpers';

export default {
  // variables replaced on build
  /* global APP_VERSION, APP_BUILD, APP_NAME, REGISTER_URL, API_KEY, API_SECRET,
   REPORT_URL, STATISTICS_URL, RECORD_URL, APP_SECRET */
  version: APP_VERSION,
  build: APP_BUILD,
  name: APP_NAME,

  UNKNOWN_SPECIES: {
    id: 125442, //Plantae kingdom
    scientific_name: 'Unknown Flowering Plant',
    found_in_name: 'scientific_name'
  },
  /**
   * if set then limit dates to the range specified by MIN_RECORDING_DATE, MAX_RECORDING_DATE
   */
  ENFORCE_DATE_CONSTRAINT: false,
  MIN_RECORDING_DATE: new Date(2017,0,1),
  MAX_RECORDING_DATE: new Date(2017,0,4,23,59),

  gps_accuracy_limit: 100,

  // logging
  log: {
    states: ['e', 'w'], // see log helper
    ga_error: true,
  },

  // google analytics
  ga: {
    status: true,
    ID: 'UA-58378803-9',
  },

  login: {
    url: 'https://www.brc.ac.uk/irecord/user/mobile/register',
    timeout: 30000,
  },

  report: {
    url: 'http://www.brc.ac.uk/irecord/mobile/report',
    timeout: 80000,
  },

  // mapping
  map: {
    os_api_key: '3AE71B01F6EE4829E0530C6CA40A35B3',
    mapbox_api_key: 'pk.eyJ1IjoiY2VoYXBwcyIsImEiOiJjaXBxdTZyOWYwMDZoaWVuYjI3Y3Z0a2x5In0.YXrZA_DgWCdjyE0vnTCrmw',
    mapbox_osm_id: 'cehapps.0fenl1fe',
    mapbox_satellite_id: 'cehapps.0femh3mh',
  },

  // morel configuration
  morel: {
    manager: {
      url: 'https://www.brc.ac.uk/irecord/mobile/submit',
      appname: API_KEY,
      appsecret: API_SECRET,
      website_id: 23,
      survey_id: 427,
      input_form: 'enter-app-record',
    },
    sample: {
      location: {
        values(location, options) {
          // convert accuracy for map and gridref sources
          let accuracy = location.accuracy;
          if (location.source !== 'gps') {
            if (location.source === 'map') {
              accuracy = LocHelp.mapZoom2meters(location.accuracy);
            } else {
              accuracy = null;
            }
          }

          const attributes = {
            location_name: location.name,
            location_source: location.source,
            location_gridref: location.gridref,
            location_altitude: location.altitude,
            location_altitude_accuracy: location.altitudeAccuracy,
            location_accuracy: accuracy,
          };

          // add other location related attributes
          options.flattener(attributes, options);

          return location.latitude + ', ' + location.longitude;
        },
      },
      location_accuracy: { id: 282 },
      location_altitude: { id: 283 },
      location_altitude_accuracy: { id: 284 },
      location_source: { id: 760 },
      location_gridref: { id: 335 },

      device: {
        id: 273,
        values: {
          iOS: 2398,
          Android: 2399,
        },
      },

      device_version: { id: 759 },

      date: {
        values(date) {
          return DateHelp.print(date);
        },
      },
    },
    occurrence: {
      training: {
        id: 'training',
      },

      taxon: {
        values(taxon) {
          return taxon.warehouse_id;
        },
      },
      identifiers: {
        id: 18,
      },
    },
  },
};
