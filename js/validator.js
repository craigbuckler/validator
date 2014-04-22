/*
  Generic HTML5 form validator
  validates all form elements with the attribute data-module="validate"
*/
(function ($) {

  "use strict";

  // initialise
  function Validator(form) {
    // console causes IE to fail?
    // console.log("form validator: ", form);
  }

  // register forms
  Plymouth.Modules.register('validate', Validator);

}(jQuery));
