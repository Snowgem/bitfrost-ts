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
exports.BufferReader = void 0;
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("../util/preconditions"));
const util_1 = require("../util");
const crypto_1 = require("../crypto");
class BufferReader {
    constructor(buf) {
        this.finished = this.eof;
        if (!(this instanceof BufferReader)) {
            return new BufferReader(buf);
        }
        if (_.isUndefined(buf)) {
            return;
        }
        if (Buffer.isBuffer(buf)) {
            this.set({
                buf
            });
        }
        else if (typeof buf === 'string') {
            this.set({
                buf: Buffer.from(buf, 'hex')
            });
        }
        else if (_.isObject(buf)) {
            const obj = buf;
            this.set(obj);
        }
        else {
            throw new TypeError('Unrecognized argument for BufferReader');
        }
    }
    set(obj) {
        this.buf = obj.buf || this.buf || undefined;
        this.pos = obj.pos || this.pos || 0;
        return this;
    }
    eof() {
        return this.pos >= this.buf.length;
    }
    read(len) {
        preconditions_1.default.checkArgument(!_.isUndefined(len), 'Must specify a length');
        const buf = this.buf.slice(this.pos, this.pos + len);
        this.pos = this.pos + len;
        return buf;
    }
    readAll() {
        const buf = this.buf.slice(this.pos, this.buf.length);
        this.pos = this.buf.length;
        return buf;
    }
    readUInt8() {
        const val = this.buf.readUInt8(this.pos);
        this.pos = this.pos + 1;
        return val;
    }
    readUInt16BE() {
        const val = this.buf.readUInt16BE(this.pos);
        this.pos = this.pos + 2;
        return val;
    }
    readUInt16LE() {
        const val = this.buf.readUInt16LE(this.pos);
        this.pos = this.pos + 2;
        return val;
    }
    readUInt32BE() {
        const val = this.buf.readUInt32BE(this.pos);
        this.pos = this.pos + 4;
        return val;
    }
    readUInt32LE() {
        const val = this.buf.readUInt32LE(this.pos);
        this.pos = this.pos + 4;
        return val;
    }
    readInt32LE() {
        const val = this.buf.readInt32LE(this.pos);
        this.pos = this.pos + 4;
        return val;
    }
    readUInt64BEBN() {
        const buf = this.buf.slice(this.pos, this.pos + 8);
        const bigNum = crypto_1.BitcoreBN.fromBuffer(buf);
        this.pos = this.pos + 8;
        return bigNum;
    }
    readUInt64LEBN() {
        const second = this.buf.readUInt32LE(this.pos);
        const first = this.buf.readUInt32LE(this.pos + 4);
        const combined = first * 0x100000000 + second;
        const MAX_SAFE_NUM = 0x1fffffffffffff;
        let bn;
        if (combined <= MAX_SAFE_NUM) {
            bn = new crypto_1.BitcoreBN(combined);
        }
        else {
            const data = Array.prototype.slice.call(this.buf, this.pos, this.pos + 8);
            const BASE_10 = 10;
            bn = new crypto_1.BitcoreBN(data, BASE_10, 'le');
        }
        this.pos = this.pos + 8;
        return bn;
    }
    readVarintNum() {
        const first = this.readUInt8();
        switch (first) {
            case 0xfd:
                return this.readUInt16LE();
            case 0xfe:
                return this.readUInt32LE();
            case 0xff:
                const bn = this.readUInt64LEBN();
                const n = bn.toNumber();
                if (n <= Math.pow(2, 53)) {
                    return n;
                }
                else {
                    throw new Error('number too large to retain precision - use readVarintBN');
                }
                break;
            default:
                return first;
        }
    }
    readVarLengthBuffer() {
        const len = this.readVarintNum();
        const buf = this.read(len);
        preconditions_1.default.checkState(buf.length === len, 'Invalid length while reading varlength buffer. ' +
            'Expected to read: ' +
            len +
            ' and read ' +
            buf.length);
        return buf;
    }
    readVarintBuf() {
        const first = this.buf.readUInt8(this.pos);
        switch (first) {
            case 0xfd:
                return this.read(1 + 2);
            case 0xfe:
                return this.read(1 + 4);
            case 0xff:
                return this.read(1 + 8);
            default:
                return this.read(1);
        }
    }
    readVarintBN() {
        const first = this.readUInt8();
        switch (first) {
            case 0xfd:
                return new crypto_1.BitcoreBN(this.readUInt16LE());
            case 0xfe:
                return new crypto_1.BitcoreBN(this.readUInt32LE());
            case 0xff:
                return this.readUInt64LEBN();
            default:
                return new crypto_1.BitcoreBN(first);
        }
    }
    reverse() {
        const buf = Buffer.alloc(this.buf.length);
        for (let i = 0; i < buf.length; i++) {
            buf[i] = this.buf[this.buf.length - 1 - i];
        }
        this.buf = buf;
        return this;
    }
    readReverse(len) {
        if (_.isUndefined(len)) {
            len = this.buf.length;
        }
        const buf = this.buf.slice(this.pos, this.pos + len);
        this.pos = this.pos + len;
        return util_1.BufferUtil.reverse(buf);
    }
}
exports.BufferReader = BufferReader;
//# sourceMappingURL=bufferreader.js.map