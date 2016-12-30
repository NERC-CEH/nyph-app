/** ****************************************************************************
 * App Model attribute lock functions.
 *****************************************************************************/
import _ from 'lodash';
import { Log, Analytics } from 'helpers';
import userModel from './user_model';

export default {
  setAttrLock(attr, value) {
    const val = _.cloneDeep(value);
    const locks = this.get('attrLocks');

    locks[attr] = val;
    this.set(locks);
    this.save();
    this.trigger('change:attrLocks');

    if (value) {
      Analytics.trackEvent('Lock', attr);
    }
  },

  unsetAttrLock(attr) {
    const locks = this.get('attrLocks');
    delete locks[attr];
    this.set(locks);
    this.save();
    this.trigger('change:attrLocks');
  },

  getAttrLock(attr) {
    const locks = this.get('attrLocks');
    return locks[attr];
  },

  isAttrLocked(attr, value = {}) {
    let lockedVal = this.getAttrLock(attr);
    if (!lockedVal) return false; // has not been locked
    if (lockedVal === true) return true; // has been locked
    let locked;
    switch (attr) {
      case 'location':
        //locked = lockedVal && lockedVal.source !== 'gps' && !!lockedVal.gridref && lockedVal.gridref === value.gridref;
        
          // lock non-gps grid-refs by default
          locked = lockedVal && lockedVal.source !== 'gps' && lockedVal.gridref === value.gridref;
        
          /*
          // map or gridref
          (lockedVal && lockedVal.source !== 'gps' &&
          ((lockedVal.name === value.name &&
          lockedVal.latitude === value.latitude &&
          lockedVal.longitude === value.longitude) ||

            // GPS doesn't lock the location only name
          (lockedVal.name === value.name && (
          !lockedVal.latitude && !lockedVal.longitude))));
          */
        
        return locked;
      case 'recorder':
        console.log('Testing recorder name lock for lock val:');
        console.log(lockedVal);
        console.log(value);
        
        //locked = 
        return true;
      case 'date':
        lockedVal = new Date(lockedVal);
        if (lockedVal === 'Invalid Date') return false;

        return lockedVal.getTime() === value.getTime();
      default:
        return value === lockedVal;
    }
  },

  appendAttrLocks(sample) {
    const locks = this.get('attrLocks');
    const occurrence = sample.occurrences.at(0);

    _.each(locks, (value, key) => {
      // false or undefined
      if (!value) {
        return;
      }

      const val = _.cloneDeep(value);

      switch (key) {
        case 'location':
          sample.set('location', val);
          break;
        case 'location_name':
          sample.set('location_name', val);
          break;
        case 'date':
          // parse stringified date
          sample.set('date', new Date(val));
          break;
        case 'recorder':
          sample.set('recorder', val);
          break;
        case 'comment':
          occurrence.set('comment', val);
          break;
        default:
      }
    });
  },
};
