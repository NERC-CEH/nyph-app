/** ****************************************************************************
 * Location controller.
 *****************************************************************************/
import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
import Morel from 'morel';
import { Log, Validate, StringHelp, LocHelp, GridRefUtils } from 'helpers';
import App from 'app';
import recordManager from '../../record_manager';
import appModel from '../../models/app_model';
import MainView from './main_view';
import CONFIG from 'config';
import './styles.scss';

/*eslint-disable camelcase*/
const API = {
  show(recordID) {
    Log('Location:Controller: showing.');

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
      const mainView = new MainView({
        model: new Backbone.Model({ recordModel, appModel }),
        vent: App,
      });

      // listen to events
      mainView.on('location:select:map', (loc, createNew) => {
        API.onLocationSelect(recordModel, loc, createNew);
      });
      mainView.on('gps:click', () => {
        API.onGPSClick(recordModel);
      });
      mainView.on('location:name:change', name => {
        API.onLocationNameChange(recordModel, name);
      });
      mainView.on('location:gridref:change', gridRefString => {
        API.onManualGridrefChange(recordModel, gridRefString);
      });
      mainView.on('lock:click:location', API.onLocationLockClick);
      mainView.on('lock:click:name', API.onNameLockClick);
      const location = recordModel.get('location') || {};
      // const name = recordModel.get('location_name');
      const locationIsLocked = appModel.isAttrLocked('location', location);
      // const nameIsLocked = appModel.isAttrLocked('location_name', currentVal);
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

  exit(recordModel, locationIsLocked) {
    Log('Location:Controller: exiting.');

    recordModel.save(null, {
      success: () => {
        // save to past locations and update location ID on record
        const location = recordModel.get('location') || {};
        if ((location.latitude && location.longitude)) {
          const location_name = recordModel.get('location_name');
          const locationID = appModel.setLocation(location, location_name);
          location.id = locationID;
          recordModel.set('location', location);
        }

        API.updateLocks(recordModel, locationIsLocked);

        window.history.back();
      },
      error: (error) => {
        Log(error, 'e');
        App.regions.getRegion('dialog').error(error);
      },
    });
  },

  updateLocks(recordModel, locationIsLocked) {
    Log('Location:Controller: updating locks.');

    let location = recordModel.get('location') || {};
    const location_name = recordModel.get('location_name');
    const lockedLocation = appModel.getAttrLock('location');
    const lockedName = appModel.getAttrLock('location_name');

    // reset
    if (lockedLocation === true && (!location.latitude || !location.longitude)) {
      appModel.setAttrLock('location', null);
    }
    if (lockedName === true && !location_name) {
      appModel.setAttrLock('location_name', null);
    }

    // location
    if (lockedLocation) {
      // check if previously the value was locked and we are updating
      if (locationIsLocked || lockedLocation === true) {
        Log('Updating lock', 'd');

        if (location.source === 'gps') {
          // on GPS don't lock
          location.source = 'gridref';
        }
        appModel.setAttrLock('location', location);
      }
    }

    // name
    if (lockedName && (lockedName === true || lockedName === location_name)) {
      appModel.setAttrLock('location_name', location_name);
    }
    if (CONFIG.AUTO_LOCK_LOCATION_NAME && location_name) {
      // no explicit lock request by user, but remember name anyway
      appModel.setAttrLock('location_name', location_name);
    }
  },

  onLocationNameChange(recordModel, name) {
    Log('Location:Controller: executing onLocationNameChange.');

    if (!name || typeof name !== 'string') {
      return;
    }

    const escaped_name = StringHelp.escape(name);
    recordModel.set('location_name', escaped_name);
  },

  onManualGridrefChange(recordModel, gridRefString) {
    Log('Location:Controller: executing onManualGridrefChange.');

    /**
     * Validates grid ref
     * @param {string} gridRefString
     * @returns {{}}
     */
    //function validate(gridRefString) {
    //  const errors = {};
    //  gridRefString = gridRefString.replace(/\s/g, '').toUpperCase();
    //  if (!LocHelp.gridrefStringToLatLng(gridRefString)) {
    //    errors.gridref = 'invalid';
    //  }
    //
    //  if (!_.isEmpty(errors)) {
    //    return errors;
    //  }
    //
    //  return null;
    //}

    //const validationError = validate(gridRefString);
    
    gridRefString = gridRefString.replace(/\s/g, '').toUpperCase();
    
    if (gridRefString !== '') {
      var parsedGridRef = GridRefUtils.GridRefParser.factory(gridRefString);
      
      if (parsedGridRef) {
        const location = recordModel.get('location') || {};
        const latLng = parsedGridRef.osRef.to_latLng();
        
        location.source = 'gridref';
        location.gridref = parsedGridRef.preciseGridRef;
        location.latitude = latLng.lat;
        location.longitude = latLng.lng;
        location.accuracy = parsedGridRef.length / 2; // radius rather than square dimension
        
        API.onLocationSelect(recordModel, location);
      } else {
        App.trigger('gridref:form:data:invalid', {
          gridref: 'invalid'
        });
      }
    } else {
      const location = recordModel.get('location') || {};
      location.source = null; // unsure what this should be
      location.gridref = '';
      location.latitude = null;
      location.longitude = null;
      location.accuracy = null;
      
      API.onLocationSelect(recordModel, location);
    }
    
    //if (!validationError) {
    //  App.trigger('gridref:form:data:invalid', {}); // update form
    //  const latLon = LocHelp.gridrefStringToLatLng(gridRefString);
    //
    //  const location = recordModel.get('location') || {};
    //  // location.name = StringHelp.escape(name);
    //  // recordModel.set('location', location);
    //  // recordModel.trigger('change:location');
    //
    //  location.source = 'gridref';
    //  location.gridref = gridRefString;
    //  location.latitude = parseFloat(latLon.lat.toFixed(8));
    //  location.longitude = parseFloat(latLon.lng.toFixed(8));
    //
    //  // -2 because of gridref letters, 2 because this is min precision
    //  // @todo Irish GR issue
    //  // @todo tetrad issue
    //  // const accuracy = (gridRefString.replace(/\s/g, '').length - 2) || 2;
    //  const grSquareDimension = Math.pow(10, 5 - ((gridRefString.replace(/\s/g, '').length - 2) / 2));
    //
    //  location.accuracy = grSquareDimension / 2; // accauracy is radius, so for sqaures use half dimension
    //
    //  API.onLocationSelect(recordModel, location);
    //  // API.exit();
    //} else {
    //  App.trigger('gridref:form:data:invalid', validationError);
    //}
  },

  onLocationSelect(recordModel, loc, createNew) {
    Log('Location:Controller: executing onLocationSelect.');

    if (typeof loc !== 'object') {
      // jQuery event object bug fix
      Log('Location:Controller:onLocationSelect: loc is not an object', 'e');
      return;
    }

    let location = loc;
    // we don't need the GPS running and overwriting the selected location
    if (recordModel.isGPSRunning()) {
      recordModel.stopGPS({ silent: true });
    }

    if (!createNew) {
      // extend old location to preserve its previous attributes like name or id
      let oldLocation = recordModel.get('location');
      if (!_.isObject(oldLocation)) oldLocation = {}; // check for locked true
      location = $.extend(oldLocation, location);
    }

    recordModel.set('location', location);
    recordModel.trigger('change:location');
  },

  onGPSClick(recordModel) {
    Log('Location:Controller: executing onGPSClick.');

    // turn off if running
    if (recordModel.isGPSRunning()) {
      recordModel.stopGPS();
    } else {
      recordModel.startGPS();
    }
  },

  onLocationLockClick() {
    Log('Location:Controller: executing onLocationLockClick.');
    // invert the lock of the attribute
    // real value will be put on exit
    appModel.setAttrLock('location', !appModel.getAttrLock('location'));
  },

  onNameLockClick() {
    Log('Location:Controller: executing onNameLockClick.');
    // invert the lock of the attribute
    // real value will be put on exit
    appModel.setAttrLock('location_name', !appModel.getAttrLock('location_name'));
  },
};

export { API as default };
