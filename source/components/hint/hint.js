var HintDefaultConfig = {
    hintHide: 5000,
    clsHint: "",
    hintText: "",
    hintPosition: Metro.position.TOP,
    hintOffset: 4,
    onHintShow: Metro.noop,
    onHintHide: Metro.noop,
    onHintCreate: Metro.noop
};

Metro.hintSetup = function (options) {
    HintDefaultConfig = $.extend({}, HintDefaultConfig, options);
};

if (typeof window["metroHintSetup"] !== undefined) {
    Metro.hintSetup(window["metroHintSetup"]);
}

var Hint = {
    init: function( options, elem ) {
        this.options = $.extend( {}, HintDefaultConfig, options );
        this.elem  = elem;
        this.element = $(elem);
        this.hint = null;
        this.hint_size = {
            width: 0,
            height: 0
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
        var that = this, element = this.element, o = this.options;

        element.on(Metro.events.enter, function(){
            that.createHint();
            if (o.hintHide > 0) {
                setTimeout(function(){
                    that.removeHint();
                }, o.hintHide);
            }
        });

        element.on(Metro.events.leave, function(){
            //that.removeHint();
        });

        $(window).on(Metro.events.scroll, function(){
            if (that.hint !== null) that.setPosition();
        });

        Utils.exec(o.onHintCreate, null, element[0]);
        element.fire("hintcreate");
    },

    createHint: function(){
        var elem = this.elem, element = this.element, o = this.options;
        var hint = $("<div>").addClass("hint").addClass(o.clsHint).html(o.hintText);

        this.hint = hint;
        this.hint_size = Utils.hiddenElementSize(hint);

        $(".hint:not(.permanent-hint)").remove();

        if (elem.tagName === 'TD' || elem.tagName === 'TH') {
            var wrp = $("<div/>").css("display", "inline-block").html(element.html());
            element.html(wrp);
            element = wrp;
        }

        this.setPosition();

        hint.appendTo($('body'));
        Utils.exec(o.onHintShow, [hint[0]], element[0]);
        element.fire("hintshow", {
            hint: hint[0]
        });
    },

    setPosition: function(){
        var hint = this.hint, hint_size = this.hint_size, o = this.options, element = this.element;

        if (o.hintPosition === Metro.position.BOTTOM) {
            hint.addClass('bottom');
            hint.css({
                top: element.offset().top - $(window).scrollTop() + element.outerHeight() + o.hintOffset,
                left: element.offset().left + element.outerWidth()/2 - hint_size.width/2  - $(window).scrollLeft()
            });
        } else if (o.hintPosition === Metro.position.RIGHT) {
            hint.addClass('right');
            hint.css({
                top: element.offset().top + element.outerHeight()/2 - hint_size.height/2 - $(window).scrollTop(),
                left: element.offset().left + element.outerWidth() - $(window).scrollLeft() + o.hintOffset
            });
        } else if (o.hintPosition === Metro.position.LEFT) {
            hint.addClass('left');
            hint.css({
                top: element.offset().top + element.outerHeight()/2 - hint_size.height/2 - $(window).scrollTop(),
                left: element.offset().left - hint_size.width - $(window).scrollLeft() - o.hintOffset
            });
        } else {
            hint.addClass('top');
            hint.css({
                top: element.offset().top - $(window).scrollTop() - hint_size.height - o.hintOffset,
                left: element.offset().left - $(window).scrollLeft() + element.outerWidth()/2 - hint_size.width/2
            });
        }
    },

    removeHint: function(){
        var that = this;
        var hint = this.hint;
        var element = this.element;
        var options = this.options;
        var timeout = options.onHintHide === Metro.noop ? 0 : 300;

        if (hint !== null) {

            Utils.exec(options.onHintHide, [hint[0]], element[0]);
            element.fire("hinthide", {
                hint: hint[0]
            });

            setTimeout(function(){
                hint.hide(0, function(){
                    hint.remove();
                    that.hint = null;
                });
            }, timeout);
        }
    },

    changeText: function(){
        this.options.hintText = this.element.attr("data-hint-text");
    },

    changeAttribute: function(attributeName){
        if (attributeName === "data-hint-text") {
            this.changeText();
        }
    },

    destroy: function(){
        var element = this.element;
        this.removeHint();
        element.off(Metro.events.enter + "-hint");
        element.off(Metro.events.leave + "-hint");
        $(window).off(Metro.events.scroll + "-hint");
    }
};

Metro.plugin('hint', Hint);