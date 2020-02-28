

///////////////////////////////////////////////////////////////////
//Android js debugging - touch screen with 3 fingers to activate

if( ( /android/gi ).test( navigator.appVersion ) ) {
  console = {
    "_log" : [],
    "log" : function() {
      var arr = [];
      for ( var i = 0; i < arguments.length; i++ ) {
        arr.push( arguments[ i ] );
      }
      this._log.push( arr.join( ", ") );
    },
    "trace" : function() {
      var stack;
      try {
        throw new Error();
      } catch( ex ) {
        stack = ex.stack;
      }
      console.log( "console.trace()\n" + stack.split( "\n" ).slice( 2 ).join( "  \n" ) );
    },
    "dir" : function( obj ) {
      console.log( "Content of " + obj );
      for ( var key in obj ) {
        var value = typeof obj[ key ] === "function" ? "function" : obj[ key ];
        console.log( " -\"" + key + "\" -> \"" + value + "\"" );
      }
    },
    "show" : function() {
      alert( this._log.join( "\n" ) );
      this._log = [];
    }
  };
 // Print error to fake console
  window.onerror = function( msg, url, line ) {
    console.log("ERROR: \"" + msg + "\" at \"" + "\", line " + line);
  }
 // 3 finger touch activation
  window.addEventListener( "touchstart", function( e ) {
    if( e.touches.length === 3 ) {
      console.show();
    }
  } );
}
