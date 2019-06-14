var TileDefaultConfig = {
    size: "medium",
    cover: "",
    coverPosition: "center",
    effect: "",
    effectInterval: 3000,
    effectDuration: 500,
    target: null,
    canTransform: true,
    onClick: Metro.noop,
    onTileCreate: Metro.noop
};

Metro.tileSetup = function (options) {
    TileDefaultConfig = $.extend({}, TileDefaultConfig, options);
};

if (typeof window.metroTileSetup !== undefined) {
    Metro.tileSetup(window.metroTileSetup);
}

var Tile = {
    init: function( options, elem ) {
        this.options = $.extend( {}, TileDefaultConfig, options );
        this.elem  = elem;
        this.element = $(elem);
        this.effectInterval = false;
        this.images = [];
        this.slides = [];
        this.currentSlide = -1;
        this.unload = false;

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

        this._createTile();
        this._createEvents();

        Utils.exec(o.onTileCreate, null, element[0]);
        element.fire("tilecreate");
    },

    _createTile: function(){
        function switchImage(el, img_src, i){
            $.setTimeout(function(){
                el.fadeOut(500, function(){
                    el.css("background-image", "url(" + img_src + ")");
                    el.fadeIn();
                });
            }, /*Utils.random(300,1000)*/ i * 300);
        }

        var that = this, element = this.element, o = this.options;
        var slides = element.find(".slide");
        var slides2 = element.find(".slide-front, .slide-back");

        element.addClass("tile-" + o.size);

        if (o.effect.indexOf("hover-") > -1) {
            element.addClass("effect-" + o.effect);
            $.each(slides2, function(){
                var slide = $(this);

                if (slide.data("cover") !== undefined) {
                    that._setCover(slide, slide.data("cover"), slide.data("cover-position"));
                }
            })
        }

        if (o.effect.indexOf("animate-") > -1 && slides.length > 1) {
            $.each(slides, function(i){
                var slide = $(this);

                that.slides.push(this);

                if (slide.data("cover") !== undefined) {
                    that._setCover(slide, slide.data("cover"), slide.data("cover-position"));
                }

                if (i > 0) {
                    if (["animate-slide-up", "animate-slide-down"].indexOf(o.effect) > -1) slide.css("top", "100%");
                    if (["animate-slide-left", "animate-slide-right"].indexOf(o.effect) > -1) slide.css("left", "100%");
                    if (["animate-fade"].indexOf(o.effect) > -1) slide.css("opacity", 0);
                }
            });

            this.currentSlide = 0;

            this._runEffects();
        }

        if (o.cover !== "") {
            this._setCover(element, o.cover);
        }

        if (o.effect === "image-set") {
            element.addClass("image-set");

            $.each(element.children("img"), function(i){
                that.images.push(this);
                $(this).remove();
            });

            var temp = this.images.slice();

            for(var i = 0; i < 5; i++) {
                var rnd_index = Utils.random(0, temp.length - 1);
                var div = $("<div>").addClass("img -js-img-"+i).css("background-image", "url("+temp[rnd_index].src+")");
                element.prepend(div);
                temp.splice(rnd_index, 1);
            }

            var a = [0, 1, 4, 3, 2];

            $.setInterval(function(){
                var temp = that.images.slice();
                var colors = Colors.colors(Colors.PALETTES.ALL), bg;
                bg = colors[Utils.random(0, colors.length - 1)];

                element.css("background-color", bg);

                for(var i = 0; i < a.length; i++) {
                    var rnd_index = Utils.random(0, temp.length - 1);
                    var div = element.find(".-js-img-"+a[i]);
                    switchImage(div, temp[rnd_index].src, i);
                    temp.splice(rnd_index, 1);
                }

                a = a.reverse();
            }, 5000);
        }
    },

    _runEffects: function(){
        var that = this, o = this.options;

        if (this.effectInterval === false) this.effectInterval = $.setInterval(function(){
            var current, next;

            current = $(that.slides[that.currentSlide]);

            that.currentSlide++;
            if (that.currentSlide === that.slides.length) {
                that.currentSlide = 0;
            }

            next = that.slides[that.currentSlide];

            if (o.effect === "animate-slide-up") Animation.slideUp($(current), $(next), o.effectDuration);
            if (o.effect === "animate-slide-down") Animation.slideDown($(current), $(next), o.effectDuration);
            if (o.effect === "animate-slide-left") Animation.slideLeft($(current), $(next), o.effectDuration);
            if (o.effect === "animate-slide-right") Animation.slideRight($(current), $(next), o.effectDuration);
            if (o.effect === "animate-fade") Animation.fade($(current), $(next), o.effectDuration);

        }, o.effectInterval);
    },

    _stopEffects: function(){
        $.clearInterval(this.effectInterval);
        this.effectInterval = false;
    },

    _setCover: function(to, src, pos){
        if (!Utils.isValue(pos)) {
            pos = this.options.coverPosition;
        }
        to.css({
            backgroundImage: "url("+src+")",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: pos
        });
    },

    _createEvents: function(){
        var that = this, element = this.element, o = this.options;

        element.on(Metro.events.start, function(e){
            var tile = $(this);
            var dim = {w: element.width(), h: element.height()};
            var X = Utils.pageXY(e).x - tile.offset().left,
                Y = Utils.pageXY(e).y - tile.offset().top;
            var side;

            if (Utils.isRightMouse(e) === false) {

                if (X < dim.w * 1 / 3 && (Y < dim.h * 1 / 2 || Y > dim.h * 1 / 2)) {
                    side = 'left';
                } else if (X > dim.w * 2 / 3 && (Y < dim.h * 1 / 2 || Y > dim.h * 1 / 2)) {
                    side = 'right';
                } else if (X > dim.w * 1 / 3 && X < dim.w * 2 / 3 && Y > dim.h / 2) {
                    side = 'bottom';
                } else {
                    side = "top";
                }

                if (o.canTransform === true) tile.addClass("transform-" + side);

                if (o.target !== null) {
                    setTimeout(function(){
                        document.location.href = o.target;
                    }, 100);
                }

                Utils.exec(o.onClick, [side], element[0]);
                element.fire("click", {
                    side: side
                });
            }
        });

        element.on([Metro.events.stop, Metro.events.leave].join(" "), function(){
            $(this)
                .removeClass("transform-left")
                .removeClass("transform-right")
                .removeClass("transform-top")
                .removeClass("transform-bottom");
        });

        $(window).on(Metro.events.blur, function(){
            // that._stopEffects();
        });
        $(window).on(Metro.events.focus, function(){
            // that._runEffects();
        });
    },

    changeAttribute: function(attributeName){

    }
};

Metro.plugin('tile', Tile);