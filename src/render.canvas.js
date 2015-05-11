(function ($, window, document, undefined) {
    "use strict";
    if (!$.qrcode) {
        return;
    }

    $.qrcode.Render.canvas = function (self, callback) {
        var cfg = self.config,

            i = cfg.margin,
            j = cfg.margin,

            mSize = cfg.moduleSize,
            size = self.pixArr.length,
            outSize = 2 * cfg.margin + size,
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),

            getRGB = function (color) {
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
            },

            // 初始化画布
            init = function () {
                var size = cfg.margin * 2 + self.pixArr.length;
                canvas.width = size * mSize;
                canvas.height = size * mSize;
                ctx.fillStyle = getRGB(cfg.bgColor);
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            },

            // 设置色块
            setBlock = function (i, j) {
                ctx.fillStyle = getRGB(cfg.moduleColor);
                ctx.fillRect(i * mSize, j * mSize, mSize, mSize);
            },

            renderLogo = function (callback) {
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
