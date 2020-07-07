/** 数据列表组件 date:2020-05-04   License By http://easyweb.vip */
layui.define(['laytpl', 'laypage', 'form'], function (exports) {
    var $ = layui.jquery;
    var laytpl = layui.laytpl;
    var laypage = layui.laypage;
    var form = layui.form;
    var MOD_NAME = 'DataGrid';
    var loadingClass = 'ew-datagrid-loading';
    var itemClass = 'ew-datagrid-item';
    var loadMoreLoadingClass = 'ew-loading', loadMoreEndClass = 'ew-more-end';
    // 默认分页参数
    var defaultPage = {
        limit: 10, layout: ['prev', 'page', 'next', 'skip', 'count', 'limit']
    };
    // 默认加载更多参数
    var defaultMore = {
        first: true, curr: 1, limit: 10, text: '加载更多', loadingText: '加载中...',
        noMoreText: '没有更多数据了~', errorText: '加载失败，请重试'
    };

    /** DataGrid构造方法 */
    var DataGrid = function (opt) {
        // 配置项
        this.options = $.extend(true, {
            method: 'GET', request: {pageName: 'page', limitName: 'limit'}, useAdmin: false,
            showError: function (res) {
                $(this.elem).empty();
            },
            showEmpty: function (res) {
                $(this.elem).empty();
            },
            showLoading: function () {
                $(this.elem).addClass(loadingClass);
            },
            hideLoading: function () {
                $(this.elem).removeClass(loadingClass);
            }
        }, opt);
        if (opt.page) this.options.page = $.extend({}, defaultPage, opt.page === true ? {} : opt.page);
        if (opt.loadMore) this.options.loadMore = $.extend({}, defaultMore, opt.loadMore === true ? {} : opt.loadMore);
        // 兼容旧版本参数
        if (typeof this.options.data === 'string') {
            this.options.url = this.options.data;
            this.options.data = undefined;
        }
        this.init();  // 初始化
        this.bindEvents();  // 绑定事件
    };

    /** 初始化 */
    DataGrid.prototype.init = function () {
        var that = this;
        var options = this.options;
        var components = this.getComponents();
        if ('static' === components.$elem.css('position')) components.$elem.css('position', 'relative');
        // 渲染全选按钮
        if (options.checkAllElem) {
            var $old = components.$checkAll.find('input[lay-filter="' + components.checkAllFilter + '"]');
            $old.next('.layui-form-checkbox').remove();
            $old.remove();
            components.$checkAll.append([
                '<input type="checkbox"',
                ' lay-filter="', components.checkAllFilter, '"',
                ' lay-skin="primary" class="ew-datagrid-checkbox" />'
            ].join(''));
            if (!components.$checkAll.hasClass('layui-form')) components.$checkAll.addClass('layui-form');
            if (!components.$checkAll.attr('lay-filter')) components.$checkAll.attr('lay-filter', options.checkAllElem.substring(1));
            form.render('checkbox', components.$checkAll.attr('lay-filter'));
        }
        // 渲染数据
        if (options.url) {  // url加载模式
            options.reqData = function (param, callback) {
                if (!options.where) options.where = {};
                options.where[options.request.pageName] = param.page;
                options.where[options.request.limitName] = param.limit;
                (options.useAdmin ? layui.admin : $).ajax({
                    url: options.url,
                    data: options.contentType && options.contentType.indexOf('application/json') === 0 ? JSON.stringify(options.where) : options.where,
                    headers: options.headers,
                    type: options.method,
                    dataType: 'json',
                    contentType: options.contentType,
                    success: function (res) {
                        callback(options.parseData ? options.parseData(res) : res);
                    },
                    error: function (xhr) {
                        callback({code: xhr.status, msg: xhr.statusText, xhr: xhr});
                    }
                });
            };
        } else if (options.data) {  // 数据渲染模式
            options.reqData = undefined;
            if (options.loadMore) {  // 开启加载更多
                that.renderLoadMore();
                that.changeLoadMore(2);
                that.renderBody(options.data, 0, false, true);
                options.done && options.done(options.data, 1, options.data.length);
            } else if (options.page) {  // 开启分页
                options.page.count = options.data.length;
                options.page.jump = function (obj, first) {
                    options.showLoading();
                    var start = (obj.curr - 1) * options.page.limit;
                    var end = start + options.page.limit;
                    if (end > options.data.length) end = options.data.length;
                    var currData = [];
                    for (var i = start; i < end; i++) currData.push(options.data[i]);
                    options.page.data = currData;
                    that.renderBody(currData, (obj.curr - 1) * obj.limit, false, true);
                    options.hideLoading();
                    if (options.data.length === 0) options.showEmpty && options.showEmpty({});
                    options.done && options.done(currData, obj.curr, obj.count);
                };
                that.renderPage();
            } else {  // 不分页
                that.renderBody(options.data, 0, false, true);
                if (options.data.length === 0) options.showEmpty && options.showEmpty({});
                options.done && options.done(options.data, 1, options.data.length);
            }
        }
        // 异步加载模式
        if (!options.reqData) return;
        if (options.loadMore) {  // 加载更多模式
            that.renderLoadMore().click(function () {
                if ($(this).hasClass(loadMoreLoadingClass)) return;
                if (options.loadMore.first) options.loadMore.first = false;
                else options.loadMore.curr++;
                that.changeLoadMore(1);  // 设置加载中状态
                options.reqData({page: options.loadMore.curr, limit: options.loadMore.limit}, function (res) {
                    if (res.code != 0) {
                        that.changeLoadMore(3);  // 加载失败
                        options.loadMore.curr--;
                        return;
                    }
                    that.changeLoadMore(0);  // 加载成功
                    that.renderBody(res.data, (options.loadMore.curr - 1) * options.loadMore.limit, options.loadMore.curr !== 1);
                    options.done && options.done(res.data, options.loadMore.curr, res.count || res.data.length);
                    if (!res.data || res.data.length < options.loadMore.limit) that.changeLoadMore(2);  // 没有更多数据
                });
            }).trigger('click');
        } else if (options.page) {  // 分页模式
            options.showLoading();
            options.reqData({page: 1, limit: options.page.limit}, function (res) {
                options.hideLoading();
                if (typeof res === 'string' || !res.data) return options.showError && options.showError(res);  // 加载失败
                if (res.data.length === 0) return options.showEmpty && options.showEmpty(res);  // 空数据
                options.page.count = res.count;
                options.page.jump = function (obj, first) {
                    if (first) return;
                    options.showLoading();
                    options.reqData({page: obj.curr, limit: obj.limit}, function (r) {
                        options.hideLoading();
                        if (typeof r === 'string' || !r.data) return options.showError && options.showError(r);  // 加载失败
                        if (r.data.length === 0) return options.showEmpty && options.showEmpty(r);  // 空数据
                        that.renderBody(r.data, (obj.curr - 1) * obj.limit);
                        options.done && options.done(r.data, obj.curr, obj.count);
                    });
                };
                that.renderPage();
                that.renderBody(res.data);
                options.done && options.done(res.data, 1, res.count);
            });
        } else {  // 不分页
            options.showLoading();
            options.reqData({}, function (res) {
                options.hideLoading();
                if (res.code != 0) return options.showError && options.showError(res);  // 加载失败
                if (!res.data || res.data.length === 0) return options.showEmpty && options.showEmpty(res);  // 空数据
                that.renderBody(res.data);
                options.done && options.done(res.data, 1, res.data.length);
            });
        }
    };

    /** 绑定各项事件 */
    DataGrid.prototype.bindEvents = function () {
        var that = this;
        var components = this.getComponents();

        /* 事件公共返回对象 */
        var commonMember = function (ext) {
            var $item = $(this);
            if (!$item.hasClass(itemClass)) {
                var $temp = $item.parent('.' + itemClass);
                $item = $temp.length > 0 ? $temp : $item.parentsUntil('.' + itemClass).last().parent();
            }
            var index = $item.data('index');
            var obj = {
                elem: $item,  // 当前item的dom
                data: that.getData(index), //当前item的数据
                index: index,  // 当前item索引
                del: function () { // 删除item
                    that.del(index);
                },
                update: function (fields, type) {  // 修改item
                    that.update(index, fields, type);
                }
            };
            return $.extend(obj, ext);
        };

        // item点击事件
        components.$elem.off('click.item').on('click.item', '>.' + itemClass, function () {
            layui.event.call(this, MOD_NAME, 'item(' + components.filter + ')', commonMember.call(this, {}));
        });

        // item双击事件
        components.$elem.off('dblclick.itemDouble').on('click.itemDouble', '>.' + itemClass, function () {
            layui.event.call(this, MOD_NAME, 'itemDouble(' + components.filter + ')', commonMember.call(this, {}));
        });

        // lay-event点击事件
        components.$elem.off('click.tool').on('click.tool', '[lay-event]', function (e) {
            layui.stope(e);
            var $this = $(this);
            layui.event.call(this, MOD_NAME, 'tool(' + components.filter + ')', commonMember.call(this, {
                event: $this.attr('lay-event')
            }));
        });

        // 绑定单选框事件
        form.on('radio(' + components.radioFilter + ')', function (data) {
            var d = that.getData(data.value);
            d.LAY_CHECKED = true;  // 同时更新数据
            layui.event.call(this, MOD_NAME, 'checkbox(' + components.filter + ')', {checked: true, data: d});
        });

        // 绑定复选框事件
        form.on('checkbox(' + components.checkboxFilter + ')', function (data) {
            var checked = data.elem.checked;
            var d = that.getData(data.value);
            d.LAY_CHECKED = checked;  // 同时更新数据
            that.checkChooseAllCB();  // 联动全选按钮
            layui.event.call(this, MOD_NAME, 'checkbox(' + components.filter + ')', {checked: checked, data: d});
        });

        // 绑定全选框事件
        form.on('checkbox(' + components.checkAllFilter + ')', function (data) {
            var checked = data.elem.checked;
            var $cb = $(data.elem);
            var $layCb = $cb.next('.layui-form-checkbox');
            // 如果数据为空不能选中
            if (!that.options.data || that.options.data.length <= 0) {
                $cb.prop('checked', false);
                $layCb.removeClass('layui-form-checked');
                return;
            }
            // 联动操作
            components.$elem.find('input[name="' + components.checkboxFilter + '"]').each(function () {
                var $this = $(this);
                $this.prop('checked', checked);
                var $temp = $this.next('.layui-form-checkbox');
                if (checked) $temp.addClass('layui-form-checked');
                else $temp.removeClass('layui-form-checked');
            });
            // 同步数据
            for (var i = 0; i < that.options.data.length; i++) that.options.data[i].LAY_CHECKED = checked;
            layui.event.call(this, MOD_NAME, 'checkbox(' + components.filter + ')', {checked: checked, type: 'all'});
        });

    };

    /** 获取各个组件 */
    DataGrid.prototype.getComponents = function () {
        var that = this;
        var $elem = $(that.options.elem);
        var filter = $elem.attr('lay-filter');
        if (!filter) {
            filter = that.options.elem.substring(1);
            $elem.attr('lay-filter', filter);
        }
        return {
            $elem: $elem,  // 容器
            templetHtml: $(that.options.templet).html(),  // 模板内容
            $page: that.options.page && that.options.page.elem ? $('#' + that.options.page.elem) : undefined,  // 分页组件
            $loadMore: that.options.loadMore && that.options.loadMore.elem ? $('#' + that.options.loadMore.elem) : undefined,  // 加载更多组件
            filter: filter,  // 容器的lay-filter
            checkboxFilter: 'ew_tb_checkbox_' + filter,  // 复选框的lay-filter
            radioFilter: 'ew_tb_radio_' + filter,  // 单选框的lay-filter
            checkAllFilter: 'ew_tb_checkbox_all_' + filter,  // 全选框的lay-filter
            $checkAll: $(that.options.checkAllElem)  // 全选框组件
        };
    };

    /**
     * 渲染主体部分
     * @param data 数据
     * @param number 起始索引
     * @param append 是否是追加模式
     * @param ncd 是否不改变options的data
     */
    DataGrid.prototype.renderBody = function (data, number, append, ncd) {
        if (!data) data = [];
        var options = this.options;
        var components = this.getComponents();
        if (!number) number = 0;
        var html = [];
        for (var i = 0; i < data.length; i++) {
            var d = data[i];
            d.LAY_INDEX = i;
            d.LAY_NUMBER = i + number + 1;
            d.LAY_CHECKBOX_ELEM = [
                '<input type="checkbox" lay-skin="primary"',
                ' name="', components.checkboxFilter, '"',
                ' lay-filter="', components.checkboxFilter, '"',
                d.LAY_CHECKED ? ' checked="checked"' : '',
                ' class="ew-datagrid-checkbox"',
                ' value="' + i + '" />'
            ].join('');
            d.LAY_RADIO_ELEM = [
                '<input type="radio"',
                ' name="', components.radioFilter, '"',
                ' lay-filter="', components.radioFilter, '"',
                d.LAY_CHECKED ? ' checked="checked"' : '',
                ' class="ew-datagrid-radio"',
                ' value="', i, '" />'
            ].join('');
            if (components.templetHtml === undefined) return console.error('DataGrid Error: Template [' + options.templet + '] not found');
            laytpl(components.templetHtml).render(d, function (r) {
                html.push(r);
            });
        }
        if (append) {
            if (!ncd) options.data = options.data.concat(data);
            components.$elem.append(html.join(''));
        } else {
            if (!ncd) options.data = data;
            components.$elem.html(html.join(''));
        }
        this.initChildren(number);
        form.render('checkbox', components.filter);
        form.render('radio', components.filter);
        this.checkChooseAllCB();  // 联动全选按钮
    };

    /** 为所有item设置一些初始属性 */
    DataGrid.prototype.initChildren = function (number) {
        if (!number || !(this.options.page && this.options.page.data)) number = 0;
        this.getComponents().$elem.children().each(function (index) {
            var $this = $(this);
            $this.attr('data-index', index);
            $this.attr('data-number', index + number + 1);
            $this.addClass(itemClass);
        });
    };

    /** 渲染分页组件 */
    DataGrid.prototype.renderPage = function () {
        var options = this.options;
        var components = this.getComponents();
        components.$elem.next('.ew-datagrid-page,.ew-datagrid-loadmore').remove();
        options.page.elem = 'ew-datagrid-page-' + options.elem.substring(1);  // 生成id
        components.$elem.after('<div class="ew-datagrid-page ' + (options.page['class'] || '') + '" id="' + options.page.elem + '"></div>');
        laypage.render(options.page);
    };

    /** 渲染加载更多组件 */
    DataGrid.prototype.renderLoadMore = function () {
        var options = this.options;
        var components = this.getComponents();
        components.$elem.next('.ew-datagrid-page,.ew-datagrid-loadmore').remove();
        options.loadMore.elem = 'ew-datagrid-page-' + options.elem.substring(1);  // 生成id
        components.$elem.after([
            '<div id="', options.loadMore.elem, '" ', 'class="ew-datagrid-loadmore ', options.loadMore['class'] || '', '">',
            '   <div>',
            '      <span class="ew-icon-loading">',
            '         <i class="layui-icon layui-icon-loading-1 layui-anim layui-anim-rotate layui-anim-loop"></i>',
            '      </span>',
            '      <span class="ew-loadmore-text">', options.loadMore.text, '</span>',
            '   </div>',
            '</div>'].join(''));
        return components.$elem.next();
    };

    /**
     * 更改loadMore状态
     * @param state 0正常、1加载中、2没有更多数据、3加载失败
     */
    DataGrid.prototype.changeLoadMore = function (state) {
        var options = this.options;
        var components = this.getComponents();
        var $loadMoreText = components.$loadMore.find('.ew-loadmore-text');
        components.$loadMore.removeClass(loadMoreLoadingClass + ' ' + loadMoreEndClass);
        if (state === 0) {
            $loadMoreText.html(options.loadMore.text);
        } else if (state === 1) {
            $loadMoreText.html(options.loadMore.loadingText);
            components.$loadMore.addClass(loadMoreLoadingClass);
        } else if (state === 2) {
            $loadMoreText.html(options.loadMore.noMoreText);
            components.$loadMore.addClass(loadMoreEndClass);
        } else {
            $loadMoreText.html(options.loadMore.errorText);
        }
    };

    /**
     * 修改item
     * @param index 索引
     * @param fields 修改的字段和值
     * @param type 0整个item更新,1只更新item子元素,2只更新数据不更新item
     */
    DataGrid.prototype.update = function (index, fields, type) {
        var that = this;
        var components = this.getComponents();
        var $item = components.$elem.children('[data-index="' + index + '"]');
        var number = $item.data('number');
        if (number - index !== 1) $.extend(true, this.options.data[number - 1], fields);
        else $.extend(true, this.options.data[index], fields);
        if (2 === type) return;
        laytpl(components.templetHtml).render(that.getData(index), function (html) {
            if (type === 1) return $item.html($(html).html());
            $item.before(html).remove();
            that.initChildren(number - index - 1);
        });
    };

    /** 删除item */
    DataGrid.prototype.del = function (index) {
        var components = this.getComponents();
        var $item = components.$elem.children('[data-index="' + index + '"]');
        var number = $item.data('number');
        $item.remove();
        if (number - index !== 1) this.options.data.splice(number - 1, 1);
        else this.options.data.splice(index, 1);
        this.initChildren(number - index - 1);
    };

    /** 获取数据 */
    DataGrid.prototype.getData = function (index) {
        if (index === undefined) return this.options.data;
        var components = this.getComponents();
        var $item = components.$elem.children('[data-index="' + index + '"]');
        var number = $item.data('number');
        if (number - index !== 1) return this.options.data[number - 1];
        return this.options.data[index];
    };

    /** 获取选中行 */
    DataGrid.prototype.checkStatus = function () {
        var that = this;
        var components = this.getComponents();
        var checkboxFilter = components.checkboxFilter;
        var radioFilter = components.radioFilter;
        var list = [];
        // 获取单选框选中数据
        var $radio = components.$elem.find('input[name="' + radioFilter + '"]');
        if ($radio.length > 0) {
            var index = $radio.filter(':checked').val();
            if (index !== undefined) {
                var d = that.getData(index);
                if (d) list.push(d);
            }
        } else {  // 获取复选框数据
            components.$elem.find('input[name="' + checkboxFilter + '"]:checked').each(function () {
                var index = $(this).val();
                if (index !== undefined) {
                    var d = that.getData(index);
                    if (d) list.push(d);
                }
            });
        }
        return list;
    };

    /** 检查全选框状态 */
    DataGrid.prototype.checkChooseAllCB = function () {
        var components = this.getComponents();
        var $cbAll = components.$checkAll.find('input[lay-filter="' + components.checkAllFilter + '"]');
        var isCheckAll = this.options.data.length !== 0;
        for (var i = 0; i < this.options.data.length; i++) {
            if (!this.options.data[i].LAY_CHECKED) {
                isCheckAll = false;
                break;
            }
        }
        if (isCheckAll) {
            $cbAll.prop('checked', true);
            $cbAll.next('.layui-form-checkbox').addClass('layui-form-checked');
        } else {
            $cbAll.prop('checked', false);
            $cbAll.next('.layui-form-checkbox').removeClass('layui-form-checked');
        }
    };

    /** 重载(不会抖动) */
    DataGrid.prototype.reload = function (opt) {
        if (opt) {
            if (opt.page) {
                if (this.options.page) opt.page = $.extend({}, this.options.page, opt.page);
                else opt.page = $.extend({}, defaultPage, opt.page);
                if (this.options.loadMore) this.options.loadMore = undefined;
            } else if (opt.loadMore) {
                if (this.options.loadMore) opt.loadMore = $.extend({}, this.options.loadMore,
                    opt.loadMore, {first: true, curr: 1});
                else opt.loadMore = $.extend({}, defaultMore, opt.loadMore);
                if (this.options.page) this.options.page = undefined;
            }
            $.extend(true, this.options, opt);
        }
        this.init();
    };

    /** 解析lay-data数据 */
    function parseAttrData(data) {
        if (!data) return;
        try {
            return new Function('return ' + data)();
        } catch (e) {
            console.error('element property data- configuration item has a syntax error: ' + data);
        }
    }

    /** 外部方法 */
    var dg = {
        /* 渲染 */
        render: function (options) {
            // 绑定事件兼容旧版本
            if (options.onItemClick) dg.onItemClick(options.elem, options.onItemClick);
            if (options.onToolBarClick) dg.onToolBarClick(options.elem, options.onToolBarClick);
            return new DataGrid(options);
        },
        /* 事件监听 */
        on: function (events, callback) {
            return layui.onevent.call(this, MOD_NAME, events, callback);
        },
        /* 兼容旧版本 */
        onItemClick: function (id, callback) {
            if (id.indexOf('#') === 0) id = id.substring(1);
            return dg.on('item(' + id + ')', callback);
        },
        onToolBarClick: function (id, callback) {
            if (id.indexOf('#') === 0) id = id.substring(1);
            return dg.on('tool(' + id + ')', callback);
        }
    };

    /** 自动渲染 */
    dg.autoRender = function (elem) {
        $(elem || '[data-grid]').each(function () {
            try {
                // 获取或补充容器id
                var $this = $(this);
                var elem = $this.attr('id');
                if (!elem) {
                    elem = 'ew-datagrid-' + ($('[id^="ew-datagrid-"]').length + 1);
                    $this.attr('id', elem);
                }
                // 初始化模板
                var $tpl = $this.children('[data-grid-tpl]');
                if ($tpl.length > 0) {
                    $tpl.attr('id', elem + '-tpl');
                    $this.after($tpl);
                    // 获取参数
                    var options = parseAttrData($this.attr('lay-data'));
                    options.elem = '#' + elem;
                    options.templet = '#' + elem + '-tpl';
                    dg.render(options);
                }
            } catch (e) {
                console.error(e);
            }
        });
    };
    dg.autoRender();

    /** css样式 */
    $('head').append([
        '<style id="ew-css-datagrid">',
        '.ew-datagrid-loadmore, .ew-datagrid-page {',
        '    text-align: center;',
        '}',
        '.ew-datagrid-loadmore {',
        '    color: #666;',
        '    cursor: pointer;',
        '}',
        '.ew-datagrid-loadmore > div {',
        '    padding: 12px;',
        '}',
        '.ew-datagrid-loadmore > div:hover {',
        '    background-color: rgba(0, 0, 0, .03);',
        '}',
        '.ew-datagrid-loadmore .ew-icon-loading {',
        '    margin-right: 6px;',
        '    display: none;',
        '}',
        '.ew-datagrid-loadmore.', loadMoreEndClass, ' {',
        '    pointer-events: none;',
        '}',
        '.ew-datagrid-loadmore.', loadMoreLoadingClass, ' .ew-icon-loading {',
        '    display: inline;',
        '}',
        '.', loadingClass, ':before {',
        '    content: "\\e63d";',
        '    font-family: layui-icon !important;',
        '    font-size: 32px;',
        '    color: #C3C3C3;',
        '    position: absolute;',
        '    left: 50%;',
        '    top: 50%;',
        '    margin-left: -16px;',
        '    margin-top: -16px;',
        '    z-index: 999;',
        '    -webkit-animatione: layui-rotate 1s linear;',
        '    animation: layui-rotate 1s linear;',
        '    -webkit-animation-iteration-count: infinite;',
        '    animation-iteration-count: infinite;',
        '}',
        '.ew-datagrid-checkbox + .layui-form-checkbox {',
        '   padding-left: 18px;',
        '}',
        '.ew-datagrid-radio + .layui-form-radio {',
        '   margin: 0;',
        '   padding: 0;',
        '   line-height: 22px;',
        '}',
        '.ew-datagrid-radio + .layui-form-radio .layui-icon {',
        '   margin-right: 0;',
        '}',
        '</style>'].join('')
    );

    exports('dataGrid', dg);
});