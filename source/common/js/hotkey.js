var Hotkey = {
    specialKeys: {
        8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
        20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
        37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
        96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
        104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
        112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
        120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 188: ",", 190: ".",
        191: "/", 224: "meta" },

    shiftNums: {
        "~":"`", "!":"1", "@":"2", "#":"3", "$":"4", "%":"5", "^":"6", "&":"7",
        "*":"8", "(":"9", ")":"0", "_":"-", "+":"=", ":":";", "\"":"'", "<":",",
        ">":".",  "?":"/",   "|":"\\"
    },

    shiftNumsInverse: {
        "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
        "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
        ".": ">",  "/": "?",  "\\": "|"
    },

    textAcceptingInputTypes: [
        "text", "password", "number", "email", "url", "range", "date", "month", "week", "time", "datetime",
        "datetime-local", "search", "color", "tel"
    ],

    getKey: function(e){
        var key, k = e.keyCode, char = String.fromCharCode( k ).toLowerCase();
        if( e.shiftKey ){
            key = Hotkey.shiftNums[ char ] ? Hotkey.shiftNums[ char ] : char;
        }
        else {
            key = Hotkey.specialKeys[ k ] === undefined
                ? char
                : Hotkey.specialKeys[ k ];
        }

        return Hotkey.getModifier(e).length ? Hotkey.getModifier(e).join("+") + "+" + key : key;
    },

    getModifier: function(e){
        var m = [];
        if (e.altKey) {m.push("alt");}
        if (e.ctrlKey) {m.push("ctrl");}
        if (e.shiftKey) {m.push("shift");}
        return m;
    }
};

$.fn.hotkey = function(key, fn){
    return this.each(function(){
        $(this).on(Metro.events.keyup+".hotkey-method-"+key, function(e){
            var _key = Hotkey.getKey(e);
            if (key === _key) Utils.exec(fn, [e, _key, key], this);
        })
    })
};

$(document).on(Metro.events.keyup + ".hotkey-data", function(e){
    var el, fn, key;

    if (
        (METRO_HOTKEYS_FILTER_INPUT_ACCEPTING_ELEMENTS && /textarea|input|select/i.test(e.target.nodeName)) ||
        (METRO_HOTKEYS_FILTER_CONTENT_EDITABLE && $(e.target).attr('contenteditable')) ||
        (METRO_HOTKEYS_FILTER_TEXT_INPUTS && Hotkey.textAcceptingInputTypes.indexOf(e.target.type) > -1)
    )
    {
        return;
    }

    key = Hotkey.getKey(e);

    if (Utils.keyInObject(Metro.hotkeys, key)) {
        el = Metro.hotkeys[key][0];
        fn = Metro.hotkeys[key][1];

        fn === false ? $(el).click() : Utils.exec(fn);
    }
});
