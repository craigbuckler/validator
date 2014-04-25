// feature detection (basic)
(function($) {

  "use strict";

  var $html = $("html");

  // JavaScript enabled
  $html.addClass("jsenabled");

  // prevent IE10 mobile zooming
  if ("-ms-user-select" in document.documentElement.style && navigator.userAgent.match(/IEMobile\/10\.0/)) {
    var msViewportStyle = document.createElement("style");
    msViewportStyle.appendChild(document.createTextNode("@-ms-viewport{width:auto!important}"));
    document.getElementsByTagName("head")[0].appendChild(msViewportStyle);
  }

})(jQuery);


// module loader
(function (Plymouth) {

  "use strict";

  var plymouth_modules = {};

  Plymouth.Modules = {
    register: function Register(id, handler) {
      plymouth_modules[id] = handler;
    }
  };

  function initalize_modules() {
    $('[data-module]').each(function (_, element) {
      var module_type = $(element).data('module');

      // Execute the handler
      plymouth_modules[module_type](element);
    });
  }

  $(initalize_modules);

}(window.Plymouth = window.Plymouth || {}));
