/** ****************************************************************************
 * Location controller.
 *****************************************************************************/
import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
import Morel from 'morel';
import { Log, Validate, StringHelp, LocHelp } from 'helpers';
import App from 'app';

import recordManager from '../../record_manager';
import appModel from '../../models/app_model';
import MainView from './main_view';
import CONFIG from 'config';

import './styles.scss';

const API = {
  show(recordID) {
    recordManager.get(recordID, (err, recordModel) => {
      // Not found
      if (!recordModel) {
        App.trigger('404:show', { replace: true });
        return;
      }

      // can't edit a saved one - to be removed when record update
      // is possible on the server
      if (recordModel.getSyncStatus() === Morel.SYNCED) {
        App.trigger('records:show', recordID, { replace: true });
        return;
      }

      // MAIN
      const recordLocation = recordModel.get('location') || {};

      //const active = {};
      //if (!recordLocation.source) {
      //  active.gps = true;
      //} else {
      //  active[recordLocation.source] = true;
      //}

      const mainView = new MainView({
        model: new Backbone.Model({ recordModel, appModel }),
        vent: App,
      });

      function onLocationSelect(loc, createNew) {
        if (typeof loc !== 'object') {
          // jQuery event object bug fix
          Log('Location:Controller:onLocationSelect: loc is not an object', 'e');
          return;
        }

        let location = loc;
        // we don't need the GPS running and overwriting the selected location
        if (recordModel.isGPSRunning()) {
          recordModel.stopGPS({silent: true});
        }

        if (!createNew) {
          // extend old location to preserve its previous attributes like name or id
          let oldLocation = recordModel.get('location');
          if (!_.isObject(oldLocation)) oldLocation = {}; // check for locked true
          location = $.extend(oldLocation, location);
        }

        recordModel.set('location', location);
        recordModel.trigger('change:location');
      }

      function onGPSClick() {
        // turn off if running
        if (recordModel.isGPSRunning()) {
          recordModel.stopGPS();
        } else {
          recordModel.startGPS();
        }
      }

      function onLocationNameChange(name) {
        if (!name || typeof name !== 'string') {
          return;
        }

        const escaped_name = StringHelp.escape(name);
        recordModel.set('location_name', escaped_name);
      }

	  function onManualGridrefChange(gridRefString) {
		  /**
      * Validates grid ref
      * @param {string} gridRefString
      * @returns {{}}
      */
      function validate(gridRefString) {
        const errors = {};
        gridRefString = gridRefString.replace(/\s/g, '').toUpperCase();
        if (!LocHelp.grid2coord(gridRefString)) {
          errors.gridref = 'invalid';
        }

        if (!_.isEmpty(errors)) {
          return errors;
        }

        return null;
      }

      const validationError = validate(gridRefString);
      if (!validationError) {
        App.trigger('gridref:form:data:invalid', {}); // update form
        const latLon = LocHelp.grid2coord(gridRefString);

        const location = recordModel.get('location') || {};
        //location.name = StringHelp.escape(name);
        //recordModel.set('location', location);
        //recordModel.trigger('change:location');

        location.source = 'gridref';
        location.gridref = gridRefString;
        location.latitude = parseFloat(latLon.lat.toFixed(8));
        location.longitude = parseFloat(latLon.lon.toFixed(8));

        // -2 because of gridref letters, 2 because this is min precision
        //@todo Irish GR issue
        //@todo tetrad issue
        //const accuracy = (gridRefString.replace(/\s/g, '').length - 2) || 2;
        const grSquareDimension = Math.pow(10, 5 - ((gridRefString.replace(/\s/g, '').length - 2) / 2));

        location.accuracy = grSquareDimension / 2; // accauracy is radius, so for sqaures use half dimension

        onLocationSelect(location);
        //API.exit();
      } else {
        App.trigger('gridref:form:data:invalid', validationError);
      }
	  }

      mainView.on('location:select:map', onLocationSelect);
      mainView.on('gps:click', onGPSClick);
      mainView.on('location:name:change', onLocationNameChange);
      mainView.on('location:gridref:change', onManualGridrefChange);
      mainView.on('lock:click:location', API.onLocationLockClick);
      mainView.on('lock:click:name', API.onNameLockClick);
      const currentVal = recordModel.get('location') || {};
      const locationIsLocked = appModel.isAttrLocked('location', currentVal);
      mainView.on('navigateBack', () => {
        API.exit(recordModel, locationIsLocked);
      });
      App.regions.getRegion('main').show(mainView);

      // HEADER
      App.regions.getRegion('header').hide();
    });

    // FOOTER
    App.regions.getRegion('footer').hide().empty();
  },

  onLocationLockClick() {
    Log('Location:Controller:onLocationLockClick');
    // invert the lock of the attribute
    // real value will be put on exit
    appModel.setAttrLock('location', !appModel.getAttrLock('location'));
  },

  onNameLockClick() {
    Log('Location:Controller:onNameLockClick');
    // invert the lock of the attribute
    // real value will be put on exit
    appModel.setAttrLock('location-name', !appModel.getAttrLock('location-name'));
  },

  exit(recordModel, locationIsLocked) {
    recordModel.save(null, {
      success: () => {
        let location = recordModel.get('location') || {};
        let location_name = recordModel.get('location_name');
        const lockedValue = appModel.getAttrLock('location');

        if ((location.latitude && location.longitude) || location_name) {
          // we can lock location and name on their own
          // don't lock GPS though, because it varies more than a map or gridref

          // save to past locations
          const locationID = appModel.setLocation(recordModel.get('location'));
          location.id = locationID;
          recordModel.set('location', location);

          // update locked value if attr is locked
          if (lockedValue) {
            // check if previously the value was locked and we are updating
            if (locationIsLocked || lockedValue === true) {
              Log('Updating lock', 'd');

              if (location.source === 'gps') {
                // on GPS don't lock
                location = null;
              }
              appModel.setAttrLock('location', location);
            }
          } else if (CONFIG.AUTO_LOCK_LOCATION_NAME && location_name) {
            // no explicit lock request by user, but remember name anyway

            appModel.setAttrLock('location_name', { name: location_name });
          }
        } else if (lockedValue === true) {
          // reset if no location or location name selected but locked is clicked
          appModel.setAttrLock('location', null);
        }

        window.history.back();
      },
      error: (error) => {
        Log(error, 'e');
        App.regions.getRegion('dialog').error(error);
      },
    });
  },
};

export { API as default };
