(function ($, window, document, undefined) {
    "use strict";
    if (!$.qrcode) {
        return;
    }

    $.qrcode.Render.canvas = function (self, callback) {
        var cfg = self.config;

        var i = cfg.margin;
        var j = cfg.margin;

        var dpx  = cfg.retina ? 2 : 1;

        var mSize = cfg.moduleSize * dpx;
        var size = self.pixArr.length;
        var outSize = 2 * cfg.margin + size;
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        var getRGB = function (color) {
            var red, green, blue;
            if (color.indexOf('#') === 0) {
                color = color.substr(1);
            }

            if (color.length === 6) {
                red = color.substr(0, 2);
                green = color.substr(2, 2);
                blue = color.substr(4, 2);
            } else if (color.length === 3) {
                red = color.substr(0, 1);
                red += red;
                green = color.substr(1, 1);
                green += green;
                blue = color.substr(2, 1);
                blue += blue;
            } else {
                throw ('error color');
            }

            return 'rgb(' + parseInt(red, 16) + ', ' + parseInt(green, 16) + ', ' + parseInt(blue, 16) + ')';
        };

        // 初始化画布
        var init = function () {
            var size = cfg.margin * 2 + self.pixArr.length;
            canvas.width = size * mSize;
            canvas.height = size * mSize;
            $(canvas).css({
                width: size * cfg.moduleSize,
                height: size * cfg.moduleSize
            });

            ctx.fillStyle = getRGB(cfg.bgColor);
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        // 设置色块
        var setBlock = function (i, j) {
            ctx.fillStyle = getRGB(cfg.moduleColor);
            ctx.fillRect(i * mSize, j * mSize, mSize, mSize);
        };

        var renderLogo = function (callback) {
            var img = new Image();
            img.src = cfg.logo;
            img.onload = function () {
                var imgW = img.width,
                    imgH = img.height,
                    imgSize = Math.max(imgW, imgH),
                    zoom;
                if (imgSize > size * mSize * 0.3) {
                    zoom = (size * mSize * 0.3) / imgSize;
                    imgW = imgW * zoom;
                    imgH = imgH * zoom;
                }
                ctx.drawImage(img, (outSize * mSize - imgW) / 2, (outSize * mSize - imgH) / 2, imgW, imgH);
                if ($.isFunction(callback)) {
                    callback();
                }
            };
        };

        init();

        for (; i < self.pixArr.length + cfg.margin; i++) {
            j = cfg.margin;
            for (; j < self.pixArr.length + cfg.margin; j++) {
                if (self.pixArr[i - cfg.margin][j - cfg.margin]) {
                    setBlock(i, j, getRGB(cfg.moduleColor));
                }
            }
        }

        if (cfg.logo) {
            renderLogo(function () {
                if ($.isFunction(callback)) {
                    callback(canvas);
                }
            });
        } else {
            if ($.isFunction(callback)) {
                callback(canvas);
            }
        }
    };
})(jQuery, window, document);
