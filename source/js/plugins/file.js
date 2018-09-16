var File = {
    init: function( options, elem ) {
        this.options = $.extend( {}, this.options, options );
        this.elem  = elem;
        this.element = $(elem);

        this._setOptionsFromDOM();
        this._create();

        Utils.exec(this.options.onFileCreate, [this.element], elem);

        return this;
    },
    options: {
        buttonTitle: "Choose file(s)",
        prepend: "",
        clsComponent: "",
        clsPrepend: "",
        clsButton: "",
        clsCaption: "",
        copyInlineStyles: true,
        onSelect: Metro.noop,
        onFileCreate: Metro.noop
    },

    _setOptionsFromDOM: function(){
        var that = this, element = this.element, o = this.options;

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
        var container = $("<div>").addClass("file " + element[0].className).addClass(o.clsComponent);
        var caption = $("<span>").addClass("caption").addClass(o.clsCaption);
        var button;

        if (prev.length === 0) {
            parent.prepend(container);
        } else {
            container.insertAfter(prev);
        }

        element.appendTo(container);
        caption.insertBefore(element);

        button = $("<button>").addClass("button").attr("tabindex", -1).attr("type", "button").html(o.buttonTitle);
        button.appendTo(container);
        button.addClass(o.clsButton);

        if (element.attr('dir') === 'rtl' ) {
            container.addClass("rtl");
        }

        element[0].className = '';

        if (o.prepend !== "") {
            var prepend = $("<div>").html(o.prepend);
            prepend.addClass("prepend").addClass(o.clsPrepend).appendTo(container);
        }

        if (o.copyInlineStyles === true) {
            for (var i = 0, l = element[0].style.length; i < l; i++) {
                container.css(element[0].style[i], element.css(element[0].style[i]));
            }
        }

        if (element.is(":disabled")) {
            this.disable();
        } else {
            this.enable();
        }
    },

    _createEvents: function(){
        var element = this.element, o = this.options;
        var parent = element.parent();
        var caption = parent.find(".caption");
        parent.on(Metro.events.click, "button, .caption", function(){
            element.trigger("click");
        });
        element.on(Metro.events.change, function(){
            var fi = this;
            var file_names = [];
            var entry;
            if (fi.files.length === 0) {
                return ;
            }

            Array.from(fi.files).forEach(function(file){
                file_names.push(file.name);
            });

            entry = file_names.join(", ");

            caption.html(entry);
            caption.attr('title', entry);

            Utils.exec(o.onSelect, [fi.files, element], element[0]);
        });
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

    toggleDir: function(){
        if (this.element.attr("dir") === 'rtl') {
            this.element.parent().addClass("rtl");
        } else {
            this.element.parent().removeClass("rtl");
        }
    },

    changeAttribute: function(attributeName){
        switch (attributeName) {
            case 'disabled': this.toggleState(); break;
            case 'dir': this.toggleDir(); break;
        }
    },

    destroy: function(){
        var element = this.element;
        var parent = element.parent();
        element.off(Metro.events.change);
        parent.off(Metro.events.click, "button, .caption");
        element.insertBefore(parent);
        parent.remove();
    }
};

Metro.plugin('file', File);