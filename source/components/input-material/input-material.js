var MaterialInputDefaultConfig = {
    label: "",
    informer: "",
    icon: "",

    permanentLabel: false,

    clsComponent: "",
    clsInput: "",
    clsLabel: "",
    clsInformer: "",
    clsIcon: "",
    clsLine: "",

    onInputCreate: Metro.noop
};

Metro.materialInputSetup = function (options) {
    MaterialInputDefaultConfig = $.extend({}, MaterialInputDefaultConfig, options);
};

if (typeof window.metroMaterialInputSetup !== undefined) {
    Metro.materialInputSetup(window.metroMaterialInputSetup);
}

var MaterialInput = {
    init: function( options, elem ) {
        this.options = $.extend( {}, MaterialInputDefaultConfig, options );
        this.elem  = elem;
        this.element = $(elem);
        this.history = [];
        this.historyIndex = -1;

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

        this._createStructure();
        this._createEvents();

        Utils.exec(o.onInputCreate, null, element[0]);
        element.fire("inputcreate");
    },

    _createStructure: function(){
        var element = this.element, o = this.options;
        var container = $("<div>").addClass("input-material " + element[0].className);

        element[0].className = "";
        element.attr("autocomplete", "nope");

        if (element.attr("type") === undefined) {
            element.attr("type", "text");
        }

        container.insertBefore(element);
        element.appendTo(container);

        if (Utils.isValue(o.label)) {
            $("<span>").html(o.label).addClass("label").addClass(o.clsLabel).insertAfter(element);
        }
        if (Utils.isValue(o.informer)) {
            $("<span>").html(o.informer).addClass("informer").addClass(o.clsInformer).insertAfter(element);
        }
        if (Utils.isValue(o.icon)) {
            container.addClass("with-icon");
            $("<span>").html(o.icon).addClass("icon").addClass(o.clsIcon).insertAfter(element);
        }

        container.append($("<hr>").addClass(o.clsLine));

        if (o.permanentLabel === true) {
            container.addClass("permanent-label");
        }

        container.addClass(o.clsComponent);
        element.addClass(o.clsInput);

        if (element.is(":disabled")) {
            this.disable();
        } else {
            this.enable();
        }
    },

    _createEvents: function(){

    },

    clear: function(){
        this.element.val('');
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
        switch (attributeName) {
            case 'disabled': this.toggleState(); break;
        }
    },

    destroy: function(){
        var element = this.element;
        var parent = element.parent();

        element.insertBefore(parent);
        parent.remove();
    }
};

Metro.plugin('materialinput', MaterialInput);