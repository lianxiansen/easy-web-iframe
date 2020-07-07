/** 步骤条模块 date:2020-02-16   License By http://easyweb.vip */
layui.define(['element'], function (exports) {
    var $ = layui.jquery;
    var element = layui.element;
    if ($('#ew-css-steps').length <= 0) {
        layui.link(layui.cache.base + 'steps/steps.css');
    }
    var steps = {};

    /* 下一步 */
    steps.next = function (filter) {
        steps.checkLayId(filter);
        var $steps = $('[lay-filter="' + filter + '"]');
        var $li = $steps.children('.layui-tab-title').children('li');
        var $next = $li.filter('.layui-this').next();
        if ($next.length <= 0) {
            $next = $li.first();
        }
        element.tabChange(filter, $next.attr('lay-id'));
    };

    /* 上一步 */
    steps.prev = function (filter) {
        steps.checkLayId(filter);
        var $steps = $('[lay-filter="' + filter + '"]');
        var $li = $steps.children('.layui-tab-title').children('li');
        var $next = $li.filter('.layui-this').prev();
        if ($next.length <= 0) {
            $next = $li.last();
        }
        element.tabChange(filter, $next.attr('lay-id'));
    };

    /* 跳转到第几步 */
    steps.go = function (filter, index) {
        steps.checkLayId(filter);
        var $steps = $('[lay-filter="' + filter + '"]');
        var $li = $steps.children('.layui-tab-title').children('li');
        element.tabChange(filter, $li.eq(index).attr('lay-id'));
    };

    /* 检查lay-id属性 */
    steps.checkLayId = function (filter) {
        var $steps = $('.layui-steps[lay-filter="' + filter + '"]');
        var $li = $steps.children('.layui-tab-title').children('li');
        if ($li.first().attr('lay-id') === undefined) {
            $li.each(function (index) {
                $(this).attr('lay-id', 'steps-' + index);
            });
        }
        $steps.find('.layui-tab-bar').remove();
        $steps.removeAttr('overflow');
    };

    /* 上一步、下一步按钮 */
    $(document).off('click.steps').on('click.steps', '[data-steps]', function () {
        var $this = $(this);
        var filter = $this.parents('.layui-steps').first().attr('lay-filter');
        var type = $this.data('steps');
        if (type === 'next') {
            steps.next(filter);
        } else if (type === 'prev') {
            steps.prev(filter);
        } else if (type === 'go') {
            steps.go(filter, $this.data('go'));
        }
    });

    exports('steps', steps);
});
