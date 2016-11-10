/** ****************************************************************************
 * Record Attribute main view.
 *****************************************************************************/
import $ from 'jquery';
import Marionette from 'backbone.marionette';
import { Device, DateHelp, StringHelp, Log } from 'helpers';
import JST from 'JST';
import CONFIG from 'config';

export default Marionette.View.extend({
  initialize(options) {
    this.template = JST[`records/attr/${options.attr}`];
  },

  getValues() {
    const values = {};
    let value;
    const attr = this.options.attr;
    let $inputs;
    switch (attr) {
      case 'date': {
        value = this.$el.find('input').val();
        const date = new Date(value);
        if (date.toString() !== 'Invalid Date') {
          values[attr] = new Date(date);
        }
        break;
      }
      case 'identifiers':
        value = this.$el.find('input').val();
        values[attr] = StringHelp.escape(value);
        break;
      case 'comment':
        value = this.$el.find('textarea').val();
        values[attr] = StringHelp.escape(value);
        break;
      default:
    }

    return values;
  },

  serializeData() {
    const templateData = {};
    const occ = this.model.occurrences.at(0);

    switch (this.options.attr) {
      case 'date':
        templateData.date = DateHelp.toDateInputValue(this.model.get('date'));
		const today = new Date();
		
		if (CONFIG.ENFORCE_DATE_CONSTRAINT) {
			templateData.maxDate = DateHelp.toDateInputValue(today <= CONFIG.MAX_RECORDING_DATE ? today : CONFIG.MAX_RECORDING_DATE);
		} else {
			templateData.maxDate = DateHelp.toDateInputValue(new Date());
		}
		// regardless of CONFIG.ENFORCE_DATE_CONSTRAINT flag date range problems in UI
		const modelDate = new Date(this.model.get('date'));
		templateData.dateRangeError = (modelDate < CONFIG.MIN_RECORDING_DATE || 
			modelDate > CONFIG.MAX_RECORDING_DATE ||
			modelDate > today)
        break;
      case 'identifiers':
        templateData.identifiers = occ.get('identifiers');
        break;
      case 'comment':
        templateData.comment = occ.get('comment');
        break;
      default:
        Log('Records:Attribute:MainView: no such attribute', 'e');
        return null;
    }

    return templateData;
  },

  updateRangeSliderValue(e) {
    const $input = $(e.target);
    const $rangeOutput = this.$el.find('#range');

    const value = logsl.position($input.val()).toFixed(0);
    $rangeOutput.val(value);

    // unset ranges selection
    const $inputs = this.$el.find('input[type="radio"]');
    $inputs.each((int, elem) => {
      $(elem).prop('checked', false);
    });
  },

  updateRangeInputValue(e) {
    const $input = $(e.target);
    if (!$input.val()) {
      // no need to do anything on input clear
      return;
    }
    const $rangeOutput = this.$el.find('#rangeVal');

    const value = logsl.value($input.val()).toFixed(0);
    $rangeOutput.val(value);

    // unset ranges selection
    const $inputs = this.$el.find('input[type="radio"]');
    $inputs.each((int, elem) => {
      $(elem).prop('checked', false);
    });
  },

  onAttach() {
    let $input;
    switch (this.options.attr) {
      case 'date':
        $input = this.$el.find('input').focus();
        if (Device.isAndroid()) {
          const options = {
            date: new Date(this.model.get('date')),
            mode: 'date',
            androidTheme: 5,
            allowOldDates: true,
            allowFutureDates: false,
          };

          window.datePicker.show(options, (date) => {
            $input.val(DateHelp.toDateInputValue(new Date(date)));
          });
        }
        break;
      case 'comment':
        $input = this.$el.find('textarea').focus();
        if (window.cordova && Device.isAndroid()) {
          window.Keyboard.show();
          $input.focusout(() => {
            window.Keyboard.hide();
          });
        }
        break;
      case 'identifiers':
        $input = this.$el.find('input').focus();
        if (window.cordova && Device.isAndroid()) {
          window.Keyboard.show();
          $input.focusout(() => {
            window.Keyboard.hide();
          });
        }
        break;
      default:
    }
  },
});

