/** ****************************************************************************
 * Morel Sample.
 *****************************************************************************/
import $ from 'jquery';
import _ from 'lodash';
import Morel from 'morel';
import CONFIG from 'config';
import recordManager from '../record_manager';
import { Log } from 'helpers';
import Occurrence from './occurrence';
import GeolocExtension from './sample_geoloc_ext';

let Sample = Morel.Sample.extend({
  constructor(...args) {
    this.manager = recordManager;
    Morel.Sample.prototype.constructor.apply(this, args);
  },

  initialize() {
    this.set('form', CONFIG.morel.manager.input_form);
    this.set('entry_time', new Date().toString());
  },

  Occurrence,

  validate(attributes) {
    const attrs = _.extend({}, this.attributes, attributes);

    const sample = {};
    const occurrences = {};

    // todo: remove this bit once sample DB update is possible
    // check if saved
    if (!this.metadata.saved) {
      sample.send = false;
    }

    // location
    const location = attrs.location || {};
    if (!location.latitude || !location.longitude) {
      sample.location = 'missing';
    }
    // location name
    if (!location.name) {
      sample['location name'] = 'missing';
    }

    // date
    if (!attrs.date) {
      sample.date = 'missing';
    } else {
      const date = new Date(attrs.date);

      if (CONFIG.ENFORCE_DATE_CONSTRAINT) {
        // use NYPH constrained dates

        if (date === 'Invalid Date' || date < CONFIG.MIN_RECORDING_DATE || date > CONFIG.MAX_RECORDING_DATE) {
          sample.date = (date === 'Invalid Date') ? 'invalid' : 'date is not within the permitted range';
        }
      } else {
        // enforce only presence and non-future date
        if (date === 'Invalid Date' || date > new Date()) {
          sample.date = (date === 'Invalid Date') ? 'invalid' : 'future date';
        }
      }
    }

    // location type
    if (!attrs.location_type) {
      sample.location_type = 'can\'t be blank';
    }

    // occurrences
    if (this.occurrences.length === 0) {
      sample.occurrences = 'no species selected';
    } else {
      this.occurrences.each((occurrence) => {
        // kludge to substitute default 'Flowering Plant' if taxon is missing and have photo
        // @todo move to occurrence module
        if (!occurrence.attributes.taxon || occurrence.attributes.taxon.id === CONFIG.UNKNOWN_SPECIES.id) {
          // either no taxon or general 'flowering plant'

          if (occurrence.images.length === 0) {
            // no image so force species id error
            occurrence.attributes.taxon = null;
          } else {
            // have photo so substitute in 'flowering plant'
            occurrence.attributes.taxon = Object.assign({}, CONFIG.UNKNOWN_SPECIES);
          }
        }

        const errors = occurrence.validate();

        // @todo move to occurrence module
        // don't allow 'unknown species' if no photo
        // if (occurrence.images.length === 0 && occurrence.attributes.taxon.id === CONFIG.UNKNOWN_SPECIES.id) {
        //	errors = errors || {};
        //	errors.taxon = 'Taxon name or photo needed';
        // }

        if (errors) {
          const occurrenceID = occurrence.id || occurrence.cid;
          occurrences[occurrenceID] = errors;
        }
      });
    }

    if (!_.isEmpty(sample) || !_.isEmpty(occurrences)) {
      const errors = {
        sample,
        occurrences,
      };
      return errors;
    }

    return null;
  },

  /**
   * Set the record for submission and send it.
   */
  setToSend(callback) {
    this.metadata.saved = true;

    if (!this.isValid()) {
      // since the sample was invalid and so was not saved
      // we need to revert it's status
      this.metadata.saved = false;
      return false;
    }

    // save record
    const promise = this.save(null, {
      success: () => {
        callback && callback();
      },
      error: (err) => {
        callback && callback(err);
      },
    });

    return promise;
  },

  isLocalOnly() {
    const status = this.getSyncStatus();
    if (this.metadata.saved && (
      status === Morel.LOCAL ||
      status === Morel.SYNCHRONISING)) {
      return true;
    }
    return false;
  },
});

// add geolocation functionality
Sample = Sample.extend(GeolocExtension);

$.extend(true, Morel.Sample.keys, CONFIG.morel.sample);
export { Sample as default };
