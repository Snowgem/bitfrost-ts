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
exports.Signature = void 0;
const _ = __importStar(require("lodash"));
const bn_js_1 = __importDefault(require("bn.js"));
const preconditions_1 = __importDefault(require("../util/preconditions"));
const _1 = require(".");
const util_1 = require("../util");
class Signature {
    constructor(r, s) {
        this.toDER = this.toBuffer;
        if (!(this instanceof Signature)) {
            return new Signature(r, s);
        }
        if (r instanceof _1.BitcoreBN || r instanceof bn_js_1.default) {
            this.set({
                r,
                s
            });
        }
        else if (r) {
            const obj = r;
            this.set(obj);
        }
    }
    set(obj) {
        this.r = new _1.BitcoreBN(obj.r || this.r || undefined);
        this.s = new _1.BitcoreBN(obj.s || this.s || undefined);
        this.i = typeof obj.i !== 'undefined' ? obj.i : this.i;
        this.compressed =
            typeof obj.compressed !== 'undefined' ? obj.compressed : this.compressed;
        this.nhashtype = obj.nhashtype || this.nhashtype || undefined;
        return this;
    }
    static fromCompact(buf) {
        preconditions_1.default.checkArgument(util_1.BufferUtil.isBuffer(buf), 'Argument is expected to be a Buffer');
        const sig = new Signature();
        let compressed = true;
        let i = buf.slice(0, 1)[0] - 27 - 4;
        if (i < 0) {
            compressed = false;
            i = i + 4;
        }
        const b2 = buf.slice(1, 33);
        const b3 = buf.slice(33, 65);
        preconditions_1.default.checkArgument(i === 0 || i === 1 || i === 2 || i === 3, new Error('i must be 0, 1, 2, or 3'));
        preconditions_1.default.checkArgument(b2.length === 32, new Error('r must be 32 bytes'));
        preconditions_1.default.checkArgument(b3.length === 32, new Error('s must be 32 bytes'));
        sig.compressed = compressed;
        sig.i = i;
        sig.r = _1.BitcoreBN.fromBuffer(b2);
        sig.s = _1.BitcoreBN.fromBuffer(b3);
        return sig;
    }
    static fromBuffer(buf, strict) {
        const obj = Signature.parseDER(buf, strict);
        const sig = new Signature();
        sig.r = obj.r;
        sig.s = obj.s;
        return sig;
    }
    static fromTxFormat(buf) {
        const nhashtype = buf.readUInt8(buf.length - 1);
        const derbuf = buf.slice(0, buf.length - 1);
        const sig = Signature.fromDER(derbuf, false);
        sig.nhashtype = nhashtype;
        return sig;
    }
    static fromString(str) {
        const buf = Buffer.from(str, 'hex');
        return Signature.fromDER(buf);
    }
    static parseDER(buf, strict = true) {
        preconditions_1.default.checkArgument(util_1.BufferUtil.isBuffer(buf), new Error('DER formatted signature should be a buffer'));
        if (_.isUndefined(strict)) {
            strict = true;
        }
        const header = buf[0];
        preconditions_1.default.checkArgument(header === 0x30, new Error('Header byte should be 0x30'));
        let length = buf[1];
        const buflength = buf.slice(2).length;
        preconditions_1.default.checkArgument(!strict || length === buflength, new Error('Length byte should length of what follows'));
        length = length < buflength ? length : buflength;
        const rheader = buf[2 + 0];
        preconditions_1.default.checkArgument(rheader === 0x02, new Error('Integer byte for r should be 0x02'));
        const rlength = buf[2 + 1];
        const rbuf = buf.slice(2 + 2, 2 + 2 + rlength);
        const r = _1.BitcoreBN.fromBuffer(rbuf);
        const rneg = buf[2 + 1 + 1] === 0x00 ? true : false;
        preconditions_1.default.checkArgument(rlength === rbuf.length, new Error('Length of r incorrect'));
        const sheader = buf[2 + 2 + rlength + 0];
        preconditions_1.default.checkArgument(sheader === 0x02, new Error('Integer byte for s should be 0x02'));
        const slength = buf[2 + 2 + rlength + 1];
        const sbuf = buf.slice(2 + 2 + rlength + 2, 2 + 2 + rlength + 2 + slength);
        const s = _1.BitcoreBN.fromBuffer(sbuf);
        const sneg = buf[2 + 2 + rlength + 2 + 2] === 0x00 ? true : false;
        preconditions_1.default.checkArgument(slength === sbuf.length, new Error('Length of s incorrect'));
        const sumlength = 2 + 2 + rlength + 2 + slength;
        preconditions_1.default.checkArgument(length === sumlength - 2, new Error('Length of signature incorrect'));
        const obj = {
            header,
            length,
            rheader,
            rlength,
            rneg,
            rbuf,
            r,
            sheader,
            slength,
            sneg,
            sbuf,
            s
        };
        return obj;
    }
    toCompact(i, compressed) {
        i = typeof i === 'number' ? i : this.i;
        compressed = typeof compressed === 'boolean' ? compressed : this.compressed;
        if (!(i === 0 || i === 1 || i === 2 || i === 3)) {
            throw new Error('i must be equal to 0, 1, 2, or 3');
        }
        let val = i + 27 + 4;
        if (compressed === false) {
            val = val - 4;
        }
        const b1 = Buffer.from([val]);
        const b2 = new _1.BitcoreBN(this.r).toBuffer({
            size: 32
        });
        const b3 = new _1.BitcoreBN(this.s).toBuffer({
            size: 32
        });
        return Buffer.concat([b1, b2, b3]);
    }
    toBuffer() {
        const rnbuf = this.r.toBuffer();
        const snbuf = this.s.toBuffer();
        const rneg = rnbuf[0] & 0x80 ? true : false;
        const sneg = snbuf[0] & 0x80 ? true : false;
        const rbuf = rneg ? Buffer.concat([Buffer.from([0x00]), rnbuf]) : rnbuf;
        const sbuf = sneg ? Buffer.concat([Buffer.from([0x00]), snbuf]) : snbuf;
        const rlength = rbuf.length;
        const slength = sbuf.length;
        const length = 2 + rlength + 2 + slength;
        const rheader = 0x02;
        const sheader = 0x02;
        const header = 0x30;
        const der = Buffer.concat([
            Buffer.from([header, length, rheader, rlength]),
            rbuf,
            Buffer.from([sheader, slength]),
            sbuf
        ]);
        return der;
    }
    toString() {
        const buf = this.toDER();
        return buf.toString('hex');
    }
    static isTxDER(buf) {
        if (buf.length < 9) {
            return false;
        }
        if (buf.length > 73) {
            return false;
        }
        if (buf[0] !== 0x30) {
            return false;
        }
        if (buf[1] !== buf.length - 3) {
            return false;
        }
        const nLenR = buf[3];
        if (5 + nLenR >= buf.length) {
            return false;
        }
        const nLenS = buf[5 + nLenR];
        if (nLenR + nLenS + 7 !== buf.length) {
            return false;
        }
        const R = buf.slice(4);
        if (buf[4 - 2] !== 0x02) {
            return false;
        }
        if (nLenR === 0) {
            return false;
        }
        if (R[0] & 0x80) {
            return false;
        }
        if (nLenR > 1 && R[0] === 0x00 && !(R[1] & 0x80)) {
            return false;
        }
        const S = buf.slice(6 + nLenR);
        if (buf[6 + nLenR - 2] !== 0x02) {
            return false;
        }
        if (nLenS === 0) {
            return false;
        }
        if (S[0] & 0x80) {
            return false;
        }
        if (nLenS > 1 && S[0] === 0x00 && !(S[1] & 0x80)) {
            return false;
        }
        return true;
    }
    hasLowS() {
        if (this.s.lt(new _1.BitcoreBN(1)) ||
            this.s.gt(new _1.BitcoreBN('7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', 'hex'))) {
            return false;
        }
        return true;
    }
    hasDefinedHashtype() {
        if (!util_1.JSUtil.isNaturalNumber(this.nhashtype)) {
            return false;
        }
        const temp = this.nhashtype & ~Signature.SIGHASH_ANYONECANPAY;
        if (temp < Signature.SIGHASH_ALL || temp > Signature.SIGHASH_SINGLE) {
            return false;
        }
        return true;
    }
    toTxFormat() {
        const derbuf = this.toDER();
        const buf = Buffer.alloc(1);
        buf.writeUInt8(this.nhashtype, 0);
        return Buffer.concat([derbuf, buf]);
    }
}
exports.Signature = Signature;
Signature.fromDER = Signature.fromBuffer;
Signature.SIGHASH_ALL = 0x01;
Signature.SIGHASH_NONE = 0x02;
Signature.SIGHASH_SINGLE = 0x03;
Signature.SIGHASH_ANYONECANPAY = 0x80;
//# sourceMappingURL=signature.js.map