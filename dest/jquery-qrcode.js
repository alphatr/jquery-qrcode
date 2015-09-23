"use strict";

function ReedSolomon(n_ec_bytes) {
    this.logger = null, this.n_ec_bytes = n_ec_bytes, this.n_degree_max = 2 * n_ec_bytes, 
    this.syndroms = [], this.gen_poly = null, this.initGaloisTables();
}

function QRDecode() {
    this.image = null, this.imageTop = 0, this.imageBottom = 0, this.imageLeft = 0, 
    this.imageRight = 0, this.nModules = 0, this.moduleSize = 0, this.version = 0, this.functionalGrade = 0, 
    this.ECLevel = 0, this.mask = 0, this.maskPattern = [], this.nBlockEcWords = 0, 
    this.blockIndices = [], this.blockDataLengths = [];
}

function QREncode() {
    this.image = null, this.nModules = 0, this.version = 0, this.functionalGrade = 0, 
    this.ECLevel = 0, this.mask = 0, this.maskPattern = [], this.nDataCodewords = 0, 
    this.nBlockEcWords = 0, this.blockIndices = [], this.blockDataLengths = [];
}

var QRBase = {
    MODE: {
        Numeric: 1,
        AlphaNumeric: 2,
        EightBit: 4,
        Terminator: 0
    },
    ERROR_CORRECTION_LEVEL: {
        L: 1,
        M: 0,
        Q: 3,
        H: 2
    },
    errorThrow: function(error) {
        if (!this._isError) {
            if (!this._errorThrow) throw error;
            this._errorThrow(error), this._isError = !0;
        }
    },
    setBlocks: function(qr) {
        var nBlocks, nBlocksFirst, nBlocksSecond, nBlockWordsFirst, nBlockWordsSecond, i, b, nCodewords = this.nCodewords[qr.version], nECCodewords = this.nECCodewords[qr.version][qr.ECLevel], ECBlocks = this.ECBlocks[qr.version][qr.ECLevel], w = 0;
        for (qr.nDataCodewords = nCodewords - nECCodewords, 1 === ECBlocks.length ? (nBlocksFirst = ECBlocks[0], 
        nBlocksSecond = 0, nBlocks = nBlocksFirst, nBlockWordsFirst = qr.nDataCodewords / nBlocks, 
        nBlockWordsSecond = 0) : (nBlocksFirst = ECBlocks[0], nBlocksSecond = ECBlocks[1], 
        nBlocks = nBlocksFirst + nBlocksSecond, nBlockWordsFirst = Math.floor(qr.nDataCodewords / nBlocks), 
        nBlockWordsSecond = nBlockWordsFirst + 1), qr.nBlockEcWords = nECCodewords / nBlocks, 
        qr.blockDataLengths = [], b = 0; nBlocksFirst > b; b++) qr.blockDataLengths[b] = nBlockWordsFirst;
        for (b = nBlocksFirst; nBlocks > b; b++) qr.blockDataLengths[b] = nBlockWordsSecond;
        for (qr.blockIndices = [], b = 0; nBlocks > b; b++) qr.blockIndices[b] = [];
        for (i = 0; nBlockWordsFirst > i; i++) for (b = 0; nBlocks > b; b++) qr.blockIndices[b].push(w), 
        w++;
        for (b = nBlocksFirst; nBlocks > b; b++) qr.blockIndices[b].push(w), w++;
        for (i = 0; i < qr.nBlockEcWords; i++) for (b = 0; nBlocks > b; b++) qr.blockIndices[b].push(w), 
        w++;
    },
    setFunctionalPattern: function(qr) {
        function markSquare(qr, x, y, w, h) {
            var i, j;
            for (i = x; x + w > i; i++) for (j = y; y + h > j; j++) qr.functionalPattern[i][j] = !0;
        }
        function markAlignment(qr, qrbase) {
            var i, j, n = qrbase.alignmentPatterns[qr.version].length;
            for (i = 0; n > i; i++) for (j = 0; n > j; j++) 0 === i && 0 === j || 0 === i && j === n - 1 || i === n - 1 && 0 === j || markSquare(qr, qrbase.alignmentPatterns[qr.version][i] - 2, qrbase.alignmentPatterns[qr.version][j] - 2, 5, 5);
        }
        qr.functionalPattern = [];
        var x, y;
        for (x = 0; x < qr.nModules; x++) for (qr.functionalPattern[x] = [], y = 0; y < qr.nModules; y++) qr.functionalPattern[x][y] = !1;
        markSquare(qr, 0, 0, 9, 9), markSquare(qr, qr.nModules - 8, 0, 8, 9), markSquare(qr, 0, qr.nModules - 8, 9, 8), 
        markSquare(qr, 8, 6, qr.nModules - 8 - 8, 1), markSquare(qr, 6, 8, 1, qr.nModules - 8 - 8), 
        markAlignment(qr, this), qr.version >= 7 && (markSquare(qr, 0, qr.nModules - 11, 6, 3), 
        markSquare(qr, qr.nModules - 11, 0, 3, 6));
    },
    nCountBits: function(mode, version) {
        return mode === this.MODE.EightBit ? 10 > version ? 8 : 16 : mode === this.MODE.AlphaNumeric ? 10 > version ? 9 : 27 > version ? 11 : 13 : mode === this.MODE.Numeric ? 10 > version ? 10 : 27 > version ? 12 : 14 : void this.errorThrow("Internal error: Unknown mode: " + mode);
    },
    nModulesFromVersion: function(version) {
        return 17 + 4 * version;
    },
    unicodeToUtf8: function(string) {
        var i, c, out = "", len = string.length;
        for (i = 0; len > i; i++) c = string.charCodeAt(i), c >= 1 && 127 >= c ? out += string.charAt(i) : c > 2047 ? (out += String.fromCharCode(224 | c >> 12 & 15), 
        out += String.fromCharCode(128 | c >> 6 & 63), out += String.fromCharCode(128 | c >> 0 & 63)) : (out += String.fromCharCode(192 | c >> 6 & 31), 
        out += String.fromCharCode(128 | c >> 0 & 63));
        return out;
    },
    utf8Tounicode: function(string) {
        for (var mark, char1, char2, char3, out = "", len = string.length, i = 0; len > i; ) char1 = string.charCodeAt(i++), 
        mark = char1 >> 4, 7 >= mark ? out += string.charAt(i - 1) : 12 === mark || 13 === mark ? (char2 = string.charCodeAt(i++), 
        out += String.fromCharCode((31 & char1) << 6 | 63 & char2)) : 14 === mark && (char2 = string.charCodeAt(i++), 
        char3 = string.charCodeAt(i++), out += String.fromCharCode((15 & char1) << 12 | (63 & char2) << 6 | (63 & char3) << 0));
        return out;
    },
    setErrorThrow: function(func) {
        "function" == typeof func && (this._errorThrow = func);
    },
    alignmentPatterns: [ null, [], [ 6, 18 ], [ 6, 22 ], [ 6, 26 ], [ 6, 30 ], [ 6, 34 ], [ 6, 22, 38 ], [ 6, 24, 42 ], [ 6, 26, 46 ], [ 6, 28, 50 ], [ 6, 30, 54 ], [ 6, 32, 58 ], [ 6, 34, 62 ], [ 6, 26, 46, 66 ], [ 6, 26, 48, 70 ], [ 6, 26, 50, 74 ], [ 6, 30, 54, 78 ], [ 6, 30, 56, 82 ], [ 6, 30, 58, 86 ], [ 6, 34, 62, 90 ], [ 6, 28, 50, 72, 94 ], [ 6, 26, 50, 74, 98 ], [ 6, 30, 54, 78, 102 ], [ 6, 28, 54, 80, 106 ], [ 6, 32, 58, 84, 110 ], [ 6, 30, 58, 86, 114 ], [ 6, 34, 62, 90, 118 ], [ 6, 26, 50, 74, 98, 122 ], [ 6, 30, 54, 78, 102, 126 ], [ 6, 26, 52, 78, 104, 130 ], [ 6, 30, 56, 82, 108, 134 ], [ 6, 34, 60, 86, 112, 138 ], [ 6, 30, 58, 86, 114, 142 ], [ 6, 34, 62, 90, 118, 146 ], [ 6, 30, 54, 78, 102, 126, 150 ], [ 6, 24, 50, 76, 102, 128, 154 ], [ 6, 28, 54, 80, 106, 132, 158 ], [ 6, 32, 58, 84, 110, 136, 162 ], [ 6, 26, 54, 82, 110, 138, 166 ], [ 6, 30, 58, 86, 114, 142, 170 ] ],
    versionInfo: [ null, null, null, null, null, null, null, 31892, 34236, 39577, 42195, 48118, 51042, 55367, 58893, 63784, 68472, 70749, 76311, 79154, 84390, 87683, 92361, 96236, 102084, 102881, 110507, 110734, 117786, 119615, 126325, 127568, 133589, 136944, 141498, 145311, 150283, 152622, 158308, 161089, 167017 ],
    formatInfo: [ 21522, 20773, 24188, 23371, 17913, 16590, 20375, 19104, 30660, 29427, 32170, 30877, 26159, 25368, 27713, 26998, 5769, 5054, 7399, 6608, 1890, 597, 3340, 2107, 13663, 12392, 16177, 14854, 9396, 8579, 11994, 11245 ],
    nCodewords: [ 0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655, 733, 815, 901, 991, 1085, 1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185, 2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706 ],
    nECCodewords: [ null, [ 10, 7, 17, 13 ], [ 16, 10, 28, 22 ], [ 26, 15, 44, 36 ], [ 36, 20, 64, 52 ], [ 48, 26, 88, 72 ], [ 64, 36, 112, 96 ], [ 72, 40, 130, 108 ], [ 88, 48, 156, 132 ], [ 110, 60, 192, 160 ], [ 130, 72, 224, 192 ], [ 150, 80, 264, 224 ], [ 176, 96, 308, 260 ], [ 198, 104, 352, 288 ], [ 216, 120, 384, 320 ], [ 240, 132, 432, 360 ], [ 280, 144, 480, 408 ], [ 308, 168, 532, 448 ], [ 338, 180, 588, 504 ], [ 364, 196, 650, 546 ], [ 416, 224, 700, 600 ], [ 442, 224, 750, 644 ], [ 476, 252, 816, 690 ], [ 504, 270, 900, 750 ], [ 560, 300, 960, 810 ], [ 588, 312, 1050, 870 ], [ 644, 336, 1110, 952 ], [ 700, 360, 1200, 1020 ], [ 728, 390, 1260, 1050 ], [ 784, 420, 1350, 1140 ], [ 812, 450, 1440, 1200 ], [ 868, 480, 1530, 1290 ], [ 924, 510, 1620, 1350 ], [ 980, 540, 1710, 1440 ], [ 1036, 570, 1800, 1530 ], [ 1064, 570, 1890, 1590 ], [ 1120, 600, 1980, 1680 ], [ 1204, 630, 2100, 1770 ], [ 1260, 660, 2220, 1860 ], [ 1316, 720, 2310, 1950 ], [ 1372, 750, 2430, 2040 ] ],
    ECBlocks: [ [], [ [ 1 ], [ 1 ], [ 1 ], [ 1 ] ], [ [ 1 ], [ 1 ], [ 1 ], [ 1 ] ], [ [ 1 ], [ 1 ], [ 2 ], [ 2 ] ], [ [ 2 ], [ 1 ], [ 4 ], [ 2 ] ], [ [ 2 ], [ 1 ], [ 2, 2 ], [ 2, 2 ] ], [ [ 4 ], [ 2 ], [ 4 ], [ 4 ] ], [ [ 4 ], [ 2 ], [ 4, 1 ], [ 2, 4 ] ], [ [ 2, 2 ], [ 2 ], [ 4, 2 ], [ 4, 2 ] ], [ [ 3, 2 ], [ 2 ], [ 4, 4 ], [ 4, 4 ] ], [ [ 4, 1 ], [ 2, 2 ], [ 6, 2 ], [ 6, 2 ] ], [ [ 1, 4 ], [ 4 ], [ 3, 8 ], [ 4, 4 ] ], [ [ 6, 2 ], [ 2, 2 ], [ 7, 4 ], [ 4, 6 ] ], [ [ 8, 1 ], [ 4 ], [ 12, 4 ], [ 8, 4 ] ], [ [ 4, 5 ], [ 3, 1 ], [ 11, 5 ], [ 11, 5 ] ], [ [ 5, 5 ], [ 5, 1 ], [ 11, 7 ], [ 5, 7 ] ], [ [ 7, 3 ], [ 5, 1 ], [ 3, 13 ], [ 15, 2 ] ], [ [ 10, 1 ], [ 1, 5 ], [ 2, 17 ], [ 1, 15 ] ], [ [ 9, 4 ], [ 5, 1 ], [ 2, 19 ], [ 17, 1 ] ], [ [ 3, 11 ], [ 3, 4 ], [ 9, 16 ], [ 17, 4 ] ], [ [ 3, 13 ], [ 3, 5 ], [ 15, 10 ], [ 15, 5 ] ], [ [ 17 ], [ 4, 4 ], [ 19, 6 ], [ 17, 6 ] ], [ [ 17 ], [ 2, 7 ], [ 34 ], [ 7, 16 ] ], [ [ 4, 14 ], [ 4, 5 ], [ 16, 14 ], [ 11, 14 ] ], [ [ 6, 14 ], [ 6, 4 ], [ 30, 2 ], [ 11, 16 ] ], [ [ 8, 13 ], [ 8, 4 ], [ 22, 13 ], [ 7, 22 ] ], [ [ 19, 4 ], [ 10, 2 ], [ 33, 4 ], [ 28, 6 ] ], [ [ 22, 3 ], [ 8, 4 ], [ 12, 28 ], [ 8, 26 ] ], [ [ 3, 23 ], [ 3, 10 ], [ 11, 31 ], [ 4, 31 ] ], [ [ 21, 7 ], [ 7, 7 ], [ 19, 26 ], [ 1, 37 ] ], [ [ 19, 10 ], [ 5, 10 ], [ 23, 25 ], [ 15, 25 ] ], [ [ 2, 29 ], [ 13, 3 ], [ 23, 28 ], [ 42, 1 ] ], [ [ 10, 23 ], [ 17 ], [ 19, 35 ], [ 10, 35 ] ], [ [ 14, 21 ], [ 17, 1 ], [ 11, 46 ], [ 29, 19 ] ], [ [ 14, 23 ], [ 13, 6 ], [ 59, 1 ], [ 44, 7 ] ], [ [ 12, 26 ], [ 12, 7 ], [ 22, 41 ], [ 39, 14 ] ], [ [ 6, 34 ], [ 6, 14 ], [ 2, 64 ], [ 46, 10 ] ], [ [ 29, 14 ], [ 17, 4 ], [ 24, 46 ], [ 49, 10 ] ], [ [ 13, 32 ], [ 4, 18 ], [ 42, 32 ], [ 48, 14 ] ], [ [ 40, 7 ], [ 20, 4 ], [ 10, 67 ], [ 43, 22 ] ], [ [ 18, 31 ], [ 19, 6 ], [ 20, 61 ], [ 34, 34 ] ] ]
};

ReedSolomon.prototype = {
    encode: function(msg) {
        null == this.gen_poly && (this.gen_poly = this.genPoly(this.n_ec_bytes));
        var i, LFSR = new Array(this.n_ec_bytes + 1);
        for (i = 0; i < this.n_ec_bytes + 1; i++) LFSR[i] = 0;
        for (i = 0; i < msg.length; i++) {
            var j, dbyte = msg[i] ^ LFSR[this.n_ec_bytes - 1];
            for (j = this.n_ec_bytes - 1; j > 0; j--) LFSR[j] = LFSR[j - 1] ^ this.gmult(this.gen_poly[j], dbyte);
            LFSR[0] = this.gmult(this.gen_poly[0], dbyte);
        }
        var parity = [];
        for (i = this.n_ec_bytes - 1; i >= 0; i--) parity.push(LFSR[i]);
        return parity;
    },
    decode: function(bytes_in) {
        this.bytes_in = bytes_in, this.bytes_out = bytes_in.slice();
        var n_err = this.calculateSyndroms();
        return n_err > 0 ? this.correctErrors() : this.corrected = !0, this.bytes_out.slice(0, this.bytes_out.length - this.n_ec_bytes);
    },
    genPoly: function(nbytes) {
        var tp, tp1, genpoly;
        tp1 = this.zeroPoly(), tp1[0] = 1;
        var i;
        for (i = 0; nbytes > i; i++) tp = this.zeroPoly(), tp[0] = this.gexp[i], tp[1] = 1, 
        genpoly = this.multPolys(tp, tp1), tp1 = this.copyPoly(genpoly);
        return this.logger && this.logger.debug("RS genPoly: " + genpoly.join(",")), genpoly;
    },
    calculateSyndroms: function() {
        this.syndroms = [];
        var sum, i, j, n_err = 0;
        for (j = 0; j < this.n_ec_bytes; j++) {
            for (sum = 0, i = 0; i < this.bytes_in.length; i++) sum = this.bytes_in[i] ^ this.gmult(this.gexp[j], sum);
            this.syndroms.push(sum), sum > 0 && n_err++;
        }
        return this.logger && this.logger.debug(n_err > 0 ? "RS calculateSyndroms: <b>Errors found!</b> syndroms = " + this.syndroms.join(",") : "RS calculateSyndroms: <b>No errors</b>"), 
        n_err;
    },
    correctErrors: function() {
        if (this.berlekampMassey(), this.findRoots(), this.corrected = !1, 2 * this.n_errors > this.n_ec_bytes) return this.uncorrected_reason = "too many errors", 
        void (this.logger && this.logger.debug("RS correctErrors: <b>" + this.uncorrected_reason + "</b>"));
        var e;
        for (e = 0; e < this.n_errors; e++) if (this.error_locs[e] >= this.bytes_in.length) return this.uncorrected_reason = "corrections out of scope", 
        void (this.logger && this.logger.debug("RS correctErrors: <b>" + this.uncorrected_reason + "</b>"));
        if (0 === this.n_errors) return this.uncorrected_reason = "could not identify errors", 
        void (this.logger && this.logger.debug("RS correctErrors: <b>" + this.uncorrected_reason + "</b>"));
        var r;
        for (r = 0; r < this.n_errors; r++) {
            var j, i = this.error_locs[r], num = 0;
            for (j = 0; j < this.n_degree_max; j++) num ^= this.gmult(this.omega[j], this.gexp[(255 - i) * j % 255]);
            var denom = 0;
            for (j = 0; j < this.n_degree_max; j += 2) denom ^= this.gmult(this.psi[j], this.gexp[(255 - i) * j % 255]);
            var err = this.gmult(num, this.ginv(denom));
            this.logger && this.logger.debug("RS correctErrors: loc=" + (this.bytes_out.length - i - 1) + "  err = 0x0" + err.toString(16) + " = bin " + err.toString(2)), 
            this.bytes_out[this.bytes_out.length - i - 1] ^= err;
        }
        this.corrected = !0;
    },
    berlekampMassey: function() {
        var gamma = this.zeroPoly();
        gamma[0] = 1;
        var D = this.copyPoly(gamma);
        this.mulZPoly(D), this.psi = this.copyPoly(gamma);
        var i, n, psi2 = new Array(this.n_degree_max), k = -1, L = 0;
        for (n = 0; n < this.n_ec_bytes; n++) {
            var d = this.computeDiscrepancy(this.psi, this.syndroms, L, n);
            if (0 !== d) {
                for (i = 0; i < this.n_degree_max; i++) psi2[i] = this.psi[i] ^ this.gmult(d, D[i]);
                if (n - k > L) {
                    var L2 = n - k;
                    for (k = n - L, i = 0; i < this.n_degree_max; i++) D[i] = this.gmult(this.psi[i], this.ginv(d));
                    L = L2;
                }
                this.psi = this.copyPoly(psi2);
            }
            this.mulZPoly(D);
        }
        this.logger && this.logger.debug("RS berlekampMassey: psi = " + this.psi.join(","));
        var om = this.multPolys(this.psi, this.syndroms);
        for (this.omega = this.zeroPoly(), i = 0; i < this.n_ec_bytes; i++) this.omega[i] = om[i];
        this.logger && this.logger.debug("RS berlekampMassey: omega = " + this.omega.join(","));
    },
    findRoots: function() {
        this.n_errors = 0, this.error_locs = [];
        var sum, r;
        for (r = 1; 256 > r; r++) {
            sum = 0;
            var k;
            for (k = 0; k < this.n_ec_bytes + 1; k++) sum ^= this.gmult(this.gexp[k * r % 255], this.psi[k]);
            0 === sum && (this.error_locs.push(255 - r), this.n_errors++);
        }
        this.logger && this.logger.debug("RS findRoots: errors=<b>" + this.n_errors + "</b> locations = " + this.error_locs.join(","));
    },
    computeDiscrepancy: function(lambda, S, L, n) {
        var i, sum = 0;
        for (i = 0; L >= i; i++) sum ^= this.gmult(lambda[i], S[n - i]);
        return sum;
    },
    copyPoly: function(src) {
        var i, dst = new Array(this.n_degree_max);
        for (i = 0; i < this.n_degree_max; i++) dst[i] = src[i];
        return dst;
    },
    zeroPoly: function() {
        var i, poly = new Array(this.n_degree_max);
        for (i = 0; i < this.n_degree_max; i++) poly[i] = 0;
        return poly;
    },
    mulZPoly: function(poly) {
        var i;
        for (i = this.n_degree_max - 1; i > 0; i--) poly[i] = poly[i - 1];
        poly[0] = 0;
    },
    multPolys: function(p1, p2) {
        var i, dst = new Array(this.n_degree_max), tmp1 = new Array(2 * this.n_degree_max);
        for (i = 0; i < 2 * this.n_degree_max; i++) dst[i] = 0;
        for (i = 0; i < this.n_degree_max; i++) {
            var j;
            for (j = this.n_degree_max; j < 2 * this.n_degree_max; j++) tmp1[j] = 0;
            for (j = 0; j < this.n_degree_max; j++) tmp1[j] = this.gmult(p2[j], p1[i]);
            for (j = 2 * this.n_degree_max - 1; j >= i; j--) tmp1[j] = tmp1[j - i];
            for (j = 0; i > j; j++) tmp1[j] = 0;
            for (j = 0; j < 2 * this.n_degree_max; j++) dst[j] ^= tmp1[j];
        }
        return dst;
    },
    initGaloisTables: function() {
        var pinit = 0, p1 = 1, p2 = 0, p3 = 0, p4 = 0, p5 = 0, p6 = 0, p7 = 0, p8 = 0;
        this.gexp = new Array(512), this.glog = new Array(256), this.gexp[0] = 1, this.gexp[255] = this.gexp[0], 
        this.glog[0] = 0;
        var i;
        for (i = 1; 256 > i; i++) pinit = p8, p8 = p7, p7 = p6, p6 = p5, p5 = p4 ^ pinit, 
        p4 = p3 ^ pinit, p3 = p2 ^ pinit, p2 = p1, p1 = pinit, this.gexp[i] = p1 + 2 * p2 + 4 * p3 + 8 * p4 + 16 * p5 + 32 * p6 + 64 * p7 + 128 * p8, 
        this.gexp[i + 255] = this.gexp[i];
        for (i = 1; 256 > i; i++) {
            var z;
            for (z = 0; 256 > z; z++) if (this.gexp[z] === i) {
                this.glog[i] = z;
                break;
            }
        }
    },
    gmult: function(a, b) {
        if (0 === a || 0 === b) return 0;
        var i = this.glog[a], j = this.glog[b];
        return this.gexp[i + j];
    },
    ginv: function(elt) {
        return this.gexp[255 - this.glog[elt]];
    }
}, QRDecode.prototype = {
    decodePix: function(pix) {
        return this.decodeImage(pix);
    },
    decodeImageData: function(imageData, imageWidth, imageHeight) {
        return this.setImageData(imageData, imageWidth, imageHeight), this.decode();
    },
    decodeImageDataInsideBordersWithMaxVersion: function(imageData, imageWidth, imageHeight, left, right, top, bottom, maxVersion) {
        return this.setImageData(imageData, imageWidth, imageHeight), this.imageLeft = left, 
        this.imageRight = right, this.imageTop = top, this.imageBottom = bottom, this.imageSize = (this.imageRight - this.imageLeft + 1 + (this.imageBottom - this.imageTop + 1)) / 2, 
        this.maxVersion = maxVersion, this.decodeInsideBordersWithMaxVersion();
    },
    setImageData: function(imageData, imageWidth, imageHeight) {
        imageData.minCol = 255, imageData.maxCol = 0;
        var x, y, p, v, total = 0;
        for (x = 0; imageWidth > x; x++) for (y = 0; imageHeight > y; y++) p = 4 * x + y * imageWidth * 4, 
        v = .3 * imageData.data[p] + .59 * imageData.data[p + 1] + .11 * imageData.data[p + 2], 
        total += v, v < imageData.minCol && (imageData.minCol = v), v > imageData.maxCol && (imageData.maxCol = v);
        if (imageData.maxCol - imageData.minCol < 25.5) throw "Image does not have enough contrast (this.image_data.min_col=" + imageData.minCol + " this.image_data.max_col=" + imageData.maxCol + ")";
        imageData.threshold = total / (imageWidth * imageHeight), imageData.getGray = function(x, y, d) {
            var i, j, p, n = 0;
            for (i = x; x + d > i; i++) for (j = y; y + d > j; j++) p = 4 * i + j * this.width * 4, 
            n = n + .3 * this.data[p] + .59 * this.data[p + 1] + .11 * this.data[p + 2];
            return n / d / d;
        }, imageData.isDark = function(x, y, d) {
            var g = this.getGray(x, y, d);
            return g < this.threshold;
        }, this.image = imageData;
    },
    decodeImage: function(image) {
        return this.image = image, this.decode();
    },
    decode: function() {
        return this.findImageBorders(), this.maxVersion = 40, this.decodeInsideBordersWithMaxVersion(), 
        this.data;
    },
    decodeInsideBordersWithMaxVersion: function() {
        return this.findModuleSize(), QRBase.setFunctionalPattern(this), this.extractCodewords(), 
        QRBase.setBlocks(this), this.correctErrors(), this.extractData(), this.data;
    },
    findImageBorders: function() {
        var i, j, n, limit = 7, skewLimit = 2;
        for (i = 0; i < this.image.width; i++) {
            for (n = 0, j = 0; j < this.image.height; j++) n += this.image.isDark(i, j, 1);
            if (n >= limit) break;
        }
        for (this.imageLeft = i, i = this.image.width - 1; i >= 0; i--) {
            for (n = 0, j = 0; j < this.image.height; j++) n += this.image.isDark(i, j, 1);
            if (n >= limit) break;
        }
        for (this.imageRight = i, j = 0; j < this.image.height; j++) {
            for (n = 0, i = 0; i < this.image.width; i++) n += this.image.isDark(i, j, 1);
            if (n >= limit) break;
        }
        for (this.imageTop = j, j = this.image.height - 1; j >= 0; j--) {
            for (n = 0, i = 0; i < this.image.width; i++) n += this.image.isDark(i, j, 1);
            if (n >= limit) break;
        }
        if (this.imageBottom = j, this.imageRight - this.imageLeft + 1 < 21 || this.imageBottom - this.imageTop + 1 < 21) throw "Found no image data to decode";
        if (Math.abs(this.imageRight - this.imageLeft - (this.imageBottom - this.imageTop)) > skewLimit) throw "Image data is not rectangular";
        this.imageSize = (this.imageRight - this.imageLeft + 1 + (this.imageBottom - this.imageTop + 1)) / 2;
    },
    findModuleSize: function() {
        function matchFinderPattern(qr, x, y, quietX, quietY, moduleSize) {
            var i, j, n = 0;
            for (i = 0; 5 >= i; i++) qr.isDarkWithSize(x + i, y, moduleSize) && (n += 1), qr.isDarkWithSize(x + 6, y + i, moduleSize) && (n += 1), 
            qr.isDarkWithSize(x + 6 - i, y + 6, moduleSize) && (n += 1), qr.isDarkWithSize(x, y + 6 - i, moduleSize) && (n += 1);
            for (i = 0; 3 >= i; i++) qr.isDarkWithSize(x + i + 1, y + 1, moduleSize) || (n += 1), 
            qr.isDarkWithSize(x + 5, y + i + 1, moduleSize) || (n += 1), qr.isDarkWithSize(x + 5 - i, y + 5, moduleSize) || (n += 1), 
            qr.isDarkWithSize(x + 1, y + 5 - i, moduleSize) || (n += 1);
            for (i = 0; 2 >= i; i++) for (j = 0; 2 >= j; j++) qr.isDarkWithSize(3 + x, 3 + y, moduleSize) && (n += 1);
            for (i = 0; 6 >= i; i++) qr.isDarkWithSize(x + quietX, y + i, moduleSize) || (n += 1), 
            qr.isDarkWithSize(x + i, y + quietY, moduleSize) || (n += 1);
            return qr.isDarkWithSize(x + quietX, y + quietY, moduleSize) || (n += 1), n;
        }
        function matchTimingPattern(qr, horizontal, nModules, moduleSize) {
            var c, i, x, y, last5, n = 0, x0 = 6, y0 = 8, dx = 0, dy = 1, consecutive = 5, ok = [], black = !0;
            for (horizontal && (x0 = 8, y0 = 6, dx = 1, dy = 0), c = 0; consecutive > c; c++) ok.push(1);
            for (i = 0; nModules - 8 - 8 > i; i++) {
                for (x = x0 + i * dx, y = y0 + i * dy, black === qr.isDarkWithSize(x, y, moduleSize) ? (n++, 
                ok.push(1)) : ok.push(0), black = !black, last5 = 0, c = ok.length - consecutive; c < ok.length - 1; c++) ok[c] && (last5 += 1);
                if (3 > last5) return 0;
            }
            return n;
        }
        function matchOneAlignmentPattern(qr, x, y, moduleSize) {
            var i, n = 0;
            for (i = 0; 3 >= i; i++) qr.isDarkWithSize(x + i, y, moduleSize) && (n += 1), qr.isDarkWithSize(x + 4, y + i, moduleSize) && (n += 1), 
            qr.isDarkWithSize(x + 4 - i, y + 4, moduleSize) && (n += 1), qr.isDarkWithSize(x, y + 4 - i, moduleSize) && (n += 1);
            for (i = 0; 1 >= i; i++) qr.isDarkWithSize(x + i + 1, y + 1, moduleSize) || (n += 1), 
            qr.isDarkWithSize(x + 3, y + i + 1, moduleSize) || (n += 1), qr.isDarkWithSize(x + 3 - i, y + 3, moduleSize) || (n += 1), 
            qr.isDarkWithSize(x + 1, y + 3 - i, moduleSize) || (n += 1);
            return qr.isDarkWithSize(x + 2, y + 2, moduleSize) && (n += 1), n;
        }
        function matchAlignmentPatterns(qr, version, moduleSize) {
            var i, j, na, a = 0, n = QRBase.alignmentPatterns[version].length;
            for (i = 0; n > i; i++) for (j = 0; n > j; j++) 0 === i && 0 === j || 0 === i && j === n - 1 || i === n - 1 && 0 === j || (na = matchOneAlignmentPattern(qr, QRBase.alignmentPatterns[version][i] - 2, QRBase.alignmentPatterns[version][j] - 2, moduleSize), 
            na > 24 && a++);
            return a;
        }
        function matchVersionCode(qr, pattern) {
            var v, hd;
            for (v = 7; 40 >= v; v++) if (hd = qr.hammingDistance(pattern, QRBase.versionInfo[v]), 
            3 >= hd) return [ v, hd ];
            return [ 0, 4 ];
        }
        function matchVersionTopright(qr, nModules, moduleSize) {
            var x, y, factor = 1, pattern = 0;
            for (y = 0; 6 > y; y++) for (x = nModules - 11; nModules - 11 + 3 > x; x++) qr.isDarkWithSize(x, y, moduleSize) && (pattern += factor), 
            factor *= 2;
            return matchVersionCode(qr, pattern);
        }
        function matchVersionBottomleft(qr, nModules, moduleSize) {
            var x, y, factor = 1, pattern = 0;
            for (x = 0; 6 > x; x++) for (y = nModules - 11; nModules - 11 + 3 > y; y++) qr.isDarkWithSize(x, y, moduleSize) && (pattern += factor), 
            factor *= 2;
            return matchVersionCode(qr, pattern);
        }
        function matchFormatCode(qr, pattern) {
            var f, hd;
            for (f = 0; 32 > f; f++) if (hd = qr.hammingDistance(pattern, QRBase.formatInfo[f]), 
            3 >= hd) return [ f, hd ];
            return [ 0, 4 ];
        }
        function matchFormatNW(qr, nModules, moduleSize) {
            var y, factor = 1, pattern = 0, x = 8;
            for (y = 0; 5 >= y; y++) qr.isDarkWithSize(x, y, moduleSize) && (pattern += factor), 
            factor *= 2;
            for (qr.isDarkWithSize(8, 7, moduleSize) && (pattern += factor), factor *= 2, qr.isDarkWithSize(8, 8, moduleSize) && (pattern += factor), 
            factor *= 2, qr.isDarkWithSize(7, 8, moduleSize) && (pattern += factor), factor *= 2, 
            y = 8, x = 5; x >= 0; x--) qr.isDarkWithSize(x, y, moduleSize) && (pattern += factor), 
            factor *= 2;
            return matchFormatCode(qr, pattern);
        }
        function matchFormatNESW(qr, nModules, moduleSize) {
            var x, factor = 1, pattern = 0, y = 8;
            for (x = nModules - 1; x > nModules - 1 - 8; x--) qr.isDarkWithSize(x, y, moduleSize) && (pattern += factor), 
            factor *= 2;
            for (x = 8, y = nModules - 7; nModules - 1 > y; y++) qr.isDarkWithSize(x, y, moduleSize) && (pattern += factor), 
            factor *= 2;
            return matchFormatCode(qr, pattern);
        }
        function gradeFinderPatterns(finderPattern) {
            var i, g = 4;
            for (i = 0; 3 > i; i++) g -= 64 - finderPattern[i];
            return 0 > g && (g = 0), g;
        }
        function gradeTimingPatterns(timingPattern, n) {
            var t = (timingPattern[0] + timingPattern[1]) / (2 * n);
            return t = 1 - t, t >= .14 ? 0 : t >= .11 ? 1 : t >= .07 ? 2 : t >= 1e-5 ? 3 : 4;
        }
        function gradeAlignmentPatterns(alignmentPatterns, n) {
            var a = alignmentPatterns / n;
            return a = 1 - a, a >= .3 ? 0 : a >= .2 ? 1 : a >= .1 ? 2 : a >= 1e-5 ? 3 : 4;
        }
        function matchVersion(qr, version) {
            var g, v1, formatNW, formatNESW, ECLevel, mask, i, grades = [], nModules = QRBase.nModulesFromVersion(version), moduleSize = qr.imageSize / nModules, finderPattern = [ 0, 0, 0 ], versionTopright = [ 0, 0 ], versionBottomleft = [ 0, 0 ], timingPattern = [ 0, 0 ], alignmentPatterns = -3, format = 0, grade = 4;
            if (finderPattern[0] = matchFinderPattern(qr, 0, 0, 7, 7, moduleSize), finderPattern[0] < 61) return [ version, 0 ];
            if (finderPattern[1] = matchFinderPattern(qr, 0, nModules - 7, 7, -1, moduleSize), 
            finderPattern[0] + finderPattern[1] < 125) return [ version, 0 ];
            if (finderPattern[2] = matchFinderPattern(qr, nModules - 7, 0, -1, 7, moduleSize), 
            g = gradeFinderPatterns(finderPattern), 1 > g) return [ version, 0 ];
            if (grades.push(g), version >= 7) {
                if (versionTopright = matchVersionTopright(qr, nModules, moduleSize), versionBottomleft = matchVersionBottomleft(qr, nModules, moduleSize), 
                v1 = version, versionTopright[1] < versionBottomleft[1] ? versionTopright[1] < 4 && (v1 = versionTopright[0]) : versionBottomleft[1] < 4 && (v1 = versionBottomleft[0]), 
                v1 !== version && (version = v1), nModules = QRBase.nModulesFromVersion(version), 
                moduleSize = qr.imageSize / nModules, g = Math.round((4 - versionTopright[1] + (4 - versionBottomleft[1])) / 2), 
                1 > g) return [ version, 0 ];
                grades.push(g);
            }
            if (timingPattern[0] = matchTimingPattern(qr, !0, nModules, moduleSize), timingPattern[1] = matchTimingPattern(qr, !1, nModules, moduleSize), 
            g = gradeTimingPatterns(timingPattern, nModules - 8 - 8), 1 > g) return [ version, 0 ];
            if (grades.push(g), version > 1 && (alignmentPatterns = matchAlignmentPatterns(qr, version, moduleSize)), 
            g = gradeAlignmentPatterns(alignmentPatterns, QRBase.alignmentPatterns[version].length * QRBase.alignmentPatterns[version].length - 3), 
            1 > g) return [ version, 0 ];
            if (grades.push(g), formatNW = matchFormatNW(qr, nModules, moduleSize), formatNESW = matchFormatNESW(qr, nModules, moduleSize), 
            format = formatNW[1] < formatNESW[1] ? formatNW[0] : formatNESW[0], ECLevel = Math.floor(format / 8), 
            mask = format % 8, g = Math.round((4 - formatNW[1] + (4 - formatNESW[1])) / 2), 
            1 > g) return [ version, 0 ];
            for (grades.push(g), i = 0; i < grades.length; i++) grades[i] < grade && (grade = grades[i]);
            return [ version, grade, ECLevel, mask ];
        }
        var version, match, bestMatchSoFar = [ 0, 0 ];
        for (version = 1; version <= this.maxVersion && (match = matchVersion(this, version), 
        match[1] > bestMatchSoFar[1] && (bestMatchSoFar = match), 4 !== match[1]); version++) ;
        if (this.version = bestMatchSoFar[0], this.nModules = QRBase.nModulesFromVersion(this.version), 
        this.moduleSize = this.imageSize / this.nModules, this.functionalGrade = bestMatchSoFar[1], 
        this.ECLevel = bestMatchSoFar[2], this.mask = bestMatchSoFar[3], this.functionalGrade < 1) throw "Unable to decode a function pattern";
    },
    extractCodewords: function() {
        function getUnmasked(qr, j, i) {
            var m, u;
            switch (qr.mask) {
              case 0:
                m = (i + j) % 2;
                break;

              case 1:
                m = i % 2;
                break;

              case 2:
                m = j % 3;
                break;

              case 3:
                m = (i + j) % 3;
                break;

              case 4:
                m = (Math.floor(i / 2) + Math.floor(j / 3)) % 2;
                break;

              case 5:
                m = i * j % 2 + i * j % 3;
                break;

              case 6:
                m = (i * j % 2 + i * j % 3) % 2;
                break;

              case 7:
                m = ((i + j) % 2 + i * j % 3) % 2;
            }
            return u = 0 === m ? !qr.isDark(j, i) : qr.isDark(j, i);
        }
        this.codewords = [];
        var i, j, col, count, readingUp = !0, currentByte = 0, factor = 128, bitsRead = 0;
        for (j = this.nModules - 1; j > 0; j -= 2) {
            for (6 === j && j--, count = 0; count < this.nModules; count++) for (i = readingUp ? this.nModules - 1 - count : count, 
            col = 0; 2 > col; col++) this.functionalPattern[j - col][i] || (getUnmasked(this, j - col, i) && (currentByte += factor), 
            factor /= 2, 1 > factor && (this.codewords.push(currentByte), bitsRead = 0, factor = 128, 
            currentByte = 0));
            readingUp ^= !0;
        }
    },
    extractData: function() {
        function extract(qr, bytes, pos, len) {
            var shift = 24 - (7 & pos) - len, mask = (1 << len) - 1, byteIndex = pos >>> 3;
            return (bytes[byteIndex] << 16 | bytes[++byteIndex] << 8 | bytes[++byteIndex]) >> shift & mask;
        }
        function extract8bit(qr, bytes) {
            var i, a, nCountBits = QRBase.nCountBits(QRBase.MODE.EightBit, qr.version), n = extract(qr, bytes, qr.bitIdx, nCountBits), data = "";
            for (qr.bitIdx += nCountBits, i = 0; n > i; i++) a = extract(qr, bytes, qr.bitIdx, 8), 
            data += String.fromCharCode(a), qr.bitIdx += 8;
            return QRBase.utf8Tounicode(data);
        }
        function extractAlphanum(qr, bytes) {
            var i, x, nCountBits = QRBase.nCountBits(QRBase.MODE.AlphaNumeric, qr.version), n = extract(qr, bytes, qr.bitIdx, nCountBits), data = "";
            for (qr.bitIdx += nCountBits, i = 0; i < Math.floor(n / 2); i++) x = extract(qr, bytes, qr.bitIdx, 11), 
            data += qr.alphanum[Math.floor(x / 45)], data += qr.alphanum[x % 45], qr.bitIdx += 11;
            return n % 2 && (data += qr.alphanum[extract(qr, bytes, qr.bitIdx, 6)], qr.bitIdx += 6), 
            data;
        }
        function extractNumeric(qr, bytes) {
            var x, c1, c2, c3, i, nCountBits = QRBase.nCountBits(QRBase.MODE.Numeric, qr.version), n = extract(qr, bytes, qr.bitIdx, nCountBits), data = "";
            for (qr.bitIdx += nCountBits, i = 0; i < Math.floor(n / 3); i++) x = extract(qr, bytes, qr.bitIdx, 10), 
            qr.bitIdx += 10, c1 = Math.floor(x / 100), c2 = Math.floor(x % 100 / 10), c3 = x % 10, 
            data += String.fromCharCode(48 + c1, 48 + c2, 48 + c3);
            return n % 3 === 1 ? (x = extract(qr, bytes, qr.bitIdx, 4), qr.bitIdx += 4, data += String.fromCharCode(48 + x)) : n % 3 === 2 && (x = extract(qr, bytes, qr.bitIdx, 7), 
            qr.bitIdx += 7, c1 = Math.floor(x / 10), c2 = x % 10, data += String.fromCharCode(48 + c1, 48 + c2)), 
            data;
        }
        var i, mode, bytes = this.bytes, nBits = 8 * bytes.length;
        for (i = 0; 4 > i; i++) bytes.push(0);
        for (this.data = "", this.bitIdx = 0; this.bitIdx < nBits - 4 && (mode = extract(this, bytes, this.bitIdx, 4), 
        this.bitIdx += 4, mode !== QRBase.MODE.Terminator); ) if (mode === QRBase.MODE.AlphaNumeric) this.data += extractAlphanum(this, bytes); else if (mode === QRBase.MODE.EightBit) this.data += extract8bit(this, bytes); else {
            if (mode !== QRBase.MODE.Numeric) throw "Unsupported ECI mode: " + mode;
            this.data += extractNumeric(this, bytes);
        }
    },
    correctErrors: function() {
        var b, bytesIn, bytesOut, i, rs = new ReedSolomon(this.nBlockEcWords), errors = [], bytes = [];
        for (b = 0; b < this.blockIndices.length; b++) {
            for (bytesIn = [], i = 0; i < this.blockIndices[b].length; i++) bytesIn.push(this.codewords[this.blockIndices[b][i]]);
            if (bytesOut = rs.decode(bytesIn), !rs.corrected) throw this.errorGrade = 0, "Unable to correct errors (" + rs.uncorrected_reason + ")";
            bytes = bytes.concat(bytesOut), errors.push(rs.n_errors);
        }
        this.errors = errors, this.bytes = bytes, this.errorGrade = this.gradeErrors(errors);
    },
    gradeErrors: function(errors) {
        var i, ecw = this.nBlockEcWords, max = 0, grade = 4;
        for (i = 0; i < errors.length; i++) errors[i] > max && (max = errors[i]);
        return max > ecw / 2 - 1 ? grade = 0 : max > ecw / 2 - 2 ? grade = 1 : max > ecw / 2 - 3 ? grade = 2 : max > ecw / 2 - 4 && (grade = 3), 
        grade;
    },
    hammingDistance: function(a, b) {
        function nBits(n) {
            var c;
            for (c = 0; n; c++) n &= n - 1;
            return c;
        }
        var d = a ^ b;
        return nBits(d);
    },
    isDarkWithSize: function(x, y, moduleSize) {
        return this.image.isDark(Math.round(this.imageLeft + x * moduleSize), Math.round(this.imageTop + y * moduleSize), Math.round(moduleSize));
    },
    isDark: function(x, y) {
        return this.isDarkWithSize(x, y, this.moduleSize);
    },
    alphanum: [ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", " ", "$", "%", "*", "+", "-", ".", "/", ":" ]
}, function($, window, document, undefined) {
    var Decode = function(dom) {
        var imageData, self = this;
        self.text = "", $.extend(self, {
            _init: function(imageData) {
                var qr = new QRDecode(), text = qr.decodeImageData(imageData, self.width, self.height);
                return text;
            },
            getImageData: function(dom) {
                var ctx;
                if ("canvas" !== dom.nodeName.toLowerCase()) {
                    if (!$(dom).find("canvas").length) return !1;
                    dom = $(dom).find("canvas")[0];
                }
                return ctx = dom.getContext("2d"), self.width = dom.width, self.height = dom.height, 
                ctx.getImageData(0, 0, dom.width, dom.height);
            }
        }), imageData = self.getImageData(dom), imageData && (self.text = self._init(imageData));
    };
    $.fn.qrdecode = function() {
        var $self = $(this), length = $self.length, text = "";
        return length && (text = new Decode($self[0]).text), text;
    };
}(jQuery, window, document), QREncode.prototype = {
    encodeToPix: function(mode, text, version, ECLevel) {
        var i, nModules = QRBase.nModulesFromVersion(version), pix = {};
        for (this.nModules = nModules, pix.width = nModules, pix.height = nModules, pix.arr = [], 
        i = 0; nModules > i; i++) pix.arr[i] = [];
        return pix.setBackground = function() {
            for (i = 0; nModules > i; i++) {
                var j;
                for (j = 0; nModules > j; j++) this.arr[i][j] = !1;
            }
        }, pix.setDark = function(x, y) {
            x > nModules - 1 || y > nModules - 1 || (this.arr[x][y] = !0);
        }, pix.isDark = function(x, y) {
            return x > nModules - 1 || y > nModules - 1 ? !1 : pix.arr[x][y];
        }, this.encodeInit(version, ECLevel, pix), this.encodeAddText(mode, text), this.encode(), 
        pix.arr;
    },
    setErrorThrow: function(func) {
        QRBase.setErrorThrow(func);
    },
    encodeInit: function(version, ECLevel, canvas) {
        this.version = version, this.ECLevel = ECLevel, this.image = canvas, this.image.setBackground(), 
        this.bitIdx = 0, QRBase.setBlocks(this), this.data = [];
        var i;
        for (i = 0; i < this.nDataCodewords; i++) this.data[i] = 0;
        for (this.pixels = [], i = 0; i < this.nModules; i++) this.pixels[i] = [];
    },
    encodeAddText: function(mode, text) {
        this.addTextImplementation(mode, text);
    },
    encode: function() {
        this.addTextImplementation(QRBase.MODE.Terminator, null), this.appendPadding(), 
        this.addErrorCorrection(), this.encodeBestMask(), this.pixelsToImage();
    },
    addTextImplementation: function(mode, text) {
        function appendBits(bytes, pos, len, value) {
            var byteIndex = pos >>> 3, shift = 24 - (7 & pos) - len, v = value << shift;
            bytes[byteIndex + 2] = 255 & v, v >>>= 8, bytes[byteIndex + 1] = 255 & v, v >>>= 8, 
            bytes[byteIndex] += 255 & v;
        }
        function getAlphaNum(qr, ch) {
            return ch = ch.toUpperCase(), qr.alphanumRev.hasOwnProperty(ch) || QRBase.errorThrow("Invalid character for Alphanumeric encoding [" + ch + "]"), 
            qr.alphanumRev[ch];
        }
        function addAlphaNum(qr, text) {
            var i, val, n = text.length, nCountBits = QRBase.nCountBits(QRBase.MODE.AlphaNumeric, qr.version);
            for (appendBits(qr.data, qr.bitIdx, nCountBits, n), qr.bitIdx += nCountBits, i = 0; n - 1 > i; i += 2) val = 45 * getAlphaNum(qr, text[i]) + getAlphaNum(qr, text[i + 1]), 
            appendBits(qr.data, qr.bitIdx, 11, val), qr.bitIdx += 11;
            n % 2 && (appendBits(qr.data, qr.bitIdx, 6, getAlphaNum(qr, text[n - 1])), qr.bitIdx += 6);
        }
        function add8bit(qr, text) {
            var i, nCountBits = QRBase.nCountBits(QRBase.MODE.EightBit, qr.version);
            for (appendBits(qr.data, qr.bitIdx, nCountBits, text.length), qr.bitIdx += nCountBits, 
            i = 0; i < text.length; i++) appendBits(qr.data, qr.bitIdx, 8, text.charCodeAt(i)), 
            qr.bitIdx += 8;
        }
        function addNumeric(qr, text) {
            var val, i, ch, n = text.length, nCountBits = QRBase.nCountBits(QRBase.MODE.Numeric, qr.version), num = [];
            for (appendBits(qr.data, qr.bitIdx, nCountBits, n), qr.bitIdx += nCountBits, i = 0; n > i; i++) ch = text.charCodeAt(i) - 48, 
            (0 > ch || ch > 9) && QRBase.errorThrow("Invalid character for Numeric encoding [" + text[i] + "]"), 
            num.push(ch);
            for (i = 0; n - 2 > i; i += 3) val = 100 * num[i] + 10 * num[i + 1] + num[i + 2], 
            appendBits(qr.data, qr.bitIdx, 10, val), qr.bitIdx += 10;
            n % 3 === 1 ? (val = num[n - 1], appendBits(qr.data, qr.bitIdx, 4, val), qr.bitIdx += 4) : n % 3 === 2 && (val = 10 * num[n - 2] + num[n - 1], 
            appendBits(qr.data, qr.bitIdx, 7, val), qr.bitIdx += 7);
        }
        if (appendBits(this.data, this.bitIdx, 4, mode), this.bitIdx += 4, mode === QRBase.MODE.AlphaNumeric) addAlphaNum(this, text); else if (mode === QRBase.MODE.EightBit) add8bit(this, QRBase.unicodeToUtf8(text)); else if (mode === QRBase.MODE.Numeric) addNumeric(this, text); else {
            if (mode === QRBase.MODE.Terminator) return;
            QRBase.errorThrow("Unsupported ECI mode: " + mode);
        }
        this.bitIdx / 8 > this.nDataCodewords && QRBase.errorThrow("Text too long for this EC version");
    },
    appendPadding: function() {
        var i;
        for (i = Math.floor((this.bitIdx - 1) / 8) + 1; i < this.nDataCodewords; i += 2) this.data[i] = 236, 
        this.data[i + 1] = 17;
    },
    addErrorCorrection: function() {
        var b, i, m, bytesIn, bytesOut, rs = new ReedSolomon(this.nBlockEcWords), bytes = [], n = 0;
        for (b = 0; b < this.blockDataLengths.length; b++) {
            for (m = this.blockDataLengths[b], bytesIn = this.data.slice(n, n + m), n += m, 
            i = 0; m > i; i++) bytes[this.blockIndices[b][i]] = bytesIn[i];
            for (bytesOut = rs.encode(bytesIn), i = 0; i < bytesOut.length; i++) bytes[this.blockIndices[b][m + i]] = bytesOut[i];
        }
        this.bytes = bytes;
    },
    calculatePenalty: function() {
        function penaltyAdjacent(qr) {
            var i, j, nDark, nLight, rc, p = 0;
            for (i = 0; i < qr.nModules; i++) for (nDark = [ 0, 0 ], nLight = [ 0, 0 ], rc = 0; 1 >= rc; rc++) {
                for (j = 0; j < qr.nModules; j++) qr.pixels[rc * i + (1 - rc) * j][(1 - rc) * i + rc * j] ? (nLight[rc] > 5 && (p += 3 + nLight[rc] - 5), 
                nLight[rc] = 0, nDark[rc]++) : (nDark[rc] > 5 && (p += 3 + nDark[rc] - 5), nLight[rc]++, 
                nDark[rc] = 0);
                nLight[rc] > 5 && (p += 3 + nLight[rc] - 5), nDark[rc] > 5 && (p += 3 + nDark[rc] - 5);
            }
            return p;
        }
        function penaltyBlocks(qr) {
            var i, j, b, p = 0;
            for (i = 0; i < qr.nModules - 1; i++) for (j = 0; j < qr.nModules - 1; j++) b = 0, 
            qr.pixels[i][j] && b++, qr.pixels[i + 1][j] && b++, qr.pixels[i][j + 1] && b++, 
            qr.pixels[i + 1][j + 1] && b++, (0 === b || 4 === b) && (p += 3);
            return p;
        }
        function penaltyDarkLight(qr) {
            var i, j, pat, rc, p = 0, bad = 1488, badmask1 = 2047, badmask2 = badmask1 << 4, patmask = 32767;
            for (i = 0; i < qr.nModules - 1; i++) for (pat = [ 0, 0 ], j = 0; j < qr.nModules - 1; j++) for (rc = 0; 1 >= rc; rc++) pat[rc] = pat[rc] << 1 & patmask, 
            qr.pixels[rc * i + (1 - rc) * j][(1 - rc) * i + rc * j] && pat[rc]++, j >= 11 && ((pat[rc] & badmask1) === bad ? p += 40 : j < qr.nModules - 4 - 7 && (pat[rc] & badmask2) === bad && (p += 40));
            return p;
        }
        function penaltyDark(qr) {
            var i, j, dark = 0;
            for (i = 0; i < qr.nModules - 1; i++) for (j = 0; j < qr.nModules - 1; j++) qr.pixels[i][j] && dark++;
            return 10 * Math.floor(Math.abs(dark / (qr.nModule * qr.nModules) - .5) / .05);
        }
        var pAdjacent = penaltyAdjacent(this), pBlocks = penaltyBlocks(this), pDarkLight = penaltyDarkLight(this), pDark = penaltyDark(this), pTotal = pAdjacent + pBlocks + pDarkLight + pDark;
        return pTotal;
    },
    encodeBestMask: function() {
        var mask, i, j, penalty, bestMask = 0, bestPenalty = 999999;
        for (QRBase.setFunctionalPattern(this), mask = 0; 8 > mask; mask++) {
            for (i = 0; i < this.nModules; i++) for (j = 0; j < this.nModules; j++) this.pixels[i][j] = !1;
            this.encodeFunctionalPatterns(mask), this.encodeData(mask), penalty = this.calculatePenalty(mask), 
            bestPenalty > penalty && (bestPenalty = penalty, bestMask = mask);
        }
        if (this.mask = bestMask, 7 !== this.mask) {
            for (i = 0; i < this.nModules; i++) for (j = 0; j < this.nModules; j++) this.pixels[i][j] = !1;
            this.encodeFunctionalPatterns(this.mask), this.encodeData(this.mask);
        }
    },
    encodeFunctionalPatterns: function(mask) {
        function encodeFinderPattern(qr, x, y) {
            var i, j;
            for (i = 0; 5 >= i; i++) qr.pixels[x + i][y] = !0, qr.pixels[x + 6][y + i] = !0, 
            qr.pixels[x + 6 - i][y + 6] = !0, qr.pixels[x][y + 6 - i] = !0;
            for (i = 2; 4 >= i; i++) for (j = 2; 4 >= j; j++) qr.pixels[x + i][y + j] = !0;
        }
        function encodeVersionTopright(qr) {
            var x, y, pattern = QRBase.versionInfo[qr.version];
            for (y = 0; 6 > y; y++) for (x = qr.nModules - 11; x < qr.nModules - 11 + 3; x++) 1 & pattern && (qr.pixels[x][y] = !0), 
            pattern /= 2;
        }
        function encodeVersionBottomleft(qr) {
            var x, y, pattern = QRBase.versionInfo[qr.version];
            for (x = 0; 6 > x; x++) for (y = qr.nModules - 11; y < qr.nModules - 11 + 3; y++) 1 & pattern && (qr.pixels[x][y] = !0), 
            pattern /= 2;
        }
        function encodeTimingPattern(qr, horizontal) {
            var i;
            for (i = 8; i < qr.nModules - 8; i += 2) horizontal ? qr.pixels[i][6] = !0 : qr.pixels[6][i] = !0;
        }
        function encodeOneAlignmentPattern(qr, x, y) {
            var i;
            for (i = 0; 3 >= i; i++) qr.pixels[x + i][y] = !0, qr.pixels[x + 4][y + i] = !0, 
            qr.pixels[x + 4 - i][y + 4] = !0, qr.pixels[x][y + 4 - i] = !0;
            qr.pixels[x + 2][y + 2] = !0;
        }
        function encodeAlignmentPatterns(qr) {
            var i, j, n = QRBase.alignmentPatterns[qr.version].length;
            for (i = 0; n > i; i++) for (j = 0; n > j; j++) 0 === i && 0 === j || 0 === i && j === n - 1 || i === n - 1 && 0 === j || encodeOneAlignmentPattern(qr, QRBase.alignmentPatterns[qr.version][i] - 2, QRBase.alignmentPatterns[qr.version][j] - 2);
        }
        function encodeFormatNW(qr, code) {
            var y, x = 8;
            for (y = 0; 5 >= y; y++) 1 & code && (qr.pixels[x][y] = !0), code /= 2;
            for (1 & code && (qr.pixels[8][7] = !0), code /= 2, 1 & code && (qr.pixels[8][8] = !0), 
            code /= 2, 1 & code && (qr.pixels[7][8] = !0), code /= 2, y = 8, x = 5; x >= 0; x--) 1 & code && (qr.pixels[x][y] = !0), 
            code /= 2;
        }
        function encodeFormatNESW(qr, code) {
            var x, y = 8;
            for (x = qr.nModules - 1; x > qr.nModules - 1 - 8; x--) 1 & code && (qr.pixels[x][y] = !0), 
            code /= 2;
            for (x = 8, y = qr.nModules - 7; y < qr.nModules - 1; y++) 1 & code && (qr.pixels[x][y] = !0), 
            code /= 2;
        }
        encodeFinderPattern(this, 0, 0), encodeFinderPattern(this, 0, this.nModules - 7), 
        encodeFinderPattern(this, this.nModules - 7, 0), this.version >= 7 && (encodeVersionTopright(this), 
        encodeVersionBottomleft(this)), encodeTimingPattern(this, !0), encodeTimingPattern(this, !1), 
        this.version > 1 && encodeAlignmentPatterns(this);
        var code = QRBase.formatInfo[mask + 8 * this.ECLevel];
        encodeFormatNW(this, code), encodeFormatNESW(this, code);
    },
    encodeData: function(qrmask) {
        function setMasked(pixels, mask, j, i, f) {
            var m;
            switch (mask) {
              case 0:
                m = (i + j) % 2;
                break;

              case 1:
                m = i % 2;
                break;

              case 2:
                m = j % 3;
                break;

              case 3:
                m = (i + j) % 3;
                break;

              case 4:
                m = (Math.floor(i / 2) + Math.floor(j / 3)) % 2;
                break;

              case 5:
                m = i * j % 2 + i * j % 3;
                break;

              case 6:
                m = (i * j % 2 + i * j % 3) % 2;
                break;

              case 7:
                m = ((i + j) % 2 + i * j % 3) % 2;
            }
            0 === m ? pixels[j][i] = !f : pixels[j][i] = f;
        }
        var i, j, count, col, writingUp = !0, n = 0, v = this.bytes[n], bitsWritten = 0, mask = 128;
        for (j = this.nModules - 1; j > 0; j -= 2) {
            for (6 === j && j--, count = 0; count < this.nModules; count++) for (i = writingUp ? this.nModules - 1 - count : count, 
            col = 0; 2 > col; col++) this.functionalPattern[j - col][i] || (setMasked(this.pixels, qrmask, j - col, i, v & mask), 
            mask >>>= 1, bitsWritten++, 8 === bitsWritten && (bitsWritten = 0, mask = 128, n++, 
            v = this.bytes[n]));
            writingUp ^= !0;
        }
    },
    pixelsToImage: function() {
        var i, j;
        for (i = 0; i < this.nModules; i++) for (j = 0; j < this.nModules; j++) this.pixels[i][j] && this.setDark(i, j);
    },
    getDataCapacity: function(version, ECLevel, mode) {
        var nCodewords = QRBase.nCodewords[version], nECCodewords = QRBase.nECCodewords[version][ECLevel], nDataCodewords = nCodewords - nECCodewords, bits = 8 * nDataCodewords, cap = 0;
        return bits -= 4, bits -= QRBase.nCountBits(mode, version), mode === QRBase.MODE.AlphaNumeric ? (cap = 2 * Math.floor(bits / 11), 
        bits >= cap / 2 * 11 + 6 && cap++) : mode === QRBase.MODE.EightBit ? cap = Math.floor(bits / 8) : mode === QRBase.MODE.Numeric ? (cap = 3 * Math.floor(bits / 10), 
        bits >= cap / 3 * 10 + 4 && (bits >= cap / 3 * 10 + 7 && cap++, cap++)) : QRBase.errorThrow("Unsupported ECI mode: " + mode), 
        cap;
    },
    getVersionFromLength: function(ECLevel, mode, text) {
        var v, length = QRBase.unicodeToUtf8(text).length;
        for (v = 1; 40 >= v; v++) if (this.getDataCapacity(v, ECLevel, mode) >= length) return v;
        QRBase.errorThrow("Text is too long, even for a version 40 QR Code");
    },
    setDark: function(x, y) {
        this.image.setDark(x, y);
    },
    alphanumRev: {
        "0": 0,
        "1": 1,
        "2": 2,
        "3": 3,
        "4": 4,
        "5": 5,
        "6": 6,
        "7": 7,
        "8": 8,
        "9": 9,
        A: 10,
        B: 11,
        C: 12,
        D: 13,
        E: 14,
        F: 15,
        G: 16,
        H: 17,
        I: 18,
        J: 19,
        K: 20,
        L: 21,
        M: 22,
        N: 23,
        O: 24,
        P: 25,
        Q: 26,
        R: 27,
        S: 28,
        T: 29,
        U: 30,
        V: 31,
        W: 32,
        X: 33,
        Y: 34,
        Z: 35,
        " ": 36,
        $: 37,
        "%": 38,
        "*": 39,
        "+": 40,
        "-": 41,
        ".": 42,
        "/": 43,
        ":": 44
    }
}, function($, window, document, undefined) {
    $.qrcode = {
        config: {
            text: "Test",
            render: "canvas",
            bgColor: "#FFF",
            moduleColor: "#000",
            moduleSize: 5,
            mode: 4,
            ECLevel: 2,
            margin: 4,
            logo: "",
            error: function(msg) {
                alert(msg);
            }
        },
        Render: []
    };
    var QRCode = function(cfg, callback) {
        var self = this;
        return self.config = cfg, $.extend(self, {
            _init: function() {
                self.qr = new QREncode(), self.qr.setErrorThrow(function(msg) {
                    cfg.error(msg);
                }), cfg.logo && (cfg.ECLevel = 2), self.version = self.qr.getVersionFromLength(cfg.ECLevel, cfg.mode, cfg.text), 
                self.pixArr = self.qr.encodeToPix(cfg.mode, cfg.text, self.version, cfg.ECLevel), 
                $.qrcode.Render[cfg.render](self, callback);
            }
        }), self._init();
    };
    $.fn.qrcode = function(cfg) {
        var i, $self = $(this), length = $self.length, config = {};
        "string" == typeof cfg ? config.text = cfg : config = cfg, config = $.extend({}, $.qrcode.config, config), 
        new QRCode(config, function(qrdom) {
            var el, context;
            for (i = 0; length > i; i++) "table" === config.render ? el = qrdom.clone() : (el = qrdom.cloneNode(!0), 
            context = el.getContext("2d"), context.drawImage(qrdom, 0, 0)), $self.eq(i).empty().append(el);
        });
    };
}(jQuery, window, document), function($, window, document, undefined) {
    $.qrcode && ($.qrcode.Render.table = function(self, callback) {
        var $table, cfg = self.config, mSize = cfg.moduleSize, margin = cfg.margin * mSize, size = self.pixArr.length, outSize = 2 * cfg.margin + size, div = $('<div style="position: relative;"></div>'), i = 0, j = 0, style = "<style>.qrtable, .qrtable tr, .qrtable td{border: 0;border-collapse: collapse;}</style>", init = function() {
            for (var table = '<table class="qrtable">', i = 0, j = 0; size > i; i++) {
                for (j = 0, table += "<tr>"; size > j; j++) table += "<td></td>";
                table += "</td>";
            }
            table += "</table>", $table = $(table), $table.css({
                width: size * mSize,
                height: size * mSize
            });
        }, setBlock = function(i, j, color) {
            $table.find("tr:nth-child(" + (j + 1) + ")").find("td:nth-child(" + (i + 1) + ")").css("backgroundColor", color);
        }, renderLogo = function(callback) {
            var img = new Image();
            img.src = cfg.logo, img.onload = function() {
                var zoom, logo, imgW = img.width, imgH = img.height, imgSize = Math.max(imgW, imgH);
                imgSize > size * mSize * .3 && (zoom = size * mSize * .3 / imgSize, imgW *= zoom, 
                imgH *= zoom), logo = $('<img src="' + cfg.logo + '" height="' + imgH + '" width="' + imgW + '"/>'), 
                logo.css({
                    position: "absolute",
                    top: (outSize * mSize - imgH) / 2,
                    left: (outSize * mSize - imgW) / 2
                }), $.isFunction(callback) && callback(logo);
            };
        };
        for (init(); i < self.pixArr.length; i++) for (j = 0; j < self.pixArr.length; j++) self.pixArr[i][j] && setBlock(i, j, cfg.moduleColor);
        div.css({
            width: size * mSize,
            height: size * mSize,
            backgroundColor: cfg.bgcolor,
            padding: margin
        }).append(style, $table), cfg.logo ? renderLogo(function(logo) {
            div.append(logo), $.isFunction(callback) && callback(div);
        }) : $.isFunction(callback) && callback(div);
    });
}(jQuery, window, document), function($, window, document, undefined) {
    $.qrcode && ($.qrcode.Render.canvas = function(self, callback) {
        var cfg = self.config, i = cfg.margin, j = cfg.margin, dpx = cfg.retina ? 2 : 1, mSize = cfg.moduleSize * dpx, size = self.pixArr.length, outSize = 2 * cfg.margin + size, canvas = document.createElement("canvas"), ctx = canvas.getContext("2d"), getRGB = function(color) {
            var red, green, blue;
            if (0 === color.indexOf("#") && (color = color.substr(1)), 6 === color.length) red = color.substr(0, 2), 
            green = color.substr(2, 2), blue = color.substr(4, 2); else {
                if (3 !== color.length) throw "error color";
                red = color.substr(0, 1), red += red, green = color.substr(1, 1), green += green, 
                blue = color.substr(2, 1), blue += blue;
            }
            return "rgb(" + parseInt(red, 16) + ", " + parseInt(green, 16) + ", " + parseInt(blue, 16) + ")";
        }, init = function() {
            var size = 2 * cfg.margin + self.pixArr.length;
            canvas.width = size * mSize, canvas.height = size * mSize, $(canvas).css({
                width: size * cfg.moduleSize,
                height: size * cfg.moduleSize
            }), ctx.fillStyle = getRGB(cfg.bgColor), ctx.fillRect(0, 0, canvas.width, canvas.height);
        }, setBlock = function(i, j) {
            ctx.fillStyle = getRGB(cfg.moduleColor), ctx.fillRect(i * mSize, j * mSize, mSize, mSize);
        }, renderLogo = function(callback) {
            var img = new Image();
            img.src = cfg.logo, img.onload = function() {
                var zoom, imgW = img.width, imgH = img.height, imgSize = Math.max(imgW, imgH);
                imgSize > size * mSize * .3 && (zoom = size * mSize * .3 / imgSize, imgW *= zoom, 
                imgH *= zoom), ctx.drawImage(img, (outSize * mSize - imgW) / 2, (outSize * mSize - imgH) / 2, imgW, imgH), 
                $.isFunction(callback) && callback();
            };
        };
        for (init(); i < self.pixArr.length + cfg.margin; i++) for (j = cfg.margin; j < self.pixArr.length + cfg.margin; j++) self.pixArr[i - cfg.margin][j - cfg.margin] && setBlock(i, j, getRGB(cfg.moduleColor));
        cfg.logo ? renderLogo(function() {
            $.isFunction(callback) && callback(canvas);
        }) : $.isFunction(callback) && callback(canvas);
    });
}(jQuery, window, document);