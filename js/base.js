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