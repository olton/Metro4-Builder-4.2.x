var RatingDefaultConfig = {
    static: false,
    title: null,
    value: 0,
    values: null,
    message: "",
    stars: 5,
    starColor: null,
    staredColor: null,
    roundFunc: "round", // ceil, floor, round
    half: true,
    clsRating: "",
    clsTitle: "",
    clsStars: "",
    clsResult: "",
    onStarClick: Metro.noop,
    onRatingCreate: Metro.noop
};

Metro.ratingSetup = function (options) {
    RatingDefaultConfig = $.extend({}, RatingDefaultConfig, options);
};

if (typeof window.metroRatingSetup !== undefined) {
    Metro.ratingSetup(window.metroRatingSetup);
}

var Rating = {
    init: function( options, elem ) {
        this.options = $.extend( {}, RatingDefaultConfig, options );
        this.elem  = elem;
        this.element = $(elem);
        this.value = 0;
        this.originValue = 0;
        this.values = [];
        this.rate = 0;
        this.rating = null;

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
        var i;

        if (isNaN(o.value)) {
            o.value = 0;
        } else {
            o.value = parseFloat(o.value).toFixed(1);
        }

        if (o.values !== null) {
            if (Array.isArray(o.values)) {
                this.values = o.values;
            } else if (typeof o.values === "string") {
                this.values = Utils.strToArray(o.values)
            }
        } else {
            for(i = 1; i <= o.stars; i++) {
                this.values.push(i);
            }
        }

        this.originValue = o.value;
        this.value = o.value > 0 ? Math[o.roundFunc](o.value) : 0;

        if (o.starColor !== null) {
            if (!Utils.isColor(o.starColor)) {
                o.starColor = Colors.color(o.starColor);
            }
        }

        if (o.staredColor !== null) {
            if (!Utils.isColor(o.staredColor)) {
                o.staredColor = Colors.color(o.staredColor);
            }
        }

        this._createRating();
        this._createEvents();

        Utils.exec(o.onRatingCreate, null, element[0]);
        element.fire("ratingcreate");
    },

    _createRating: function(){
        var element = this.element, o = this.options;

        var id = Utils.elementId("rating");
        var rating = $("<div>").addClass("rating " + String(element[0].className).replace("d-block", "d-flex")).addClass(o.clsRating);
        var i, stars, result, li;
        var sheet = Metro.sheet;
        var value = o.static ? Math.floor(this.originValue) : this.value;

        element.val(this.value);

        rating.attr("id", id);

        rating.insertBefore(element);
        element.appendTo(rating);

        stars = $("<ul>").addClass("stars").addClass(o.clsStars).appendTo(rating);

        for(i = 1; i <= o.stars; i++) {
            li = $("<li>").data("value", this.values[i-1]).appendTo(stars);
            if (i <= value) {
                li.addClass("on");
            }
        }

        result = $("<span>").addClass("result").addClass(o.clsResult).appendTo(rating);

        result.html(o.message);

        if (o.starColor !== null) {
            Utils.addCssRule(sheet, "#" + id + " .stars:hover li", "color: " + o.starColor + ";");
        }
        if (o.staredColor !== null) {
            Utils.addCssRule(sheet, "#"+id+" .stars li.on", "color: "+o.staredColor+";");
            Utils.addCssRule(sheet, "#"+id+" .stars li.half::after", "color: "+o.staredColor+";");
        }

        if (o.title !== null) {
            var title = $("<span>").addClass("title").addClass(o.clsTitle).html(o.title);
            rating.prepend(title);
        }

        if (o.static === true) {
            rating.addClass("static");
            if (o.half === true){
                var dec = Math.round((this.originValue % 1) * 10);
                if (dec > 0 && dec <= 9) {
                    rating.find('.stars li.on').last().next("li").addClass("half half-" + ( dec * 10));
                }
            }
        }

        element[0].className = '';
        if (o.copyInlineStyles === true) {
            for (i = 0; i < element[0].style.length; i++) {
                rating.css(element[0].style[i], element.css(element[0].style[i]));
            }
        }

        if (element.is(":disabled")) {
            this.disable();
        } else {
            this.enable();
        }

        this.rating = rating;
    },

    _createEvents: function(){
        var element = this.element, o = this.options;
        var rating = this.rating;

        rating.on(Metro.events.click, ".stars li", function(){

            if (o.static === true) {
                return ;
            }

            var star = $(this);
            var value = star.data("value");
            star.addClass("scale");
            setTimeout(function(){
                star.removeClass("scale");
            }, 300);
            element.val(value).trigger("change");
            star.addClass("on");
            star.prevAll().addClass("on");
            star.nextAll().removeClass("on");

            Utils.exec(o.onStarClick, [value, star[0]], element[0]);
            element.fire("starclick", {
                value: value,
                star: star[0]
            });
        });
    },

    val: function(v){
        var that = this, element = this.element, o = this.options;
        var rating = this.rating;

        if (v === undefined) {
            return this.value;
        }

        this.value = v > 0 ? Math[o.roundFunc](v) : 0;
        element.val(this.value).trigger("change");

        var stars = rating.find(".stars li").removeClass("on");
        $.each(stars, function(){
            var star = $(this);
            if (star.data("value") <= that.value) {
                star.addClass("on");
            }
        });

        return this;
    },

    msg: function(m){
        var rating = this.rating;
        if (m ===  undefined) {
            return ;
        }
        rating.find(".result").html(m);
        return this;
    },

    static: function (mode) {
        var o = this.options;
        var rating = this.rating;

        o.static = mode;

        if (mode === true) {
            rating.addClass("static");
        } else {
            rating.removeClass("static");
        }
    },

    changeAttributeValue: function(a){
        var element = this.element;
        var value = a === "value" ? element.val() : element.attr("data-value");
        this.val(value);
    },

    changeAttributeMessage: function(){
        var element = this.element;
        var message = element.attr("data-message");
        this.msg(message);
    },

    changeAttributeStatic: function(){
        var element = this.element;
        var isStatic = JSON.parse(element.attr("data-static")) === true;

        this.static(isStatic);
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
            case "value":
            case "data-value": this.changeAttributeValue(attributeName); break;
            case "disabled": this.toggleState(); break;
            case "data-message": this.changeAttributeMessage(); break;
            case "data-static": this.changeAttributeStatic(); break;
        }
    }
};

Metro.plugin('rating', Rating);