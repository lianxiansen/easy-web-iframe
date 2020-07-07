/** 文件选择扩展模块 date:2019-08-03   License By http://easyweb.vip */
layui.define(['jquery', 'layer', 'form', 'upload', 'util'], function (exports) {
    var $ = layui.jquery;
    var layer = layui.layer;
    var form = layui.form;
    var upload = layui.upload;
    var util = layui.util;

    /** 文件后缀对应图标 */
    var fileIcons = [{
        suffix: ['ppt', 'pptx'],
        icon: 'ppt'
    }, {
        suffix: ['doc', 'docx'],
        icon: 'doc'
    }, {
        suffix: ['xls', 'xlsx'],
        icon: 'xls'
    }, {
        suffix: ['pdf'],
        icon: 'pdf'
    }, {
        suffix: ['html', 'htm'],
        icon: 'htm'
    }, {
        suffix: ['txt'],
        icon: 'txt'
    }, {
        suffix: ['swf', 'docx'],
        icon: 'flash'
    }, {
        suffix: ['zip', 'rar', '7z'],
        icon: 'zip'
    }, {
        suffix: ['mp3', 'wav'],
        icon: 'mp3'
    }, {
        suffix: ['mp4', '3gp', 'rmvb', 'avi', 'flv'],
        icon: 'mp4'
    }, {
        suffix: ['psd'],
        icon: 'psd'
    }, {
        suffix: ['ttf'],
        icon: 'ttf'
    }, {
        suffix: ['apk'],
        icon: 'apk'
    }, {
        suffix: ['exe'],
        icon: 'exe'
    }, {
        suffix: ['torrent'],
        icon: 'bt'
    }, {
        suffix: ['gif', 'png', 'jpeg', 'jpg', 'bmp'],
        icon: 'img'
    }];

    var fileChoose = {};

    /** 打开选择文件弹窗 */
    fileChoose.open = function (param) {
        var fileUrl = param.fileUrl;  // 文件查看url
        var listUrl = param.listUrl;  // 文件列表url
        var where = param.where;  // 文件列表请求参数
        var chooseNum = param.num;  // 文件选择的数量
        var onChoose = param.onChoose;  // 选择回调
        var uploadOption = param.upload;  // 文件上传配置
        var dialogOption = param.dialog;  // 弹窗配置
        var operMenu = param.menu;  // 操作菜单
        var operMenuClick = param.menuClick;  // 操作菜单事件处理
        var response = param.response ? param.response : {};  // 返回数据格式
        var dirName = response.dir;  // 文件列表请求参数文件夹名称
        var okCode = response.code;  // 成功码
        var urlName = response.url;  // url名称
        var smUrlName = response.smUrl;  // 缩略图名称
        var isDirName = response.isDir;  // 是否是文件夹名称
        var titleName = response.name;  // 文件名称字段名
        var method = response.method;  // 文件名称字段名
        var parseData = response.parseData;  // 数据格式化
        var dataList = [];  // 当前文件列表

        // 设置默认参数
        where || (where = {});
        (chooseNum != undefined) || (chooseNum = 1);
        uploadOption || (uploadOption = {});
        dialogOption || (dialogOption = {});
        dirName || (dirName = 'dir');
        (okCode != undefined) || (okCode = 200);
        urlName || (urlName = 'url');
        smUrlName || (smUrlName = 'smUrl');
        isDirName || (isDirName = 'isDir');
        titleName || (titleName = 'name');
        method || (method = 'get');

        // 显示弹窗
        dialogOption.id = 'file-choose-dialog';
        dialogOption.type = 1;
        (dialogOption.title != undefined) || (dialogOption.title = '选择文件');
        dialogOption.content = '';
        dialogOption.area || (dialogOption.area = ['565px', '420px']);
        (dialogOption.shade != undefined) || (dialogOption.shade = .1);
        dialogOption.fixed || (dialogOption.fixed = false);
        dialogOption.skin || (dialogOption.skin = 'layer-file-choose');
        var sCallBack = param.success;
        dialogOption.success = function (layero, dIndex) {
            $(layero).children('.layui-layer-content').load(layui.cache.base + 'fileChoose/fileChoose.html', function () {
                init();  // 渲染页面
                sCallBack && sCallBack(layero, index);
            });
        };
        layer.open(dialogOption);

        // 获取文件列表
        function loadList(dir) {
            dir || (dir = $('#fc-current-position').text());
            $('.file-choose-dialog .file-choose-loading-group').removeClass('layui-hide');
            where[dirName] = dir;
            $('#file-choose-list').html('');
            $.ajax({
                url: listUrl,
                type: method,
                data: where,
                dataType: 'json',
                success: function (res) {
                    parseData && (res = parseData(res));
                    if (res.code == okCode) {
                        dataList = res.data;
                        $('#fc-btn-ok-sel').text('完成选择');
                        $('#file-choose-list').html(fileChoose.renderList({
                            fileUrl: fileUrl,
                            data: dataList,
                            multi: chooseNum > 1,
                            menu: operMenu,
                            response: response
                        }));
                        form.render('checkbox');
                    } else {
                        layer.msg(res.msg, {icon: 2, anim: 6});
                        $('#file-choose-list').html(fileChoose.getErrorHtml('加载失败', 'layui-icon-face-cry'));
                    }
                    setTimeout(function () {
                        $('.file-choose-dialog .file-choose-loading-group').addClass('layui-hide');
                    }, 200);
                }
            });

        }

        // 事件处理
        function init() {
            (chooseNum > 1) || ($('.file-choose-dialog').addClass('hide-bottom'));
            loadList();

            // 刷新
            $('#fc-btn-refresh').click(function () {
                loadList();
            });

            // 返回上级
            $('#fc-btn-back').click(function () {
                var cDir = $('#fc-current-position').text();
                if (cDir != '/') {
                    cDir = cDir.substring(0, cDir.lastIndexOf('/'));
                    cDir || (cDir = '/');
                    $('#fc-current-position').text(cDir);
                    loadList(cDir);
                }
            });

            // 上传文件事件
            uploadOption.elem = '#fc-btn-upload';
            uploadOption.data || (uploadOption.data = {});
            uploadOption.data.dir = function () {
                return $('#fc-current-position').text();
            };
            uploadOption.before = function () {
                layer.load(2);
            };
            uploadOption.done = function (res, index, upload) {
                layer.closeAll('loading');
                if (res.code != okCode) {
                    layer.msg(res.msg, {icon: 2});
                } else {
                    layer.msg(res.msg, {icon: 1});
                    var dir = res.dir ? res.dir : util.toDateString(new Date(), '/yyyy/MM/dd');
                    $('#fc-current-position').text(dir);
                    loadList();
                }
            };
            uploadOption.error = function () {
                layer.closeAll('loading');
                layer.msg('上传失败', {icon: 2});
            };
            upload.render(uploadOption);

            // 完成选择按钮
            $('#fc-btn-ok-sel').click(function () {
                var urls = [];
                $('input[lay-filter="file-choose-item-ck"]:checked').each(function () {
                    var dataIndex = $(this).parents('.file-choose-list-item').data('index');
                    urls.push(dataList[dataIndex]);
                });
                if (urls.length <= 0) {
                    layer.msg('请选择', {icon: 2, anim: 6});
                } else if (urls.length > chooseNum) {
                    layer.msg('最多只能选择' + chooseNum + '个', {icon: 2, anim: 6});
                } else {
                    okChoose(urls);
                }
            });

            // 列表点击事件
            $(document).off('click.fcli').on('click.fcli', '.file-choose-dialog .file-choose-list-item', function (e) {
                var item = dataList[$(this).data('index')];
                if (item[isDirName]) {  // 是否是文件夹
                    var cDir = $('#fc-current-position').text();
                    cDir += (cDir == '/' ? item[titleName] : ('/' + item[titleName]));
                    $('#fc-current-position').text(cDir);
                    loadList(cDir);
                } else {
                    var $cMenu = $(this).find('.file-choose-oper-menu');
                    $('.file-choose-dialog .file-choose-oper-menu').not($cMenu).removeClass('show');
                    $cMenu.toggleClass('show');
                    e.stopPropagation();
                }
            });
            // 点击空白隐藏下拉框
            $(document).off('click.fclom').on('click.fclom', '.file-choose-dialog', function (e) {
                $('.file-choose-dialog .file-choose-oper-menu').removeClass('show');
                e.stopPropagation();
            });

            // 监听复选框选中
            form.on('checkbox(file-choose-item-ck)', function (data) {
                var ckSize = $('.file-choose-dialog input[lay-filter="file-choose-item-ck"]:checked').length;
                if (data.elem.checked) {
                    if (ckSize > chooseNum) {
                        layer.msg('最多只能选择' + chooseNum + '个', {icon: 2, anim: 6});
                        $(data.elem).prop('checked', false);
                        form.render('checkbox');
                        return;
                    }
                    $(data.elem).parents('.file-choose-list-item').addClass('active');
                } else {
                    $(data.elem).parents('.file-choose-list-item').removeClass('active');
                }
                $('#fc-btn-ok-sel').text('完成选择' + (ckSize > 0 ? ('(' + ckSize + ')') : ''));
            });
            // 点击多选框阻止列表事件
            $(document).off('click.fclic').on('click.fclic', '.file-choose-dialog .file-choose-list-item-ck', function (e) {
                e.stopPropagation();
            });

            // 菜单事件监听
            $(document).off('click.fclomi').on('click.fclomi', '.file-choose-dialog .file-choose-oper-menu-item', function () {
                var event = $(this).data('event');
                var dataIndex = $(this).parent().parent().data('index');
                if ('choose' == event) {
                    if (chooseNum > 1) {
                        $(this).parent().parent().find('.layui-form-checkbox').trigger('click');
                    } else {
                        okChoose([dataList[dataIndex]]);
                    }
                } else if ('preview' == event) {
                    var url = (fileUrl + dataList[dataIndex][urlName]);
                    if ('img' == fileChoose.getFileType(url)) {
                        var imgUrls = [], start = 0;
                        for (var i = 0; i < dataList.length; i++) {
                            var tUrl = fileUrl + dataList[i][urlName];
                            if ('img' == fileChoose.getFileType(tUrl)) {
                                imgUrls.push({src: tUrl, alt: dataList[i][titleName]});
                            }
                            if (url == tUrl) {
                                start = imgUrls.length - 1;
                            }
                        }
                        layer.photos({photos: {start: start, data: imgUrls}, shade: .1, closeBtn: true});
                    } else {
                        layer.confirm('这不是图片类型，可能需要下载才能预览，确定要打开吗？', {
                            title: '温馨提示',
                            area: '260px',
                            shade: .1
                        }, function (index) {
                            layer.close(index);
                            window.open(url);
                        });

                    }
                } else {
                    operMenuClick && operMenuClick(event, dataList[dataIndex]);
                }
            });

        }

        // 完成选择
        function okChoose(urls) {
            onChoose && onChoose(urls);
            layer.close($('#fc-btn-ok-sel').parents('.layui-layer').attr('id').substring(11));
        }

    };

    // 渲染文件列表
    fileChoose.renderList = function (param) {
        var fileUrl = param.fileUrl;  // 文件服务器地址
        var dataList = param.data;  // 数据
        var multi = param.multi;  // 是否多选
        var operMenu = param.menu;  // 操作菜单
        var response = param.response ? param.response : {};  // 返回数据格式
        var urlName = response.url;  // url名称
        var smUrlName = response.smUrl;  // 缩略图名称
        var isDirName = response.isDir;  // 是否是文件夹名称
        var titleName = response.name;  // 文件名称字段名

        (fileUrl == undefined) && (fileUrl = '');
        (dataList == undefined) && (dataList = []);
        (multi == undefined) && (multi = false);
        urlName || (urlName = 'url');
        smUrlName || (smUrlName = 'smUrl');
        isDirName || (isDirName = 'isDir');
        titleName || (titleName = 'name');

        var html = '';
        if (dataList.length <= 0) {
            html += fileChoose.getErrorHtml('没有文件');
        } else {
            for (var i = 0; i < dataList.length; i++) {
                var item = dataList[i];
                html += '<div class="file-choose-list-item" data-index="' + i + '">';
                var imgUrl = fileUrl + item[smUrlName], fileImgIcon = '';
                if (!item[smUrlName]) {
                    fileImgIcon = ' img-icon';
                    imgUrl = fileChoose.getFileIcon(item[urlName], item[isDirName]);
                }
                var bgStyle = "background-image: url('" + imgUrl + "')";
                html += '   <div class="file-choose-list-item-img' + fileImgIcon + '" style="' + bgStyle + '"></div>';
                html += '   <div class="file-choose-list-item-name" title="' + item[titleName] + '">' + item[titleName] + '</div>';
                if (!item[isDirName] && multi) {
                    html += '   <div class="file-choose-list-item-ck layui-form">';
                    html += '       <input type="checkbox" lay-skin="primary" lay-filter="file-choose-item-ck"/>';
                    html += '   </div>';
                }
                if (!operMenu) {
                    html += '<div class="file-choose-oper-menu">';
                    html += '   <div class="file-choose-oper-menu-item" data-event="preview">预览</div>';
                    html += '   <div class="file-choose-oper-menu-item" data-event="choose">选择</div>';
                    html += '</div>';
                } else if (operMenu.length > 0) {
                    html += '<div class="file-choose-oper-menu">';
                    for (var mi = 0; mi < operMenu.length; mi++) {
                        var menuItem = operMenu[mi];
                        html += '<div class="file-choose-oper-menu-item" data-event="' + menuItem.event + '">' + menuItem.name + '</div>';
                    }
                    html += '</div>';
                }
                html += '</div>';
            }
        }
        return html;
    };

    // 显示空布局或错误布局
    fileChoose.getErrorHtml = function (msg, icon) {
        icon || (icon = 'layui-icon-face-surprised');
        var html = '';
        html += '<div class="file-choose-empty">';
        html += '   <i class="layui-icon ' + icon + '"></i>';
        html += '   <p>' + msg + '</p>';
        html += '</div>';
        return html;
    };

    // 根据文件后缀获取图标
    fileChoose.getFileIcon = function (url, isDir) {
        var type = isDir ? 'dir' : fileChoose.getFileType(url);
        return layui.cache.base + 'fileChoose/img/' + type + '.png';
    };

    // 根据文件后缀获取文件类型
    fileChoose.getFileType = function (url) {
        var type = 'file';
        var suffix = url.substring(url.lastIndexOf('.') + 1);
        for (var i = 0; i < fileIcons.length; i++) {
            for (var j = 0; j < fileIcons[i].suffix.length; j++) {
                if (suffix.toLowerCase() == fileIcons[i].suffix[j]) {
                    type = fileIcons[i].icon;
                    break;
                }
            }
        }
        return type;
    };

    $('body').append('<style>.layer-file-choose { max-width: 100%;}@media screen and (max-width:768px){.layer-file-choose{max-width:98%;max-width:-moz-calc(100% - 30px);max-width:-webkit-calc(100% - 30px);max-width:calc(100% - 30px);left:0!important;right:0!important;margin:auto!important;margin-bottom:15px!important}}</style>');
    exports("fileChoose", fileChoose);
});

