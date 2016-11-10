import Backbone from 'backbone';
import { Log } from 'helpers';
import App from 'app';
import appModel from '../../common/models/app_model';
import MainView from './main_view';
import HeaderView from '../../common/views/header_view';

const API = {
  show() {
    const mainView = new MainView();
    App.regions.getRegion('main').show(mainView);
    mainView.on('okPressed', API.okPressed);
    App.regions.getRegion('header').hide();
  },

  okPressed() {
    appModel.set('showIntro', false).save();
    App.trigger('records:list');
  },
};

export { API as default };
