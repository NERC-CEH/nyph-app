export default {
  limit(string, charNum = 20) {
    const value = string.toString();
    const ellipsis = value && value.length > charNum ? '...' : '';
    return value ? value.substring(0, charNum) + ellipsis : '';
  },


  /**
   * 
   * @param {string} string
   * @returns {string}
   */
  escape(string) {
    // http://shebang.brandonmintern.com/foolproof-html-escaping-in-javascript/
    //const div = document.createElement('div');
    //div.appendChild(document.createTextNode(string.toString()));
    //return div.innerHTML;
    
    try {
      // IE (even v 11) sometimes fails here with 'Unknown runtime error', see http://blog.rakeshpai.me/2007/02/ies-unknown-runtime-error-when-using.html 
      var textArea = document.createElement('textarea');
      textArea.innerHTML = string;
      return textArea.innerHTML.replace(/"/g, '&quot;');
    } catch (e) {
      var pre = document.createElement('pre');
      pre.appendChild(document.createTextNode(string));
      return pre.innerHTML.replace(/"/g, '&quot;');
    }
  }
};
