var App = {
    init: function(){
        this.config = null;

        this.create();
    },

    create: function(){
        var that = this;

        $.json("config.json").then(function(data){
            that.config = data;

            that.build();
        });
    },

    build: function () {

        var container = $("#items-container");
        var config = this.config;

        $.each(config.groups, function(key, val){
            var group_name = val;
            var group = $("<div class='border bd-default p-4 mb-4'>").addClass("items-group " + "group-"+key).appendTo(container);
            var group_title = $("<h2>").addClass("text-light").html(group_name).appendTo(group);

            $.each(config[key], function(part_key, part_data){
                var part = $("<div>").addClass("items-part " + "part-"+part_key).appendTo(group);

                $("<div class='border-bottom bd-default'><input type='checkbox' data-style='2' data-role='checkbox' data-caption='"+config.parts[part_key]+"' onclick='App.selectAll(this)'></div>").appendTo(part);

                $.each(part_data, function(item_key, item_data){
                    var element = $("<input name='item[]' data-style='2' type='checkbox' data-role='checkbox' data-caption='"+item_data.name+"' value='"+item_key+"'>");
                    element.addClass("part-element w-100 w-50-sm w-25-lg").appendTo(part);
                })
            })
        })
    },

    submit: function (form) {
        var activity = Metro.activity.open({
            type: 'square',
            overlayColor: '#fff',
            overlayAlpha: 1,
            text: '<div class=\'mt-2 text-small\'>The assembly is started...<br>Please, wait...</div>',
            overlayClickClose: true
        });
        form.custom_less.value = lessEditor.getValue();
        form.custom_js.value = jsEditor.getValue();
        $.post(
            "builder.php",
            $(form).serialize(),
            function(response){
                Metro.activity.close(activity);
                if (response.result) {
                    console.log(response.message);
                    document.location.href = response.data.href;
                } else {
                    Metro.infobox.create("Error!<br/>" + response.message, "alert");
                }
            }
        );
    },

    selectAll: function(el){
        var check = $(el);
        var checked = check.is(":checked");
        var checks = check.closest(".items-part").find("input[type=checkbox]");

        checks.prop("checked", checked);
    }
};

App.init();