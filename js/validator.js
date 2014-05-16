/*
  Generic HTML5 form validator
  validates all form elements with the attribute data-module="validate"
*/
(function ($) {

  "use strict";

  // default configuration
  var config = {
    dateFormat:           "dd-mm-yy",                   // default date format
    requiredClass:        "required",                   // class applied to required fields
    disableClass:         "disabled",                   // class applied to disabled fields
    errorClass:           "error",                      // class applied to fields with errors
    groupAttr:            "data-formgroup",             // attribute identifying groups field belongs to
    groupTriggerAttr:     "data-formgrouptrigger",      // attribute identifying enable/disable group trigger
    groupTriggerValAttr:  "data-formgrouptriggervalue", // attribute identifying enable/disable group trigger valid value
    scrollToElement:      500                           // milliseconds to scroll to element
  };


  // initialise
  function Validate(form) {
    new FormValidator(form);
  }


  // form validator object
  function FormValidator(form) {

    // abandon non or empty forms
    if (!form || !form.elements || !form.elements.length) return null;

    this.form = form;
    this.form.noValidate = true; // disable form submission prevention
    this.field = [];
    this.trigger = [];
    this.date = [];
    this.group = {};
    this.InitialiseFields();

    // check all fields
    var e, T = this;
    for (e = 0; e < this.field.length; e++) this.CheckField(this.field[e]);
    for (e = 0; e < this.trigger.length; e++) this.GroupField(this.trigger[e]);

    // group trigger events
    $(this.trigger).on("click change", function(e) { T.GroupField(this); });

    // field-level validation
    $(this.field).on("blur", function(e) { T.CheckField(this); }).on("valid invalid", function(e) { e.preventDefault(); T.FieldError(this); });

    // form-level event handler
    $(this.form).on("submit", function(e) { T.CheckForm(e); });

  }

  // initialise form fields
  FormValidator.prototype.InitialiseFields = function() {

    var i, e, T = this;
    for (i = 0; i < this.form.elements.length; i++) {

      // get form element
      e = this.form.elements[i];

      // ignore non-inputs
      if (e.nodeName === "INPUT" || e.nodeName === "TEXTAREA" || e.nodeName === "SELECT") {

        // add to field collection
        this.field.push(e);

        // if unsupported date field, use jQuery UI datepicker (if available)
        if (e.nodeName === "INPUT" && e.type === "text" && e.getAttribute("type") === "date") {

          this.date.push(e);
          if ($.datepicker) {

            // datepicker options
            var
              opts = {
                dateFormat: config.dateFormat,
                changeYear: true,
                changeMonth: true,
                onClose: function() { T.CheckField(this); }
              },
              min = Convert.Date.Parse(e.getAttribute("min"), [2,1,0]),
              max = Convert.Date.Parse(e.getAttribute("max"), [2,1,0]);

            if (min) opts.minDate = min;
            if (max) opts.maxDate = max;

            $(e).datepicker(opts);

          }

        }

        // group and trigger registration
        var g, tg, group = e.getAttribute(config.groupAttr), trigger = e.getAttribute(config.groupTriggerAttr);

        // field belongs to a group
        if (group) {
          group = group.replace(/\s+/,"").split(",");
          for (g = 0; g < group.length; g++) {
            tg = group[g];
            this.group[tg] = this.group[tg] || [];
            this.group[tg].push(e);
          }
        }

        // field is a group trigger
        if (trigger) {
          this.trigger.push(e);
        }

      }
    }

  };


  // is a field valid?
  FormValidator.prototype.CheckField = function(e) {

    // jQuery object
    var $e = $(e);

    // normalise text fields
    if (e.nodeName === "INPUT" || e.nodeName === "TEXTAREA") {
      e.value = e.value.replace(/^\s|\s$/g,"").replace(/\r/g,"").replace(/\n+/g,"<nl>").replace(/\s+/g," ").replace(/\s*<nl>\s*/g,"\n").replace(/\n+/g,"\n");
    }

    // set required class
    if (e.getAttribute("required") !== null) {
      $e.parent().addClass(config.requiredClass);
    }
    else {
      $e.parent().removeClass(config.requiredClass);
    }

    // browser validity available?
    if (typeof e.willValidate !== "undefined") {

      // unsupported input type - fallback validation
      if (e.nodeName === "INPUT" && e.type !== e.getAttribute("type")) {
        e.setCustomValidity(!e.disabled && this.FieldValid(e) ? "" : "error");
      }

      // standard valid/invalid event trigger
      if (e.checkValidity()) $(e).trigger({ type: "valid" });

    }
    else {

      // fallback validation for non-disabled fields
      e.validity = e.validity || {};
      e.validity.valid = true;

      if (!e.disabled) {
        e.validity.valid = this.FieldValid(e);
      }

      // custom valid/invalid event trigger
      $e.trigger({ type: (e.validity.valid ? "valid" : "invalid") });

    }
  };


  // format field and return true if valid
  FormValidator.prototype.FieldValid = function(e) {

    var
      valid = true,
      val = e.value,
      type = e.getAttribute("type"),
      chkbox = (type === "checkbox" || type === "radio"),
      required = e.getAttribute("required"),
      minlength = e.getAttribute("minlength"),
      maxlength = e.getAttribute("maxlength"),
      min = e.getAttribute("min"),
      max = e.getAttribute("max"),
      step = e.getAttribute("step"),
      pattern = e.getAttribute("pattern");

    switch(type) {

      case "date":
        var d = Convert.Date.Parse(val);
        valid = d &&
          (!min || d >= Convert.Date.Parse(min, [2,1,0])) &&
          (!max || d <= Convert.Date.Parse(max, [2,1,0]));
        if (valid) val = Convert.Date.Format(d);
        break;

      case "email":
        val = Convert.Email.Parse(val);
        valid = !!val;
        break;

      case "number":
      case "range":
        var n = Convert.Number.Parse(val);
        valid = n !== false &&
          (!min || n >= min) &&
          (!max || n <= max);
        if (valid && step) {
          var s = (n - (min ? min : 0)) / step;
          valid = (s === Math.floor(s));
        }
        if (valid) val = n;
        break;

    }

    // value required?
    valid = valid && (!required ||
      (chkbox && e.checked) ||
      (!chkbox && val !== "")
    );

    // minlength or maxlength set?
    valid = valid && (chkbox || (
      (!minlength || val.length >= minlength) &&
      (!maxlength || val.length <= maxlength)
    ));

    // test pattern
    if (valid && pattern) {
      pattern = new RegExp(pattern);
      valid = pattern.test(val);
    }

    // update field value
    if (valid && val !== e.value) e.value = val;

    return valid;

  };


  // trigger group enable/disable
  FormValidator.prototype.GroupField = function(e) {

    var
      trigger = e.getAttribute(config.groupTriggerAttr),
      trigval = e.getAttribute(config.groupTriggerValAttr);

    if (trigger) {
      trigger = trigger.replace(/\s+/,"").split(",");
      trigval = (trigval ? trigval.replace(/\s+/,"").split(",") : []);

      var g, tg, enabled, f, $f, ctrigval, v;
      for (g = 0; g < trigger.length; g++) {

        tg = trigger[g];
        if (this.group[tg]) {

          // is there a trigger value?
          if (trigval[g]) {
            ctrigval = trigval[g];
          }
          else {
            v = (e.nodeName === "SELECT" ? e.options[e.selectedIndex].value : e.value);
            ctrigval = (v ? v : null);
          }

          // is trigger enabled?
          enabled =
            ((e.type === "checkbox" || e.type === "radio") && e.checked) ||
            (e.type !== "checkbox" && e.type !== "radio" && e.value === ctrigval) ||
            (e.nodeName === "SELECT" && e.options[e.selectedIndex].value === ctrigval);

          // show/hide group
          $f = $(this.group[tg]).parent();
          if (enabled) {
            $f.removeClass(config.disableClass);
          }
          else {
            $f.addClass(config.disableClass);
          }

          // enable/disble fields
          for (f = 0; f < this.group[tg].length; f++) {
            this.group[tg][f].disabled = !enabled;
          }

        }

      }
    }
  };


  // is the form valid?
  FormValidator.prototype.CheckForm = function(e) {

    // find first invalid field
    var firstInvalid = null, submit = true, f;
    for (f = 0; f < this.field.length; f++) {
      this.CheckField(this.field[f]);
      submit &= (this.field[f].validity.valid || this.field[f].disabled);
      if (firstInvalid === null && !submit) firstInvalid = f;
    }

    // validation failed?
    if (!submit) {

      // stop submit, set focus and scroll to first invalid
      e.preventDefault();
      if (this.field[firstInvalid].focus) {
        this.field[firstInvalid].focus();
      }
      $("html,body").animate({ scrollTop: $(this.field[firstInvalid]).parent().offset().top }, config.scrollToElement);

    }

    //  TODO: >>>>>>>>> REMOVE BEFORE LAUNCH!
    if (submit) {
      Log("FORM WILL SUBMIT!");
      e.preventDefault();
      submit = false;
    }
    else {
      Log("Submit submit failed. First error at: " + this.field[firstInvalid].name);
    }
    // <<<<<<<<< END OF REMOVE CODE

    return submit;

  };


  // show/hide error indicator
  FormValidator.prototype.FieldError = function(e) {

    var p = $(e).parent();
    if (e.validity.valid) {
      p.removeClass(config.errorClass);
    }
    else {
      p.addClass(config.errorClass);
    }

  };


  // conversion and formatting functions
  var Convert = {};

  // number conversion
  Convert.Number = (function() {

    // parse string to number
    function Parse(num) {
      num = parseFloat(num);
      if (isNaN(num)) num = false;
      return num;
    }

    return {
      Parse: Parse
    };

  }());

  // date validation
  Convert.Date = (function() {

    var
      sep = "-",      // default date separator
      dmy = [0,1,2];  // default date number order

    // parse date
    function Parse(date, order) {

      order = order || dmy;

      var ret = false;
      date = String(date).replace(/^\D+|\D+$/g, "");
      date = date.replace(/\D+/g, sep);
      var digit = date.split(sep, 3);
      if (digit.length == 3) {

        var
          d = parseInt(digit[order[0]],10),
          m = parseInt(digit[order[1]],10),
          y = parseInt(digit[order[2]],10);

        // fix 2-digit years
        y += (y <= 40 ? 2000 : (y > 40 && y < 100 ? 1900 : 0));

        // validate
        ret = new Date(y, (m-1), d);
        if (d != ret.getDate() || (m-1) != ret.getMonth() || y != ret.getFullYear()) ret = false;
      }

      return ret;
    }

    // format date to a string
    function Format(date, order) {

      order = order || dmy;
      var ret = false;

      if (date.getFullYear) {

        var d = [
          ("00"+date.getDate()).slice(-2),
          ("00"+(date.getMonth()+1)).slice(-2),
          date.getFullYear()
        ];

        ret = d[order[0]] + sep + d[order[1]] + sep + d[order[2]];
      }

      return ret;

    }

    return {
      Parse: Parse,
      Format: Format
    };

  }());


  // email validation
  Convert.Email = (function() {

    var reEmail = /^[^@]+@[a-z0-9]+([_\.\-]{0,1}[a-z0-9]+)*([\.]{1}[a-z0-9]+)+$/;

    // parse email address
    function Parse(email) {
      email = email.toLowerCase();
      if (!reEmail.test(email)) email = false;
      return email;
    }

    return {
      Parse: Parse
    };

  }());


  // >>>>>>>>> output logging - remove these functions prior to deployment
  function LogForm(form) {
    var i, e;
    for(i = 0; i < form.elements.length; i++) {
      e=form.elements[i];
      Log(
        e.nodeName+":"+e.name+
        ", value:"+e.value
        //", type:"+e.type+" ("+e.getAttribute("type")+
        //"), willValidate:"+e.willValidate+
        //", valid:"+(e.validity ? e.validity.valid : "unknown")
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
  // <<<<<<<<< end of output logging

  // register forms
  Plymouth.Modules.register("validate", Validate);

}(jQuery));
