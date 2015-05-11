(function ($, window, document, undefined) {
    "use strict";
    if (!$.qrcode) {
        return;
    }

    $.qrcode.Render.table = function (self, callback) {
        var cfg = self.config,

            mSize = cfg.moduleSize,
            margin = cfg.margin * mSize,
            size = self.pixArr.length,
            outSize = 2 * cfg.margin + size,
            div = $('<div style="position: relative;"></div>'),
            $table, i = 0, j = 0,
            style = '<style>.qrtable, .qrtable tr, .qrtable td{border: 0;border-collapse: collapse;}</style>',

            // 初始化画布
            init = function () {
                var table = '<table class="qrtable">',
                    i = 0,
                    j = 0;
                for (; i < size; i++) {
                    j = 0;
                    table += '<tr>';
                    for (; j < size; j++) {
                        table += '<td></td>';
                    }
                    table += '</td>';
                }
                table += '</table>';

                $table = $(table);
                $table.css({width: size * mSize, height: size * mSize});
            },

            // 设置色块
            setBlock = function (i, j, color) {
                $table.find('tr:nth-child(' + (j + 1) + ')').find('td:nth-child(' + (i + 1) + ')').css('backgroundColor', color);
            },

            renderLogo = function (callback) {
                var img = new Image();
                img.src = cfg.logo;
                img.onload = function () {
                    var imgW = img.width,
                        imgH = img.height,
                        imgSize = Math.max(imgW, imgH),
                        zoom, logo;
                    if (imgSize > size * mSize * 0.3) {
                        zoom = (size * mSize * 0.3) / imgSize;
                        imgW = imgW * zoom;
                        imgH = imgH * zoom;
                    }
                    logo = $('<img src="' + cfg.logo + '" height="' + imgH + '" width="' + imgW + '"/>');
                    logo.css({position: 'absolute', top: (outSize * mSize - imgH) / 2, left: (outSize * mSize - imgW) / 2});
                    if ($.isFunction(callback)) {
                        callback(logo);
                    }
                };
            };

        init();

        for (; i < self.pixArr.length; i++) {
            j = 0;
            for (; j < self.pixArr.length; j++) {
                if (self.pixArr[i][j]) {
                    setBlock(i, j, cfg.moduleColor);
                }
            }
        }

        div.css({width: size * mSize, height: size * mSize, backgroundColor: cfg.bgcolor, padding: margin}).append(style, $table);

        if (cfg.logo) {
            renderLogo(function (logo) {
                div.append(logo);
                if ($.isFunction(callback)) {
                    callback(div);
                }
            });
        } else {
            if ($.isFunction(callback)) {
                callback(div);
            }
        }
    };
})(jQuery, window, document);
