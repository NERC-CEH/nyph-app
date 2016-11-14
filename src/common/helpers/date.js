export default {
  /**
   * Date object to date input value
   * @param date
   * @returns {string} eg. '2016-07-12'
   */
  toDateInputValue(date) {
    const local = new Date(date);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
  },

  print(date) {
    const local = new Date(date);
    return `${local.getDate()}/${(local.getMonth() + 1)}/${local.getFullYear()}`;
  },
  
  prettyPrintStamp(recordModel) {
    const recordDateString = recordModel.get('date');
    
    if (recordDateString) {
      const recordDate = new Date(recordDateString);
      
      if (recordDate) {
        const recordStamp = new Date(recordModel.get('entry_time'));

        const location = recordModel.get('location');
        const gpsed = location && location.source === 'gps';

        const today = new Date();

        const todayDateOnly = `${today.getDate()}/${(today.getMonth() + 1)}/${today.getFullYear()}`;
        const recordDateOnly = `${recordDate.getDate()}/${(recordDate.getMonth() + 1)}/${recordDate.getFullYear()}`;
        const stampDateOnly = `${recordStamp.getDate()}/${(recordStamp.getMonth() + 1)}/${recordStamp.getFullYear()}`;

        const isToday = (todayDateOnly === recordDateOnly);
        if (gpsed && (recordDateOnly === stampDateOnly)) {
          // trust that the entry stamp time reflects the field record time
          
          return (isToday ? 'today' : recordDateOnly);
        } else {
          return `${isToday ? 'today' : recordDateOnly}, ${recordStamp.getHours()}:${recordStamp.getMinutes()}`;
        }
      } 
    } 
    return '';
  },
};
