var gulp = require('gulp-param')(require('gulp'), process.argv);
var uglify = require('gulp-uglifyjs');

var jsList = [
    "src/qrbase.js",
    "src/reedsolomon.js"
];
var outFile = 'jquery';
var gDebug = false;

gulp.task('dep', function(debug, file, render) {
    gDebug = !!debug;
    if (file === 'decode') {
        outFile += '-qrdecode';
        jsList.push("src/decode.js");
        jsList.push("src/qrdecode.js");
    } else if (file === 'encode') {
        outFile += '-qrencode';
        jsList.push("src/encode.js");
        jsList.push("src/qrcode.js");
        if (render === 'table') {
            outFile += '-table';
            jsList.push("src/render.table.js");
        } else if (render === 'canvas') {
            outFile += '-canvas';
            jsList.push("src/render.canvas.js");
        } else {
            jsList.push("src/render.table.js");
            jsList.push("src/render.canvas.js");
        }
    } else {
        outFile += '-qrcode';
        jsList.push("src/decode.js");
        jsList.push("src/qrdecode.js");
        jsList.push("src/encode.js");
        jsList.push("src/qrcode.js");
        if (render === 'table') {
            outFile += '-table';
            jsList.push("src/render.table.js");
        } else if (render === 'canvas') {
            outFile += '-canvas';
            jsList.push("src/render.canvas.js");
        } else {
            jsList.push("src/render.table.js");
            jsList.push("src/render.canvas.js");
        }
    }

    if (!gDebug) {
        outFile += '.min';
    }

    outFile += '.js';
});

gulp.task('build', ['dep'], function() {
    var opts = {};
    if (gDebug) {
        opts = {
            mangle: false,
            output: {
                beautify: true
            }
        };
    }
    return gulp.src(jsList, {base: 'src'})
        .pipe(uglify(outFile, opts))
        .pipe(gulp.dest('dest/'));
});

gulp.task('default', ['build']);
