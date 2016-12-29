/** ****************************************************************************
 * Some location transformation logic.
 *****************************************************************************/
import { LatLonEllipsoidal as LatLon, OsGridRef } from 'geodesy';
import Log from './log';
import GridRefUtils from './gridrefutils';

const helpers = {
  /**
   * 
   * @param {type} location
   * @returns {string}
   */
  locationLatLngToGridString(location) {
    //const locationGranularity = helpers._getGRgranularity(location);

    //const p = new LatLon(location.latitude, location.longitude, LatLon.datum.WGS84);
    //const grid = OsGridRef.latLonToOsGrid(p);

    //return grid.toString(locationGranularity).replace(/\s/g, '');
    
    var normalisedPrecision = GridRefUtils.GridRefParser.get_normalized_precision(location.accuracy);
    var nationaGridCoords = GridRefUtils.latlng_to_gridref(location.latitude, location.longitude);
    return nationaGridCoords.to_gridref(normalisedPrecision);
  },
  
  /**
   * 
   * @param {type} location
   * @returns {Array} latlng pairs (SW, SE, NE, NW)
   */
  getSquareBounds(location) {
    if (location.latitude) {
      const gridRefString = helpers.locationLatLngToGridString(location);
      const parsedRef = GridRefUtils.GridRefParser.factory(gridRefString);

      if (parsedRef) {
        const nationalGridRefSW = parsedRef.osRef;
        return [
          nationalGridRefSW.to_latLng(),
          (new parsedRef.NationalRef(nationalGridRefSW.x + parsedRef.length, nationalGridRefSW.y)).to_latLng(),
          (new parsedRef.NationalRef(nationalGridRefSW.x + parsedRef.length, nationalGridRefSW.y + parsedRef.length)).to_latLng(),
          (new parsedRef.NationalRef(nationalGridRefSW.x, nationalGridRefSW.y + parsedRef.length)).to_latLng()
        ];
      } else {
        return null;
      }
    } else {
      return null;
    }
  },

  /**
   * 
   * @param {string} gridrefString
   * @returns {GridRefUtils.OSRef|null} SW corner of grid square
   */
  parseGrid(gridrefString) {
    var parser = GridRefUtils.GridRefParser.factory(gridrefString);
    return parser ? parser.osRef : null;
    
    /**
     * given co-ordinates of SW corner return new OsGridRef of mid-point
     *
     * @param {string} gridRef (assumed to be well-formed)
     * @param {OsGridRef} osCoords
     * @returns {OsGridRef}
     */
    /*
    function osgbMidPoint(gridRef, osCoords) {
      const parts = gridRef.replace(' ', '').match(/^[A-Z]{1,2}((?:\d\d)+)$/i);

      let e = osCoords.easting;
      let n = osCoords.northing;

      if (parts) {
        // numeric part of gridref in parts[1]
        const halfLength = parts[1].length / 2;

        if (halfLength < 5) {
          const offset = Math.pow(10, 4 - halfLength) * 5;

          e += offset;
          n += offset;
        }
        return new OsGridRef(e, n);
      } else {
        return new OsGridRef(NaN, NaN);
      }
    }
   
    /*
     * 
     * @type OsGridRef
     */
    //let osCoords = OsGridRef.parse(gridrefString);
    //osCoords = osgbMidPoint(gridrefString, osCoords);

    //return osCoords;
    
  },

  grid2coord(gridrefString) {
    try {
      const gridref = helpers.parseGrid(gridrefString);
      if (!isNaN(gridref.easting) && !isNaN(gridref.northing)) {
        return OsGridRef.osGridToLatLon(gridref, LatLon.datum.WGS84);
      }
    } catch(e) {
      // recent versions of the geodesy library throw exceptions for bad gridrefs
      Log(e.message);
    }

    return null;
  },

  /**
   * 1 gridref digits. (10000m)  -> < 4 map zoom lvl
   * 2 gridref digits. (1000m)   -> 7
   * 3 gridref digits. (100m)    -> 10
   * 4 gridref digits. (10m)     -> 12
   * 5 gridref digits. (1m)      ->
   */
  mapZoom2meters(accuracy) {
    let updated = accuracy;
    if (updated <= 4) {
      updated = 0;
    } else if (updated <= 7) {
      updated = 1;
    } else if (updated <= 10) {
      updated = 2;
    } else if (updated <= 12) {
      updated = 3;
    } else {
      updated = 4;
    }

    updated = 5000 / Math.pow(10, updated); // meters
    return updated < 1 ? 1 : updated;
  },

  /**
   * 1 gridref digits. (10000m)
   * 2 gridref digits. (1000m)
   * 3 gridref digits. (100m)
   * 4 gridref digits. (10m)
   * 5 gridref digits. (1m)
   */
  _getGRgranularity(location) {
    let locationGranularity;

    // calculate granularity
    const digits = Math.log(location.accuracy * 2) / Math.LN10;
    locationGranularity = 10 - (digits * 2); // MAX GR ACC -
    locationGranularity = Number((locationGranularity).toFixed(0)); // round the float

    // normalize granularity
    // cannot be odd
    if (locationGranularity % 2 !== 0) {
      // should not be less than 2
      locationGranularity =
        locationGranularity === 1 ? locationGranularity + 1 : locationGranularity - 1;
    }

    if (locationGranularity > 10) {
      // no more than 10 digits
      locationGranularity = 10;
    } else if (locationGranularity < 2) {
      // no less than 2
      locationGranularity = 2;
    }
    return locationGranularity;
  },

  isInGB(location) {
    if (location.latitude) {

      var nationaGridCoords = GridRefUtils.latlng_to_gridref(location.latitude, location.longitude); 
      return nationaGridCoords && nationaGridCoords.country === 'GB';
    } else {
      return false;
    }
  },
};

export default helpers;
