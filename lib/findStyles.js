// Client script to find all the styles of a page and compute the position of the matching elements
//
// results are stored in window._wtcss_styles

(function(window){
  var document = window.document;
  
  //reinsert any cross domain restricted sheets 
  //if we have a proxy that we can request them through.
  if(window._wtcss_prox){

    var reinsert = []
    var sheets = document.styleSheets;
    for (var i=0; i < sheets.length; i++) {
      if(sheets[i].cssRules == null){
        reinsert.push(sheets[i]);
      }
    };
    for (var i=0; i < reinsert.length; i++) {
      var sheet = reinsert[i];
      
      var callback = function(){
        try {
          var newsheet = document.createElement('style');
              newsheet.setAttribute('type','text/css');
              newsheet.innerHTML = this.responseText;
              
          // insert before so that any relative images that will now fail
          // will be overridden 
          sheet.ownerNode.parentNode.insertBefore(newsheet, sheet.ownerNode);
        } catch(e) {
          // alert(e); // "Error: SYNTAX_ERR: DOM Exception 12"
        }
      };


      var oXHR = new XMLHttpRequest();
      oXHR.onreadystatechange = function() {
        if (oXHR.readyState === 4) { callback.apply(oXHR); }
      };

      console.log(window._wtcss_prox + sheet.href);

      oXHR.open("GET", window._wtcss_prox + sheet.href, false);// synchronously
      oXHR.send(null);

    };

  }
  
    
  // where we will put all the styles
  window._wtcss_styles = [];
  
  (function process(sheets,aggregated,depth){
    if(depth > 3) return;
    
    for (var i=0; i < sheets.length; i++) {
      if(sheets[i].cssRules == null){
        // TODO - re-insert unavailable (cross domain) styles
        continue;
      }
      
      var rules = sheets[i].cssRules;
      
      for(var j = 0; j < rules.length; j++){
        var rule = rules[j];
        
        if(rule.selectorText){
          var rr = [rule.cssText];
          try {
            var elements = document.querySelectorAll(rule.selectorText);
            for(var k = 0; k < elements.length; k++){
             var offset = offsets(elements[k]);
             rr.push(offset);
            }
            aggregated.push(rr);
          } catch(e) {}
        }
        
        // recursively add @import styles
        if(rule.styleSheet){
          process([rule.styleSheet], aggregated, depth + 1);
        }
      }
    }
    
  })(document.styleSheets,window._wtcss_styles,0);
  
  // the full offsets of a given element
  // returns [top, left]
  function offsets(elem){
    if(!elem) return [0,0];
    var vals = offsets(elem.offsetParent);
    return [vals[0] + elem.offsetTop, vals[1] + elem.offsetLeft];
  };
  
  
})(window)
