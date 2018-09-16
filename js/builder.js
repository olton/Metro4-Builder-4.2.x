var App = {
    init: function(){
        this.config = null;

        this.create();
    },

    create: function(){
        var that = this;

        $.get("config.json", function(data){
            that.config = data;

            that.build();
        })
    },

    build: function () {

        var container = $("#items-container");
        var config = this.config;

        $.each(config.groups, function(key, val){
            var group_name = val;
            var group = $("<div>").addClass("items-group " + "group-"+key).appendTo(container);
            var group_title = $("<h2>").addClass("text-light").html(group_name).appendTo(group);

            $.each(config[key], function(part_key, part_data){
                var part = $("<div>").addClass("items-part " + "part-"+part_key).appendTo(group);
                var part_title = $("<h5>").html(config.parts[part_key]).appendTo(part);
                var part_select = $("<input type='checkbox' data-role='checkbox' onclick='App.selectAll(this)'>").appendTo(part_title);

                $.each(part_data, function(item_key, item_data){
                    var element = $("<input name='item[]' type='checkbox' data-role='checkbox' data-caption='"+item_data.name+"' value='"+item_key+"'>");
                    element.addClass("part-element w-100 w-50-sm w-25-lg").appendTo(part);
                })
            })
        })
    },

    submit: function (form) {
        $.post(
            "builder.php",
            $(form).serialize(),
            function(response){
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