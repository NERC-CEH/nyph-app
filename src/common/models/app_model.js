/** ****************************************************************************
 * App model. Persistent.
 *****************************************************************************/
import Backbone from 'backbone';
import Store from 'backbone.localstorage';
import CONFIG from 'config';
import userModel from './user_model';
import pastLocationsExtension from './app_model_past_loc_ext';
import attributeLockExtension from './app_model_attr_lock_ext';

let AppModel = Backbone.Model.extend({
  id: 'app',

  defaults: {
    showIntro: true,
    exceptions: [],

    locations: [],
    attrLocks: {},
    autosync: true,
    useGridRef: true,
    useGridMap: true,
    useTraining: false,
  },

  localStorage: new Store(CONFIG.name),

  /**
   * Initializes the object.
   */
  initialize() {
    this.fetch();

    // attr lock recorder on login
    userModel.on('login logout', () => {
      if (userModel.hasLogIn()) {
          const surname = userModel.get('surname');
          const name = userModel.get('name');
          const recorder = `${surname}, ${name}`;
          this.setAttrLock('recorder', recorder);
      } else {
        this.unsetAttrLock('recorder');
      }
    });
  },
});

// add previous/pased saved locations management
AppModel = AppModel.extend(pastLocationsExtension);
// add sample/occurrence attribute management
AppModel = AppModel.extend(attributeLockExtension);

const appModel = new AppModel();
export { appModel as default, AppModel };
