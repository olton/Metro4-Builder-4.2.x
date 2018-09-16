var List = {
    init: function( options, elem ) {
        this.options = $.extend( {}, this.options, options );
        this.elem  = elem;
        this.element = $(elem);
        this.currentPage = 1;
        this.pagesCount = 1;
        this.filterString = "";
        this.data = null;
        this.activity = null;
        this.busy = false;
        this.filters = [];
        this.wrapperInfo = null;
        this.wrapperSearch = null;
        this.wrapperRows = null;
        this.wrapperPagination = null;
        this.filterIndex = null;
        this.filtersIndexes = [];

        this.sort = {
            dir: "asc",
            colIndex: 0
        };

        this.header = null;
        this.items = [];

        this._setOptionsFromDOM();
        this._create();

        return this;
    },

    options: {

        thousandSeparator: ",",
        decimalSeparator: ",",

        sortTarget: "li",
        sortClass: null,
        sortDir: "asc",
        sortInitial: false,

        filterClass: null,
        filter: null,
        filterString: "",
        filters: null,
        source: null,

        showItemsSteps: false,
        showSearch: false,
        showListInfo: false,
        showPagination: false,
        showAllPages: false,
        showActivity: true,

        muteList: true,

        items: -1,
        itemsSteps: "all, 10,25,50,100",

        itemsAllTitle: "Show all",
        listItemsCountTitle: "Show entries:",
        listSearchTitle: "Search:",
        listInfoTitle: "Showing $1 to $2 of $3 entries",
        paginationPrevTitle: "Prev",
        paginationNextTitle: "Next",

        activityType: "cycle",
        activityStyle: "color",
        activityTimeout: 100,

        searchWrapper: null,
        rowsWrapper: null,
        infoWrapper: null,
        paginationWrapper: null,

        clsComponent: "",
        clsList: "",
        clsListItem: "",

        clsListTop: "",
        clsItemsCount: "",
        clsSearch: "",

        clsListBottom: "",
        clsListInfo: "",
        clsListPagination: "",

        clsPagination: "",

        onDraw: Metro.noop,
        onDrawItem: Metro.noop,
        onSortStart: Metro.noop,
        onSortStop: Metro.noop,
        onSortItemSwitch: Metro.noop,
        onSearch: Metro.noop,
        onRowsCountChange: Metro.noop,
        onDataLoad: Metro.noop,
        onDataLoaded: Metro.noop,
        onFilterItemAccepted: Metro.noop,
        onFilterItemDeclined: Metro.noop,

        onListCreate: Metro.noop
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

        if (o.source !== null) {
            Utils.exec(o.onDataLoad, [o.source], element[0]);

            $.get(o.source, function(data){
                that._build(data);
                Utils.exec(o.onDataLoaded, [o.source, data], element[0]);
            }).fail(function( jqXHR, textStatus, errorThrown) {
                console.log(textStatus); console.log(jqXHR); console.log(errorThrown);
            });
        } else {
            that._build();
        }
    },

    _build: function(data){
        var element = this.element, o = this.options;

        if (Utils.isValue(data)) {
            this._createItemsFromJSON(data);
        } else {
            this._createItemsFromHTML()
        }

        this._createStructure();
        this._createEvents();

        Utils.exec(o.onListCreate, [element], element[0]);
    },

    _createItemsFromHTML: function(){
        var that = this, element = this.element, o = this.options;

        this.items = [];

        $.each(element.children(o.sortTarget), function(){
            that.items.push(this);
        });
    },

    _createItemsFromJSON: function(source){
        var that = this;

        this.items = [];

        if (Utils.isValue(source.header)) {
            that.header = source.header;
        }

        if (Utils.isValue(source.data)) {
            $.each(source.data, function(){
                var row = this;
                var li = document.createElement("li");
                var inner = Utils.isValue(that.header.template) ? that.header.template : "";

                $.each(row, function(k, v){
                    inner = inner.replace("$"+k, v);
                });

                li.innerHTML = inner;
                that.items.push(li);
            });
        }
    },

    _createTopBlock: function (){
        var that = this, element = this.element, o = this.options;
        var top_block = $("<div>").addClass("list-top").addClass(o.clsListTop).insertBefore(element);
        var search_block, search_input, rows_block, rows_select;

        search_block = Utils.isValue(this.wrapperSearch) ? this.wrapperSearch : $("<div>").addClass("list-search-block").addClass(o.clsSearch).appendTo(top_block);

        search_input = $("<input>").attr("type", "text").appendTo(search_block);
        search_input.input({
            prepend: o.listSearchTitle
        });

        if (o.showSearch !== true) {
            search_block.hide();
        }

        rows_block = Utils.isValue(this.wrapperRows) ? this.wrapperRows : $("<div>").addClass("list-rows-block").addClass(o.clsItemsCount).appendTo(top_block);

        rows_select = $("<select>").appendTo(rows_block);
        $.each(Utils.strToArray(o.itemsSteps), function () {
            var option = $("<option>").attr("value", this === "all" ? -1 : this).text(this === "all" ? o.itemsAllTitle : this).appendTo(rows_select);
            if (parseInt(this) === parseInt(o.items)) {
                option.attr("selected", "selected");
            }
        });
        rows_select.select({
            filter: false,
            prepend: o.listItemsCountTitle,
            onChange: function (val) {
                if (parseInt(val) === parseInt(o.items)) {
                    return;
                }
                o.items = parseInt(val);
                that.currentPage = 1;
                that._draw();
                Utils.exec(o.onRowsCountChange, [val], element[0])
            }
        });

        if (o.showItemsSteps !== true) {
            rows_block.hide();
        }

        return top_block;
    },

    _createBottomBlock: function (){
        var element = this.element, o = this.options;
        var bottom_block = $("<div>").addClass("list-bottom").addClass(o.clsListBottom).insertAfter(element);
        var info, pagination;

        info = $("<div>").addClass("list-info").addClass(o.clsListInfo).appendTo(bottom_block);
        if (o.showListInfo !== true) {
            info.hide();
        }

        pagination = $("<div>").addClass("list-pagination").addClass(o.clsListPagination).appendTo(bottom_block);
        if (o.showPagination !== true) {
            pagination.hide();
        }

        return bottom_block;
    },

    _createStructure: function(){
        var that = this, element = this.element, o = this.options;
        var list_component;
        var w_search = $(o.searchWrapper),
            w_info = $(o.infoWrapper),
            w_rows = $(o.rowsWrapper),
            w_paging = $(o.paginationWrapper);

        if (w_search.length > 0) {this.wrapperSearch = w_search;}
        if (w_info.length > 0) {this.wrapperInfo = w_info;}
        if (w_rows.length > 0) {this.wrapperRows = w_rows;}
        if (w_paging.length > 0) {this.wrapperPagination = w_paging;}

        if (!element.parent().hasClass("list-component")) {
            list_component = $("<div>").addClass("list-component").insertBefore(element);
            element.appendTo(list_component);
        } else {
            list_component = element.parent();
        }

        list_component.addClass(o.clsComponent);

        this.activity =  $("<div>").addClass("list-progress").appendTo(list_component);
        $("<div>").activity({
            type: o.activityType,
            style: o.activityStyle
        }).appendTo(this.activity);

        if (o.showActivity !== true) {
            this.activity.css({
                visibility: "hidden"
            })
        }

        // element.html("").addClass(o.clsList);
        element.addClass(o.clsList);

        this._createTopBlock();
        this._createBottomBlock();

        if (Utils.isValue(o.filterString)) {
            this.filterString = o.filterString;
        }

        var filter_func;

        if (Utils.isValue(o.filter)) {
            filter_func = Utils.isFunc(o.filter);
            if (filter_func === false) {
                filter_func = Utils.func(o.filter);
            }
            that.filterIndex = that.addFilter(filter_func);
        }

        if (Utils.isValue(o.filters)) {
            $.each(Utils.strToArray(o.filters), function(){
                filter_func = Utils.isFunc(this);
                if (filter_func !== false) {
                    that.filtersIndexes.push(that.addFilter(filter_func));
                }
            });
        }

        this.currentPage = 1;

        this.sorting(o.sortClass, o.sortDir, true);
    },

    _createEvents: function(){
        var that = this, element = this.element;
        var component = element.parent();
        var search = component.find(".list-search-block input");
        var customSearch;

        search.on(Metro.events.inputchange, function(){
            that.filterString = this.value.trim().toLowerCase();
            if (that.filterString[that.filterString.length - 1] === ":") {
                return ;
            }
            that.currentPage = 1;
            that._draw();
        });

        if (Utils.isValue(this.wrapperSearch)) {
            customSearch = this.wrapperSearch.find("input");
            if (customSearch.length > 0) {
                customSearch.on(Metro.events.inputchange, function(){
                    that.filterString = this.value.trim().toLowerCase();
                    if (that.filterString[that.filterString.length - 1] === ":") {
                        return ;
                    }
                    that.currentPage = 1;
                    that._draw();
                });
            }
        }

        function pageLinkClick(l){
            var link = $(l);
            var item = link.parent();

            if (item.hasClass("active")) {
                return ;
            }

            if (item.hasClass("service")) {
                if (link.data("page") === "prev") {
                    that.currentPage--;
                    if (that.currentPage === 0) {
                        that.currentPage = 1;
                    }
                } else {
                    that.currentPage++;
                    if (that.currentPage > that.pagesCount) {
                        that.currentPage = that.pagesCount;
                    }
                }
            } else {
                that.currentPage = link.data("page");
            }

            that._draw();
        }

        component.on(Metro.events.click, ".pagination .page-link", function(){
            pageLinkClick(this)
        });

        if (Utils.isValue(this.wrapperPagination)) {
            this.wrapperPagination.on(Metro.events.click, ".pagination .page-link", function(){
                pageLinkClick(this)
            });
        }
    },

    _info: function(start, stop, length){
        var element = this.element, o = this.options;
        var component = element.parent();
        var info = Utils.isValue(this.wrapperInfo) ? this.wrapperInfo : component.find(".list-info");
        var text;

        if (info.length === 0) {
            return ;
        }

        if (stop > length) {
            stop = length;
        }

        if (this.items.length === 0) {
            start = stop = length = 0;
        }

        text = o.listInfoTitle;
        text = text.replace("$1", start);
        text = text.replace("$2", stop);
        text = text.replace("$3", length);
        info.html(text);
    },

    _paging: function(length){
        var that = this, element = this.element, o = this.options;
        var component = element.parent();
        var pagination_wrapper = Utils.isValue(this.wrapperPagination) ? this.wrapperPagination : component.find(".list-pagination");
        var i, prev, next;
        var shortDistance = 5;
        var pagination;

        pagination_wrapper.html("");

        pagination = $("<ul>").addClass("pagination").addClass(o.clsPagination).appendTo(pagination_wrapper);

        if (this.items.length === 0) {
            return ;
        }

        this.pagesCount = Math.ceil(length / o.items);

        var add_item = function(item_title, item_type, data){
            var li, a;

            li = $("<li>").addClass("page-item").addClass(item_type);
            a  = $("<a>").addClass("page-link").html(item_title);
            a.data("page", data);
            a.appendTo(li);

            return li;
        };

        prev = add_item(o.paginationPrevTitle, "service prev-page", "prev");
        pagination.append(prev);

        pagination.append(add_item(1, that.currentPage === 1 ? "active" : "", 1));

        if (o.showAllPages === true || this.pagesCount <= 7) {
            for (i = 2; i < this.pagesCount; i++) {
                pagination.append(add_item(i, i === that.currentPage ? "active" : "", i));
            }
        } else {
            if (that.currentPage < shortDistance) {
                for (i = 2; i <= shortDistance; i++) {
                    pagination.append(add_item(i, i === that.currentPage ? "active" : "", i));
                }

                if (this.pagesCount > shortDistance) {
                    pagination.append(add_item("...", "no-link", null));
                }
            } else if (that.currentPage <= that.pagesCount && that.currentPage > that.pagesCount - shortDistance + 1) {
                if (this.pagesCount > shortDistance) {
                    pagination.append(add_item("...", "no-link", null));
                }

                for (i = that.pagesCount - shortDistance + 1; i < that.pagesCount; i++) {
                    pagination.append(add_item(i, i === that.currentPage ? "active" : "", i));
                }
            } else {
                pagination.append(add_item("...", "no-link", null));

                pagination.append(add_item(that.currentPage - 1, "", that.currentPage - 1));
                pagination.append(add_item(that.currentPage, "active", that.currentPage));
                pagination.append(add_item(that.currentPage + 1, "", that.currentPage + 1));

                pagination.append(add_item("...", "no-link", null));
            }
        }

        if (that.pagesCount > 1 || that.currentPage < that.pagesCount) pagination.append(add_item(that.pagesCount, that.currentPage === that.pagesCount ? "active" : "", that.pagesCount));

        next = add_item(o.paginationNextTitle, "service next-page", "next");
        pagination.append(next);

        if (this.currentPage === 1) {
            prev.addClass("disabled");
        }

        if (this.currentPage === this.pagesCount) {
            next.addClass("disabled");
        }
    },

    _filter: function(){
        var that = this,
            element = this.element,
            o = this.options,
            items, i, data, inset, c1, result;

        if (Utils.isValue(this.filterString) || this.filters.length > 0) {
            items = this.items.filter(function(item){
                data = "";

                if (Utils.isValue(o.filterClass)) {
                    inset = item.getElementsByClassName(o.filterClass);

                    if (inset.length > 0) for (i = 0; i < inset.length; i++) {
                        data += inset[i].textContent;
                    }
                } else {
                    data = item.textContent;
                }

                c1 = data.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim().toLowerCase();
                result = Utils.isValue(that.filterString) ? c1.indexOf(that.filterString) > -1 : true;

                if (result === true && that.filters.length > 0) {
                    for (i = 0; i < that.filters.length; i++) {
                        if (Utils.exec(that.filters[i], [item]) !== true) {
                            result = false;
                            break;
                        }
                    }
                }

                if (result) {
                    Utils.exec(o.onFilterItemAccepted, [item], element[0]);
                } else {
                    Utils.exec(o.onFilterItemDeclined, [item], element[0]);
                }

                return result;
            });

            Utils.exec(o.onSearch, [that.filterString, items], element[0])
        } else {
            items = this.items;
        }

        return items;
    },

    _draw: function(cb){
        var element = this.element, o = this.options;
        var i;
        var start = o.items === -1 ? 0 : o.items * (this.currentPage - 1),
            stop = o.items === -1 ? this.items.length - 1 : start + o.items - 1;
        var items;

        items = this._filter();

        element.children(o.sortTarget).remove();

        for (i = start; i <= stop; i++) {
            if (Utils.isValue(items[i])) {
                $(items[i]).addClass(o.clsListItem).appendTo(element);
            }
            Utils.exec(o.onDrawItem, [items[i]], element[0]);
        }

        this._info(start + 1, stop + 1, items.length);
        this._paging(items.length);

        this.activity.hide();

        Utils.exec(o.onDraw, [element], element[0]);

        if (cb !== undefined) {
            Utils.exec(cb, [element], element[0])
        }
    },

    _getItemContent: function(item){
        var o = this.options;
        var i, inset, data;
        var format;

        if (Utils.isValue(o.sortClass)) {
            data = "";
            inset = $(item).find("."+o.sortClass);

            if (inset.length > 0) for (i = 0; i < inset.length; i++) {
                data += inset[i].textContent;
            }
            format = inset.length > 0 ? inset[0].getAttribute("data-format") : "";
        } else {
            data = item.textContent;
            format = item.getAttribute("data-format");
        }

        data = (""+data).toLowerCase().replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();

        if (Utils.isValue(format)) {

            if (['number', 'int', 'float', 'money'].indexOf(format) !== -1 && (o.thousandSeparator !== "," || o.decimalSeparator !== "." )) {
                data = Utils.parseNumber(data, o.thousandSeparator, o.decimalSeparator);
            }

            switch (format) {
                case "date": data = Utils.isDate(data) ? new Date(data) : ""; break;
                case "number": data = Number(data); break;
                case "int": data = parseInt(data); break;
                case "float": data = parseFloat(data); break;
                case "money": data = Utils.parseMoney(data); break;
            }
        }

        return data;
    },

    draw: function(){
        return this._draw();
    },

    sorting: function(source, dir, redraw){
        var that = this, element = this.element, o = this.options;

        if (Utils.isValue(source)) {
            o.sortClass = source;
        }
        if (Utils.isValue(dir) && ["asc", "desc"].indexOf(dir) > -1) {
            o.sortDir= dir;
        }

        Utils.exec(o.onSortStart, [this.items], element[0]);

        this.items.sort(function(a, b){
            var c1 = that._getItemContent(a);
            var c2 = that._getItemContent(b);
            var result = 0;

            if (c1 < c2) {
                result = o.sortDir === "asc" ? -1 : 1;
            }
            if (c1 > c2) {
                result = o.sortDir === "asc" ? 1 : -1;
            }

            if (result !== 0) {
                Utils.exec(o.onSortItemSwitch, [a, b, result], element[0]);
            }

            return result;
        });

        Utils.exec(o.onSortStop, [this.items], element[0]);

        if (redraw === true) {
            this._draw();
        }

        return this;
    },

    filter: function(val){
        this.filterString = val.trim().toLowerCase();
        this.currentPage = 1;
        this._draw();
    },

    loadData: function(source){
        var that = this, element = this.element, o = this.options;

        if (Utils.isValue(source) !== true) {
            return ;
        }

        o.source = source;

        Utils.exec(o.onDataLoad, [o.source], element[0]);

        $.get(o.source, function(data){
            Utils.exec(o.onDataLoaded, [o.source, data], element[0]);

            that._createItemsFromJSON(data);

            element.html("");

            if (Utils.isValue(o.filterString)) {
                that.filterString = o.filterString;
            }

            var filter_func;

            if (Utils.isValue(o.filter)) {
                filter_func = Utils.isFunc(o.filter);
                if (filter_func === false) {
                    filter_func = Utils.func(o.filter);
                }
                that.filterIndex = that.addFilter(filter_func);
            }

            if (Utils.isValue(o.filters)) {
                $.each(Utils.strToArray(o.filters), function(){
                    filter_func = Utils.isFunc(this);
                    if (filter_func !== false) {
                        that.filtersIndexes.push(that.addFilter(filter_func));
                    }
                });
            }

            that.currentPage = 1;

            that.sorting(o.sortClass, o.sortDir, true);

        }).fail(function( jqXHR, textStatus, errorThrown) {
            console.log(textStatus); console.log(jqXHR); console.log(errorThrown);
        });
    },

    next: function(){
        if (this.items.length === 0) return ;
        this.currentPage++;
        if (this.currentPage > this.pagesCount) {
            this.currentPage = this.pagesCount;
            return ;
        }
        this._draw();
    },

    prev: function(){
        if (this.items.length === 0) return ;
        this.currentPage--;
        if (this.currentPage === 0) {
            this.currentPage = 1;
            return ;
        }
        this._draw();
    },

    first: function(){
        if (this.items.length === 0) return ;
        this.currentPage = 1;
        this._draw();
    },

    last: function(){
        if (this.items.length === 0) return ;
        this.currentPage = this.pagesCount;
        this._draw();
    },

    page: function(num){
        if (num <= 0) {
            num = 1;
        }

        if (num > this.pagesCount) {
            num = this.pagesCount;
        }

        this.currentPage = num;
        this._draw();
    },

    addFilter: function(f, redraw){
        var func = Utils.isFunc(f);
        if (func === false) {
            return ;
        }
        this.filters.push(func);

        if (redraw === true) {
            this.currentPage = 1;
            this.draw();
        }

        return this.filters.length - 1;
    },

    removeFilter: function(key, redraw){
        Utils.arrayDeleteByKey(this.filters, key);
        if (redraw === true) {
            this.currentPage = 1;
            this.draw();
        }
        return this;
    },

    removeFilters: function(redraw){
        this.filters = [];
        if (redraw === true) {
            this.currentPage = 1;
            this.draw();
        }
    },

    getFilters: function(){
        return this.filters;
    },

    getFilterIndex: function(){
        return this.filterIndex;
    },

    getFiltersIndexes: function(){
        return this.filtersIndexes;
    },

    changeAttribute: function(attributeName){
        var that = this, element = this.element, o = this.options;

        var changeSortDir = function(){
            var dir = element.attr("data-sort-dir");
            if (!Utils.isValue(dir)) {
                return ;
            }
            o.sortDir = dir;
            that.sorting(o.sortClass, o.sortDir, true);
        };

        var changeSortClass = function(){
            var target = element.attr("data-sort-source");
            if (!Utils.isValue(target)) {
                return ;
            }
            o.sortClass = target;
            that.sorting(o.sortClass, o.sortDir, true);
        };

        var changeFilterString = function(){
            var filter = element.attr("data-filter-string");
            if (!Utils.isValue(target)) {
                return ;
            }
            o.filterString = filter;
            that.filter(o.filterString);
        };

        switch (attributeName) {
            case "data-sort-dir": changeSortDir(); break;
            case "data-sort-source": changeSortClass(); break;
            case "data-filter-string": changeFilterString(); break;
        }
    },

    destroy: function(){}
};

Metro.plugin('list', List);