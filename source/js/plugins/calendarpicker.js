var CalendarPicker = {
    init: function( options, elem ) {
        this.options = $.extend( {}, this.options, options );
        this.elem  = elem;
        this.element = $(elem);
        this.value = null;
        this.value_date = null;
        this.calendar = null;
        this.overlay = null;

        this._setOptionsFromDOM();
        this._create();

        Utils.exec(this.options.onCalendarPickerCreate, [this.element], this.elem);

        return this;
    },

    dependencies: ['calendar'],

    options: {

        calendarWide: false,
        calendarWidePoint: null,


        dialogMode: false,
        dialogPoint: 360,
        dialogOverlay: true,
        overlayColor: '#000000',
        overlayAlpha: .5,

        locale: METRO_LOCALE,
        size: "100%",
        format: METRO_DATE_FORMAT,
        inputFormat: null,
        headerFormat: "%A, %b %e",
        clearButton: false,
        calendarButtonIcon: "<span class='default-icon-calendar'></span>",
        clearButtonIcon: "<span class='default-icon-cross'></span>",
        copyInlineStyles: false,
        clsPicker: "",
        clsInput: "",

        yearsBefore: 100,
        yearsAfter: 100,
        weekStart: METRO_WEEK_START,
        outside: true,
        ripple: false,
        rippleColor: "#cccccc",
        exclude: null,
        minDate: null,
        maxDate: null,
        special: null,
        showHeader: true,

        clsCalendar: "",
        clsCalendarHeader: "",
        clsCalendarContent: "",
        clsCalendarMonths: "",
        clsCalendarYears: "",
        clsToday: "",
        clsSelected: "",
        clsExcluded: "",

        onDayClick: Metro.noop,
        onCalendarPickerCreate: Metro.noop,
        onCalendarShow: Metro.noop,
        onCalendarHide: Metro.noop,
        onChange: Metro.noop,
        onMonthChange: Metro.noop,
        onYearChange: Metro.noop
    },

    _setOptionsFromDOM: function(){
        var element = this.element, o = this.options;

        $.each(element.data(), function(key, value){
            if (key in o) {
                try {
                    o[key] = JSON.parse(value);
                } catch (e) {
                    o[key] = value;
                }
            }
        });
    },

    _create: function(){

        this._createStructure();
        this._createEvents();
    },

    _createStructure: function(){
        var that = this, element = this.element, o = this.options;
        var prev = element.prev();
        var parent = element.parent();
        var container = $("<div>").addClass("input " + element[0].className + " calendar-picker");
        var buttons = $("<div>").addClass("button-group");
        var calendarButton, clearButton, cal = $("<div>").addClass("drop-shadow");
        var curr = element.val().trim();

        if (element.attr("type") === undefined) {
            element.attr("type", "text");
        }

        if (!Utils.isValue(curr)) {
            this.value = (new Date()).format("%Y/%m/%d");
        } else {
            this.value = Utils.isValue(o.inputFormat) === false ? curr : (curr.toDate(o.inputFormat)).format("%Y/%m/%d");
        }

        if (Utils.isDate(this.value)) {
            this.value_date = new Date(this.value);
            this.value_date.setHours(0,0,0,0);
            element.val(this.value_date.format(o.format));
        }

        if (prev.length === 0) {
            parent.prepend(container);
        } else {
            container.insertAfter(prev);
        }

        element.appendTo(container);
        buttons.appendTo(container);
        cal.appendTo(container);

        cal.calendar({
            wide: o.calendarWide,
            widePoint: o.calendarWidePoint,

            format: o.format,
            inputFormat: o.inputFormat,
            pickerMode: true,
            show: o.value,
            locale: o.locale,
            weekStart: o.weekStart,
            outside: o.outside,
            buttons: false,
            headerFormat: o.headerFormat,

            clsCalendar: o.clsCalendar + " calendar-picker",
            clsCalendarHeader: o.clsCalendarHeader,
            clsCalendarContent: o.clsCalendarContent,
            clsCalendarFooter: "d-none",
            clsCalendarMonths: o.clsCalendarMonths,
            clsCalendarYears: o.clsCalendarYears,
            clsToday: o.clsToday,
            clsSelected: o.clsSelected,
            clsExcluded: o.clsExcluded,

            ripple: o.ripple,
            rippleColor: o.rippleColor,
            exclude: o.exclude,
            minDate: o.minDate,
            maxDate: o.maxDate,
            yearsBefore: o.yearsBefore,
            yearsAfter: o.yearsAfter,
            special: o.special,
            showHeader: o.showHeader,
            showFooter: false,
            onDayClick: function(sel, day, el){
                var date = new Date(sel[0]);

                that._removeOverlay();

                that.value = date.format(Metro.utils.isValue(o.inputFormat) ? o.inputFormat : "%Y/%m/%d");
                that.value_date = date;
                element.val(date.format(o.format, o.locale));
                element.trigger("change");
                cal.removeClass("open open-up");
                cal.hide();
                Utils.exec(o.onChange, [that.value, that.value_date, element], element[0]);
                Utils.exec(o.onDayClick, [sel, day, el], element[0]);
            },
            onMonthChange: o.onMonthChange,
            onYearChange: o.onYearChange
        });

        cal.hide();

        this.calendar = cal;

        if (o.clearButton === true) {
            clearButton = $("<button>").addClass("button input-clear-button").attr("tabindex", -1).attr("type", "button").html(o.clearButtonIcon);
            clearButton.appendTo(buttons);
        }

        calendarButton = $("<button>").addClass("button").attr("tabindex", -1).attr("type", "button").html(o.calendarButtonIcon);
        calendarButton.appendTo(buttons);


        if (element.attr('dir') === 'rtl' ) {
            container.addClass("rtl");
        }

        if (String(o.size).indexOf("%") > -1) {
            container.css({
                width: o.size
            });
        } else {
            container.css({
                width: parseInt(o.size) + "px"
            });
        }

        element[0].className = '';
        element.attr("readonly", true);

        if (o.copyInlineStyles === true) {
            $.each(Utils.getInlineStyles(element), function(key, value){
                container.css(key, value);
            });
        }

        container.addClass(o.clsPicker);
        element.addClass(o.clsInput);

        if (o.dialogOverlay === true) {
            this.overlay = that._overlay();
        }

        if (o.dialogMode === true) {
            container.addClass("dialog-mode");
        } else {
            if (Utils.media("(max-width: "+o.dialogPoint+"px)")) {
                container.addClass("dialog-mode");
            }
        }
    },

    _createEvents: function(){
        var that = this, element = this.element, o = this.options;
        var container = element.parent();
        var clear = container.find(".input-clear-button");
        var cal = this.calendar;

        $(window).on(Metro.events.resize, function(){
            if (o.dialogMode !== true) {
                if (Utils.media("(max-width: " + o.dialogPoint + "px)")) {
                    container.addClass("dialog-mode");
                } else {
                    container.removeClass("dialog-mode");
                }
            }
        });

        if (clear.length > 0) clear.on(Metro.events.click, function(e){
            element.val("").trigger('change').blur();
            that.value = (new Date()).format("%Y/%m/%d");
            that.value_date = new Date(this.value);
            that.value_date.setHours(0,0,0,0);
            e.preventDefault();
            e.stopPropagation();
        });

        container.on(Metro.events.click, "button, input", function(e){
            if (Utils.isDate(that.value, o.inputFormat) && (cal.hasClass("open") === false && cal.hasClass("open-up") === false)) {
                cal.css({
                    visibility: "hidden",
                    display: "block"
                });
                cal.data('calendar').setPreset(that.value);
                cal.data('calendar').setShow(that.value);
                cal.data('calendar').setToday(that.value);
                cal.css({
                    visibility: "visible",
                    display: "none"
                });
            }
            if (cal.hasClass("open") === false && cal.hasClass("open-up") === false) {
                if (container.hasClass("dialog-mode")) {
                    that.overlay.appendTo($('body'));
                }
                $(".calendar-picker .calendar").removeClass("open open-up").hide();
                cal.addClass("open");
                if (Utils.isOutsider(cal) === false) {
                    cal.addClass("open-up");
                }
                cal.show();
                Utils.exec(o.onCalendarShow, [element, cal]);
            } else {

                that._removeOverlay();

                cal.removeClass("open open-up");
                cal.hide();
                Utils.exec(o.onCalendarHide, [element, cal]);
            }
            e.preventDefault();
            e.stopPropagation();
        });

        element.on(Metro.events.blur, function(){container.removeClass("focused");});
        element.on(Metro.events.focus, function(){container.addClass("focused");});
        element.on(Metro.events.change, function(){
            Utils.exec(o.onChange, [that.value_date, that.value, element], element[0]);
        });
    },

    _overlay: function(){
        var o = this.options;

        var overlay = $("<div>");
        overlay.addClass("overlay for-calendar-picker").addClass(o.clsOverlay);

        if (o.overlayColor === 'transparent') {
            overlay.addClass("transparent");
        } else {
            overlay.css({
                background: Utils.hex2rgba(o.overlayColor, o.overlayAlpha)
            });
        }

        return overlay;
    },

    _removeOverlay: function(){
        $('body').find('.overlay.for-calendar-picker').remove();
    },

    val: function(v){
        var element = this.element, o = this.options;

        if (v === undefined) {
            return this.value_date;
        }

        if (Utils.isDate(v) === true) {
            this.value_date = new Date(v);
            this.value = this.value_date.format(o.format);
            element.val(this.value_date.format(o.format));
            element.trigger("change");
        }
    },

    changeValue: function(){
        var element = this.element;
        this.val(element.attr("value"));
    },

    disable: function(){
        this.element.data("disabled", true);
        this.element.parent().addClass("disabled");
    },

    enable: function(){
        this.element.data("disabled", false);
        this.element.parent().removeClass("disabled");
    },

    toggleState: function(){
        if (this.element.data("disabled") === false) {
            this.disable();
        } else {
            this.enable();
        }
    },

    i18n: function(val){
        var o = this.options;
        var hidden;
        var cal = this.calendar;
        if (val === undefined) {
            return o.locale;
        }
        if (Metro.locales[val] === undefined) {
            return false;
        }

        hidden = cal.is(':hidden');
        if (hidden) {
            cal.css({
                visibility: "hidden",
                display: "block"
            });
        }
        cal.data('calendar').i18n(val);
        if (hidden) {
            cal.css({
                visibility: "visible",
                display: "none"
            });
        }
    },

    changeAttrLocale: function(){
        var element = this.element;
        this.i18n(element.attr("data-locale"));
    },

    changeAttrSpecial: function(){
        var element = this.element;
        var cal = this.calendar.data("calendar");
        cal.setSpecial(element.attr("data-special"));
    },

    changeAttrExclude: function(){
        var element = this.element;
        var cal = this.calendar.data("calendar");
        cal.setExclude(element.attr("data-exclude"));
    },

    changeAttrMinDate: function(){
        var element = this.element;
        var cal = this.calendar.data("calendar");
        cal.setMinDate(element.attr("data-min-date"));
    },

    changeAttrMaxDate: function(){
        var element = this.element;
        var cal = this.calendar.data("calendar");
        cal.setMaxDate(element.attr("data-max-date"));
    },

    changeAttribute: function(attributeName){
        switch (attributeName) {
            case "value": this.changeValue(); break;
            case 'disabled': this.toggleState(); break;
            case 'data-locale': this.changeAttrLocale(); break;
            case 'data-special': this.changeAttrSpecial(); break;
            case 'data-exclude': this.changeAttrExclude(); break;
            case 'data-min-date': this.changeAttrMinDate(); break;
            case 'data-max-date': this.changeAttrMaxDate(); break;
        }
    }
};

Metro.plugin('calendarpicker', CalendarPicker);

$(document).on(Metro.events.click, ".overlay.for-calendar-picker",function(){
    $(this).remove();
});

$(document).on(Metro.events.click, function(){
    $(".calendar-picker .calendar").removeClass("open open-up").hide();
});
