/** 下拉菜单模块 date:2020-05-04   License By http://easyweb.vip */
layui.define(['jquery'], function (exports) {
    var $ = layui.jquery;
    var openClass = 'dropdown-open';
    var disableClass = 'dropdown-disabled';
    var noScrollClass = 'dropdown-no-scroll';
    var shadeClass = 'dropdown-menu-shade';
    var dropdownClass = 'dropdown-menu';
    var dropNavClass = 'dropdown-menu-nav';
    var hoverClass = 'dropdown-hover';
    var fixedClass = 'fixed';
    var noShadeClass = 'no-shade';
    var animClass = 'layui-anim layui-anim-upbit';
    var popAnimClass = 'layui-anim layui-anim-fadein';
    var dropDirect = ['bottom-left', 'bottom-right', 'bottom-center', 'top-left', 'top-right', 'top-center', 'left-top', 'left-bottom', 'left-center', 'right-top', 'right-bottom', 'right-center'];
    if ($('#ew-css-dropdown').length <= 0) {
        layui.link(layui.cache.base + 'dropdown/dropdown.css');
    }

    var dropdown = {
        // 绑定事件
        init: function () {
            // 点击触发
            $(document).off('click.dropdown').on('click.dropdown', '.' + dropdownClass + '>*:first-child', function (event) {
                var $drop = $(this).parent();
                if (!$drop.hasClass(hoverClass)) {
                    if ($drop.hasClass(openClass)) {
                        $drop.removeClass(openClass);
                    } else {
                        dropdown.hideAll();
                        dropdown.show($(this).parent().find('.' + dropNavClass));
                    }
                }
                event.stopPropagation();
            });
            // 点击任何位置关闭所有
            $(document).off('click.dropHide').on('click.dropHide', function (event) {
                dropdown.hideAll();
            });
            // 点击下拉菜单内容部分不关闭
            $(document).off('click.dropNav').on('click.dropNav', '.' + dropNavClass, function (event) {
                event.stopPropagation();
            });
            // hover触发
            var timer, lastDrop, hoverSelector = '.' + dropdownClass + '.' + hoverClass;
            $(document).off('mouseenter.dropdown').on('mouseenter.dropdown', hoverSelector, function (event) {
                if (lastDrop && lastDrop == event.currentTarget) {
                    clearTimeout(timer);
                }
                dropdown.show($(this).find('.' + dropNavClass));
            });
            $(document).off('mouseleave.dropdown').on('mouseleave.dropdown', hoverSelector, function (event) {
                lastDrop = event.currentTarget;
                timer = setTimeout(function () {
                    $(event.currentTarget).removeClass(openClass);
                }, 300);
            });
            // 分离式绑定
            $(document).off('click.dropStand').on('click.dropStand', '[data-dropdown]', function (event) {
                dropdown.showFixed($(this));
                event.stopPropagation();
            });
            // 无限级子菜单
            var hoverNavSelector = '.' + dropNavClass + ' li';
            $(document).off('mouseenter.dropdownNav').on('mouseenter.dropdownNav', hoverNavSelector, function (event) {
                $(this).children('.dropdown-menu-nav-child').addClass(animClass);
                $(this).addClass('active');
            });
            $(document).off('mouseleave.dropdownNav').on('mouseleave.dropdownNav', hoverNavSelector, function (event) {
                $(this).removeClass('active');
                $(this).find('li.active').removeClass('active');
            });
            // 气泡确认弹窗
            $(document).off('click.popconfirm').on('click.popconfirm', '.dropdown-menu-nav [btn-cancel]', function (event) {
                dropdown.hideAll();
                event.stopPropagation();
            });
        },
        // 点击菜单关闭
        openClickNavClose: function () {
            $(document).off('click.dropNavA').on('click.dropNavA', '.' + dropNavClass + '>li>a', function (event) {
                dropdown.hideAll();
                $(this).parentsUntil('.' + dropdownClass).last().parent().removeClass(openClass);
                event.stopPropagation();
            });
        },
        // 关闭所有
        hideAll: function () {
            $('.' + dropdownClass).removeClass(openClass);
            // 隐藏分离式菜单
            $('.' + dropNavClass + '.' + fixedClass).addClass('layui-hide');  // 隐藏分离式菜单
            $('.' + shadeClass).remove();  // 移除遮罩层
            $('body').removeClass(noScrollClass);  // 移除禁止页面滚动
            $('.dropdown-fix-parent').removeClass('dropdown-fix-parent');
            $('[data-dropdown]').removeClass(openClass);
        },
        // 展开非分离式下拉菜单
        show: function ($dropNav) {
            if ($dropNav && $dropNav.length > 0 && !$dropNav.hasClass(disableClass)) {
                if ($dropNav.hasClass('dropdown-popconfirm')) {
                    $dropNav.removeClass(animClass);
                    $dropNav.addClass(popAnimClass);
                } else {
                    $dropNav.removeClass(popAnimClass);
                    $dropNav.addClass(animClass);
                }
                var position;  // 获取位置
                for (var i = 0; i < dropDirect.length; i++) {
                    if ($dropNav.hasClass('dropdown-' + dropDirect[i])) {
                        position = dropDirect[i];
                        break;
                    }
                }
                if (!position) {  // 没有设置位置添加默认位置
                    $dropNav.addClass('dropdown-' + dropDirect[0]);
                    position = dropDirect[0];
                }
                dropdown.forCenter($dropNav, position);
                $dropNav.parent('.' + dropdownClass).addClass(openClass);
                return position;
            }
            return false;
        },
        // 展开分离式菜单
        showFixed: function ($trigger) {
            var $dropNav = $($trigger.data('dropdown')), position;
            if (!$dropNav.hasClass('layui-hide')) {
                dropdown.hideAll();  // 已经展开则隐藏
                return;
            }
            dropdown.hideAll();  // 已经展开则隐藏
            position = dropdown.show($dropNav);  // 获取弹出位置
            if (position) {
                $dropNav.addClass(fixedClass);  // 设置为固定定位
                $dropNav.removeClass('layui-hide');  // 显示下拉菜单
                var topLeft = dropdown.getTopLeft($trigger, $dropNav, position);  // 计算坐标
                topLeft = dropdown.checkPosition($dropNav, $trigger, position, topLeft); // 是否溢出屏幕
                $dropNav.css(topLeft);  // 设置坐标
                $('body').addClass(noScrollClass); // 禁止页面滚动
                var hideShade = ($trigger.attr('no-shade') == 'true');  // 是否隐藏遮罩层
                $('body').append('<div class="' + (hideShade ? (shadeClass + ' ' + noShadeClass) : shadeClass) + ' layui-anim layui-anim-fadein"></div>');  // 添加遮罩层
                // 重置父元素z-index
                $trigger.parentsUntil('body').each(function () {
                    var zIndex = $(this).css('z-index');
                    if (/[0-9]+/.test(zIndex)) {
                        $(this).addClass('dropdown-fix-parent');
                    }
                });
                $trigger.addClass(openClass);
            }
        },
        // 解决绝对定位因动画导致平移失效
        forCenter: function ($dropNav, position) {
            if (!$dropNav.hasClass(fixedClass)) {
                var wTrigger = $dropNav.parent().outerWidth(), hTrigger = $dropNav.parent().outerHeight();
                var wDrop = $dropNav.outerWidth(), hDrop = $dropNav.outerHeight();
                var pParts = position.split('-'), dropSide = pParts[0], dropPosition = pParts[1];  // 显示方向
                if ((dropSide == 'top' || dropSide == 'bottom') && dropPosition == 'center') {
                    $dropNav.css('left', (wTrigger - wDrop) / 2);
                }
                if ((dropSide == 'left' || dropSide == 'right') && dropPosition == 'center') {
                    $dropNav.css('top', (hTrigger - hDrop) / 2);
                }
            }
        },
        // 计算固定定位坐标
        getTopLeft: function ($trigger, $dropdown, position) {
            var widthTrigger = $trigger.outerWidth();
            var heightTrigger = $trigger.outerHeight();
            var widthDropdown = $dropdown.outerWidth();
            var heightDropdown = $dropdown.outerHeight();
            var topTrigger = $trigger.offset().top - $(document).scrollTop();
            var leftTrigger = $trigger.offset().left;
            var rightTrigger = leftTrigger + widthTrigger;
            var top = 0, left = 0;
            var positionParts = position.split('-');
            var anchorSide = positionParts[0];  // 箭头位置
            var anchorPosition = positionParts[1];  // 箭头方向
            if (anchorSide == 'top' || anchorSide == 'bottom') {
                heightDropdown += 8; // 加上margin距离
                switch (anchorPosition) {
                    case 'left':
                        left = leftTrigger;
                        break;
                    case 'center':
                        left = leftTrigger - widthDropdown / 2 + widthTrigger / 2;
                        break;
                    case 'right':
                        left = rightTrigger - widthDropdown;
                }
            }
            if (anchorSide == 'left' || anchorSide == 'right') {
                widthDropdown += 8;  // 加上margin距离
                switch (anchorPosition) {
                    case 'top':
                        top = topTrigger + heightTrigger - heightDropdown;
                        break;
                    case 'center':
                        top = topTrigger - heightDropdown / 2 + heightTrigger / 2;
                        break;
                    case 'bottom':
                        top = topTrigger;
                }
            }
            switch (anchorSide) {
                case 'top':
                    top = topTrigger - heightDropdown;
                    break;
                case 'right':
                    left = leftTrigger + widthTrigger;
                    break;
                case 'bottom':
                    top = topTrigger + heightTrigger;
                    break;
                case 'left':
                    left = leftTrigger - widthDropdown;
            }
            return {top: top, left: left, right: 'auto', bottom: 'auto'};
        },
        // 检查是否溢出屏幕
        checkPosition: function ($dropNav, $trigger, position, topLeft) {
            var aps = position.split('-');
            if ('bottom' == aps[0]) {
                if ((topLeft.top + $dropNav.outerHeight()) > dropdown.getPageHeight()) {
                    topLeft = dropdown.getTopLeft($trigger, $dropNav, 'top-' + aps[1]);
                    $dropNav.removeClass('dropdown-' + position);
                    $dropNav.addClass('dropdown-top-' + aps[1]);
                }
            } else if ('top' == aps[0]) {
                if (topLeft.top < 0) {
                    topLeft = dropdown.getTopLeft($trigger, $dropNav, 'bottom-' + aps[1]);
                    $dropNav.removeClass('dropdown-' + position);
                    $dropNav.addClass('dropdown-bottom-' + aps[1]);
                }
            }
            return topLeft;
        },
        // 获取浏览器高度
        getPageHeight: function () {
            return document.documentElement.clientHeight || document.body.clientHeight;
        },
        // 获取浏览器宽度
        getPageWidth: function () {
            return document.documentElement.clientWidth || document.body.clientWidth;
        }
    };

    dropdown.init();
    exports('dropdown', dropdown);
});
