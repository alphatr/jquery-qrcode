/* global QRDecode */
"use strict";
(function ($, window, document, undefined) {
    var Decode = function (dom) {
        var self = this,
            imageData;
        self.text = '';
        $.extend(self, {
            _init: function (imageData) {
                var qr = new QRDecode(),
                    text = qr.decodeImageData(imageData, self.width, self.height);
                return text;
            },

            getImageData: function (dom) {
                var ctx;
                if (dom.nodeName.toLowerCase() !== 'canvas') {
                    if ($(dom).find('canvas').length) {
                        dom = $(dom).find('canvas')[0];
                    } else {
                        return false;
                    }
                }
                ctx = dom.getContext("2d");
                self.width = dom.width;
                self.height = dom.height;
                return ctx.getImageData(0, 0, dom.width, dom.height);
            }
        });

        // 初始化
        imageData = self.getImageData(dom);
        if (imageData) {
            self.text = self._init(imageData);
        }
    };


    $.fn.qrdecode = function () {
        var $self = $(this),
            length = $self.length,
            text = '';

        if (length) {
            text = (new Decode($self[0])).text;
        }

        return text;
    };
})(jQuery, window, document);