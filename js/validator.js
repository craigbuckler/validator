/*
  Generic HTML5 form validator
  validates all form elements with the attribute data-module="validate"
*/
(function ($) {

  "use strict";

  // initialise
  function Validate(form) {
    Log("Validator initialised");
    new FormValidator(form);
  }


  // form validator object
  function FormValidator(form) {

    // configuration
    this.cfg = {
      valid: "fvValid",
      errorClass: "error"
    };

    // abandon non or empty forms
    if (!form || !form.elements || !form.elements.length) return null;
    LogForm(form);

    this.form = form;
    this.fields = [];
    this.InitialiseFields();

    // event initialisation
    var T = this, f = $(this.form);

    // form-level event handlers

    // field-level event handlers
    $(this.fields).on("focusout", function(e) { T.CheckValidity(this); }).on("valid invalid", function(e) { e.preventDefault(); T.FieldError(this); });

  }

  // initialise form fields
  FormValidator.prototype.InitialiseFields = function() {

    var i, e;
    for (i = 0; i < this.form.elements.length; i++) {
      e = this.form.elements[i];
      if (e.nodeName === "INPUT" || e.nodeName === "TEXTAREA" || e.nodeName === "SELECT") {
        this.fields.push(e);
        this.CheckValidity(e);
      }
    }

  };


  // is a field valid?
  FormValidator.prototype.CheckValidity = function(e) {

    // browser validity available?
    if (e.willValidate && (e.nodeName !== "INPUT" || e.type === e.getAttribute("type"))) {
      e[this.cfg.valid] = e.validity.valid;
    }
    else {
      // fallback validation
      e[this.cfg.valid] = false;
    }

    // trigger custom event
    $(e).trigger({ type: (e[this.cfg.valid] ? "valid" : "invalid") });

  };


  // show/hide error indicator
  FormValidator.prototype.FieldError = function(e) {

    var p = $(e).parent();
    if (e[this.cfg.valid]) {
      p.removeClass(this.cfg.errorClass);
    }
    else {
      p.addClass(this.cfg.errorClass);
    }

  };


  // ############ output logging - remove these functions prior to deployment
  function LogForm(form) {
    for(var i = 0; i < form.elements.length; i++) {
      var e=form.elements[i];
      Log(
        e.nodeName+":"+e.name+
        ", type:"+e.type+" ("+e.getAttribute("type")+
        "), willValidate:"+e.willValidate+
        ", valid:"+(e.validity ? e.validity.valid : "unknown")
      );
    }
  }

  function Log(msg) {
    if (msg.constructor === Array) {
      var m = "";
      for (var i = 0; i < msg.length; i++) m += msg[i] + "\n";
      msg = m;
    }
    var log = document.getElementById("log");
    $(log).text($(log).text() + msg + "\n\r");
    // log.textContent += msg + "\n";
    var ot = log.scrollHeight - log.clientHeight;
    if (ot > 0) log.scrollTop = ot;
  }
  // ############ end of output logging

  // register forms
  Plymouth.Modules.register('validate', Validate);

}(jQuery));
