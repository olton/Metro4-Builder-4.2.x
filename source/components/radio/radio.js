var RadioDefaultConfig = {
    transition: true,
    style: 1,
    caption: "",
    captionPosition: "right",
    clsRadio: "",
    clsCheck: "",
    clsCaption: "",
    onRadioCreate: Metro.noop
};

Metro.radioSetup = function (options) {
    RadioDefaultConfig = $.extend({}, RadioDefaultConfig, options);
};

if (typeof window.metroRadioSetup !== undefined) {
    Metro.radioSetup(window.metroRadioSetup);
}

var Radio = {
    init: function( options, elem ) {
        this.options = $.extend( {}, RadioDefaultConfig, options );
        this.elem  = elem;
        this.element = $(elem);
        this.origin = {
            className: ""
        };

        this._setOptionsFromDOM();
        this._create();

        return this;
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
        var element = this.element, o = this.options;
        var radio = $("<label>").addClass("radio " + element[0].className).addClass(o.style === 2 ? "style2" : "");
        var check = $("<span>").addClass("check");
        var caption = $("<span>").addClass("caption").html(o.caption);

        element.attr("type", "radio");

        radio.insertBefore(element);
        element.appendTo(radio);
        check.appendTo(radio);
        caption.appendTo(radio);

        if (o.transition === true) {
            radio.addClass("transition-on");
        }

        if (o.captionPosition === 'left') {
            radio.addClass("caption-left");
        }

        this.origin.className = element[0].className;
        element[0].className = '';

        radio.addClass(o.clsRadio);
        caption.addClass(o.clsCaption);
        check.addClass(o.clsCheck);

        if (element.is(':disabled')) {
            this.disable();
        } else {
            this.enable();
        }

        Utils.exec(o.onRadioCreate, null, element[0]);
        element.fire("radiocreate");
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
        if (this.elem.disabled) {
            this.disable();
        } else {
            this.enable();
        }
    },

    changeAttribute: function(attributeName){
        var element = this.element, o = this.options;
        var parent = element.parent();

        var changeStyle = function(){
            var new_style = parseInt(element.attr("data-style"));

            if (!Utils.isInt(new_style)) return;

            o.style = new_style;
            parent.removeClass("style1 style2").addClass("style"+new_style);
        };

        switch (attributeName) {
            case 'disabled': this.toggleState(); break;
            case 'data-style': changeStyle(); break;
        }
    },

    destroy: function(){
        var element = this.element;
        var parent = element.parent();
        element[0].className = this.origin.className;
        element.insertBefore(parent);
        parent.remove();
    }
};

Metro.plugin('radio', Radio);