/** ****************************************************************************
 * Record Edit main view.
 *****************************************************************************/
import Marionette from 'backbone.marionette';
import Morel from 'morel';
import JST from 'JST';
import { DateHelp, StringHelp } from 'helpers';
import CONFIG from 'config';

import './styles.scss';

export default Marionette.View.extend({
  template: JST['records/edit/main'],

  initialize() {
    const recordModel = this.model.get('recordModel');
    this.listenTo(recordModel, 'request sync error geolocation', this.render);
  },

  serializeData() {
    const recordModel = this.model.get('recordModel');
    const occ = recordModel.occurrences.at(0);
    const specie = occ.get('taxon') || {};
    const appModel = this.model.get('appModel');

    // taxon
    const scientificName = specie.scientific_name;
    const commonName = specie.common_name;

    const locationPrint = recordModel.printLocation();
    const location = recordModel.get('location') || {};

    const attrLocks = {
      date: appModel.isAttrLocked('date', recordModel.get('date')),
      location: appModel.isAttrLocked('location', recordModel.get('location')),
      recorder: appModel.isAttrLocked('recorder', recordModel.get('recorder')),
      comment: appModel.isAttrLocked('comment', occ.get('comment')),
    };

    // regardless of CONFIG.ENFORCE_DATE_CONSTRAINT flag date range problems in UI
    const modelDate = new Date(recordModel.get('date'));

    return {
      id: recordModel.id || recordModel.cid,
      scientificName,
      commonName,
      isLocating: recordModel.isGPSRunning(),
      isSynchronising: recordModel.getSyncStatus() === Morel.SYNCHRONISING,
      location: locationPrint,
      location_name: location.name,
      date: DateHelp.print(recordModel.get('date')),
      recorder: recordModel.get('recorder') && StringHelp.limit(recordModel.get('recorder')),
      comment: occ.get('comment') && StringHelp.limit(occ.get('comment')),
      locks: attrLocks,
      dateRangeError: (modelDate < CONFIG.MIN_RECORDING_DATE ||
      modelDate > CONFIG.MAX_RECORDING_DATE ||
      modelDate > (new Date())),
    };
  },
});
