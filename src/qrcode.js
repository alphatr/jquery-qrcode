/* global QREncode */
"use strict";
(function ($, window, document, undefined) {

    $.qrcode = {
        /**
         * 配置
         */
        config: {
            // 默认文字
            text: 'Test',

            render: 'canvas',

            // 背景色
            bgColor: '#FFF',

            // 前景色
            moduleColor: '#000',

            // 模块大小
            moduleSize: 5,

            // 编码格式
            mode: 4, // 8 字节编码

            // 纠错码等级
            ECLevel: 2, // 30%

            // 留白
            margin: 4,

            // logo;
            logo: '',

            error: function (msg) {
                alert(msg);
            }
        },

        Render: []
    };

    var QRCode = function (cfg, callback) {
        var self = this;

        self.config = cfg;

        $.extend(self, {
            _init: function () {
                self.qr = new QREncode();

                self.qr.setErrorThrow(function (msg) {
                    cfg.error(msg);
                });

                if (cfg.logo) { // 含有 Logo，使用最大容错
                    cfg.ECLevel = 2;
                }
                self.version = self.qr.getVersionFromLength(cfg.ECLevel, cfg.mode, cfg.text);

                self.pixArr = self.qr.encodeToPix(cfg.mode, cfg.text, self.version, cfg.ECLevel);

                $.qrcode.Render[cfg.render](self, callback);
            }
        });

        // 初始化
        return self._init();
    };


    $.fn.qrcode = function (cfg) {
        var $self = $(this),
            length = $self.length,
            i, config = {};

        if (typeof(cfg) === 'string') {
            config.text = cfg;
        } else {
            config = cfg;
        }

        config = $.extend({}, $.qrcode.config, config);

        new QRCode(config, function (qrdom) {
            var el, context;
            for (i = 0; i < length; i++) {
                if (config.render === 'table') {
                    el = qrdom.clone();
                } else {
                    el = qrdom.cloneNode(true);
                    context = el.getContext("2d");
                    context.drawImage(qrdom, 0, 0);
                }

                $self.eq(i).empty().append(el);
            }
        });
    };
})(jQuery, window, document);
