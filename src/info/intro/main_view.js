/** ****************************************************************************
 * Intro main view.
 *****************************************************************************/
import Marionette from 'backbone.marionette';
import JST from 'JST';
import './styles.scss';

export default Marionette.View.extend({
  id: 'intro-main',
  template: JST['info/intro/main'],

  triggers: {
    'click #ok-btn': 'okPressed',
  },
});
