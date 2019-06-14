var PanelDefaultConfig = {
    id: null,
    titleCaption: "",
    titleIcon: "",
    collapsible: false,
    collapsed: false,
    collapseDuration: METRO_ANIMATION_DURATION,
    width: "auto",
    height: "auto",
    draggable: false,

    customButtons: null,
    clsCustomButton: "",

    clsPanel: "",
    clsTitle: "",
    clsTitleCaption: "",
    clsTitleIcon: "",
    clsContent: "",
    clsCollapseToggle: "",

    onCollapse: Metro.noop,
    onExpand: Metro.noop,
    onDragStart: Metro.noop,
    onDragStop: Metro.noop,
    onDragMove: Metro.noop,
    onPanelCreate: Metro.noop
};

Metro.panelSetup = function (options) {
    PanelDefaultConfig = $.extend({}, PanelDefaultConfig, options);
};

if (typeof window.metroPanelSetup !== undefined) {
    Metro.panelSetup(window.metroPanelSetup);
}

var Panel = {
    init: function( options, elem ) {
        this.options = $.extend( {}, PanelDefaultConfig, options );
        this.elem  = elem;
        this.element = $(elem);

        this._setOptionsFromDOM();
        this._create();

        return this;
    },

    dependencies: ['draggable', 'collapse'],

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

    _addCustomButtons: function(buttons){
        var element = this.element, o = this.options;
        var title = element.closest(".panel").find(".panel-title");
        var buttonsContainer, customButtons = [];

        if (typeof buttons === "string" && buttons.indexOf("{") > -1) {
            customButtons = JSON.parse(buttons);
        } else if (typeof buttons === "string" && Utils.isObject(buttons)) {
            customButtons = Utils.isObject(buttons);
        } else if (typeof buttons === "object" && Utils.objectLength(buttons) > 0) {
            customButtons = buttons;
        } else {
            console.log("Unknown format for custom buttons", buttons);
            return ;
        }

        if (title.length === 0) {
            console.log("No place for custom buttons");
            return ;
        }

        buttonsContainer = title.find(".custom-buttons");

        if (buttonsContainer.length === 0) {
            buttonsContainer = $("<div>").addClass("custom-buttons").appendTo(title);
        } else {
            buttonsContainer.find(".btn-custom").off(Metro.events.click);
            buttonsContainer.html("");
        }

        $.each(customButtons, function(){
            var item = this;
            var customButton = $("<span>");

            customButton
                .addClass("button btn-custom")
                .addClass(o.clsCustomButton)
                .addClass(item.cls)
                .attr("tabindex", -1)
                .html(item.html);

            customButton.data("action", item.onclick);

            buttonsContainer.prepend(customButton);
        });

        title.on(Metro.events.click, ".btn-custom", function(e){
            if (Utils.isRightMouse(e)) return;
            var button = $(this);
            var action = button.data("action");
            Utils.exec(action, [button], this);
        });

        return this;
    },

    _create: function(){
        var element = this.element, o = this.options;
        var panel = $("<div>").addClass("panel").addClass(o.clsPanel);
        var id = o.id ? o.id : Utils.elementId("panel");
        var original_classes = element[0].className;
        var title;


        panel.attr("id", id).addClass(original_classes);
        panel.insertBefore(element);
        element.appendTo(panel);

        element[0].className = '';
        element.addClass("panel-content").addClass(o.clsContent).appendTo(panel);

        if (o.titleCaption !== "" || o.titleIcon !== "" || o.collapsible === true) {
            title = $("<div>").addClass("panel-title").addClass(o.clsTitle);

            if (o.titleCaption !== "") {
                $("<span>").addClass("caption").addClass(o.clsTitleCaption).html(o.titleCaption).appendTo(title)
            }

            if (o.titleIcon !== "") {
                $(o.titleIcon).addClass("icon").addClass(o.clsTitleIcon).appendTo(title)
            }

            if (o.collapsible === true) {
                var collapseToggle = $("<span>").addClass("dropdown-toggle marker-center active-toggle").addClass(o.clsCollapseToggle).appendTo(title);
                element.collapse({
                    toggleElement: collapseToggle,
                    duration: o.collapseDuration,
                    onCollapse: o.onCollapse,
                    onExpand: o.onExpand
                });

                if (o.collapsed === true) {
                    this.collapse();
                }
            }

            title.appendTo(panel);
        }

        if (title && Utils.isValue(o.customButtons)) {
            this._addCustomButtons(o.customButtons);
        }

        if (o.draggable === true) {
            var dragElement;

            if (title) {
                dragElement = title.find(".caption, .icon");
            } else {
                dragElement = panel;
            }

            panel.draggable({
                dragElement: dragElement,
                onDragStart: o.onDragStart,
                onDragStop: o.onDragStop,
                onDragMove: o.onDragMove
            });
        }

        if (o.width !== "auto" && parseInt(o.width) >= 0) {
            panel.outerWidth(parseInt(o.width));
        }

        if (o.height !== "auto" && parseInt(o.height) >= 0) {
            panel.outerHeight(parseInt(o.height));
            element.css({overflow: "auto"});
        }

        this.panel = panel;

        Utils.exec(o.onPanelCreate, null,element[0]);
        element.fire("panelcreate");
    },

    customButtons: function(buttons){
        return this._addCustomButtons(buttons);
    },

    collapse: function(){
        var element = this.element;
        if (Utils.isMetroObject(element, 'collapse') === false) {
            return ;
        }
        element.data('collapse').collapse();
    },

    expand: function(){
        var element = this.element;
        if (Utils.isMetroObject(element, 'collapse') === false) {
            return ;
        }
        element.data('collapse').expand();
    },

    changeAttribute: function(attributeName){
    }
};

Metro.plugin('panel', Panel);