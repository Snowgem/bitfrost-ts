"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitcoreBN = void 0;
const preconditions_1 = __importDefault(require("../util/preconditions"));
const _ = __importStar(require("lodash"));
const bn_js_1 = __importDefault(require("bn.js"));
const HEX_BASE = 16;
const DECIMAL_BASE = 10;
const NEGATIVE_128 = 0x80;
const POSITIVE_127 = 0x7f;
class BitcoreBN extends bn_js_1.default {
    constructor() {
        super(...arguments);
        this.toSMBigEndian = function () {
            let buf;
            if (this.cmp(BitcoreBN.Zero) === -1) {
                buf = this.neg().toBuffer();
                if (buf[0] & NEGATIVE_128) {
                    buf = Buffer.concat([Buffer.from([NEGATIVE_128]), buf]);
                }
                else {
                    buf[0] = buf[0] | NEGATIVE_128;
                }
            }
            else {
                buf = this.toBuffer();
                if (buf[0] & NEGATIVE_128) {
                    buf = Buffer.concat([Buffer.from([0x00]), buf]);
                }
            }
            if (buf.length === 1 && buf[0] === 0) {
                buf = Buffer.from([]);
            }
            return buf;
        };
    }
    static fromNumber(n) {
        preconditions_1.default.checkArgument(_.isNumber(n));
        return new BitcoreBN(n);
    }
    static fromString(str, base = 10) {
        preconditions_1.default.checkArgument(_.isString(str));
        return new BitcoreBN(str, base);
    }
    static fromBuffer(buf, opts) {
        if (typeof opts !== 'undefined' && opts.endian === 'little') {
            buf = reversebuf(buf);
        }
        const hex = buf.toString('hex');
        const bn = new BitcoreBN(hex, HEX_BASE);
        return bn;
    }
    static fromSM(buf, opts) {
        let ret;
        if (buf.length === 0) {
            return BitcoreBN.fromBuffer(Buffer.from([0]));
        }
        let endian = 'big';
        if (opts) {
            endian = opts.endian;
        }
        if (endian === 'little') {
            buf = reversebuf(buf);
        }
        if (buf[0] & NEGATIVE_128) {
            buf[0] = buf[0] & POSITIVE_127;
            ret = BitcoreBN.fromBuffer(buf);
            ret.neg().copy(ret);
        }
        else {
            ret = BitcoreBN.fromBuffer(buf);
        }
        return ret;
    }
    toNumber() {
        return parseInt(this.toString(DECIMAL_BASE), DECIMAL_BASE);
    }
    toBuffer(opts, length) {
        let buf;
        let hex;
        if (opts && typeof opts === 'object') {
            if (opts.size) {
                hex = this.toString(HEX_BASE, 2);
                const natlen = hex.length / 2;
                buf = Buffer.from(hex, 'hex');
                if (natlen === opts.size) {
                    buf = buf;
                }
                else if (natlen > opts.size) {
                    buf = BitcoreBN.trim(buf, natlen);
                }
                else if (natlen < opts.size) {
                    buf = BitcoreBN.pad(buf, natlen, opts.size);
                }
            }
            if (typeof opts !== 'undefined' && opts.endian === 'little') {
                buf = reversebuf(buf);
            }
        }
        else if (typeof opts === 'string') {
            buf = super.toBuffer(opts, length);
        }
        else {
            hex = this.toString(HEX_BASE, 2);
            buf = Buffer.from(hex, 'hex');
        }
        return buf;
    }
    toSM(opts) {
        const endian = opts ? opts.endian : 'big';
        let buf = this.toSMBigEndian();
        if (endian === 'little') {
            buf = reversebuf(buf);
        }
        return buf;
    }
    static fromScriptNumBuffer(buf, fRequireMinimal = false, size = 4) {
        const DEFAULT_SIZE = 4;
        const nMaxNumSize = size || DEFAULT_SIZE;
        preconditions_1.default.checkArgument(buf.length <= nMaxNumSize, new Error('script number overflow'));
        if (fRequireMinimal && buf.length > 0) {
            if ((buf[buf.length - 1] & POSITIVE_127) === 0) {
                const TWO = 2;
                const secondToLastIndex = buf.length - TWO;
                if (buf.length <= 1 || (buf[secondToLastIndex] & NEGATIVE_128) === 0) {
                    throw new Error('non-minimally encoded script number');
                }
            }
        }
        return BitcoreBN.fromSM(buf, {
            endian: 'little'
        });
    }
    toScriptNumBuffer() {
        return this.toSM({
            endian: 'little'
        });
    }
    gt(b) {
        return this.cmp(b) > 0;
    }
    gte(b) {
        return this.cmp(b) >= 0;
    }
    lt(b) {
        return this.cmp(b) < 0;
    }
    static trim(buf, natlen) {
        return buf.slice(natlen - buf.length, buf.length);
    }
    static pad(buf, natlen, size) {
        const rbuf = Buffer.alloc(size);
        for (let i = 0; i < buf.length; i++) {
            rbuf[rbuf.length - 1 - i] = buf[buf.length - 1 - i];
        }
        for (let i = 0; i < size - natlen; i++) {
            rbuf[i] = 0;
        }
        return rbuf;
    }
}
exports.BitcoreBN = BitcoreBN;
BitcoreBN.Zero = new BitcoreBN(0);
BitcoreBN.One = new BitcoreBN(1);
BitcoreBN.Minus1 = new BitcoreBN(-1);
function reversebuf(buf) {
    const buf2 = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i++) {
        buf2[i] = buf[buf.length - 1 - i];
    }
    return buf2;
}
//# sourceMappingURL=bn.js.map