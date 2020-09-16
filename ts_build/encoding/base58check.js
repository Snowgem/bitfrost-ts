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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base58Check = void 0;
const _ = __importStar(require("lodash"));
const base58_1 = require("./base58");
const buffer_1 = require("buffer");
const buffer_2 = require("../util/buffer");
const hash_1 = require("../crypto/hash");
class Base58Check {
    constructor(obj) {
        if (!(this instanceof Base58Check)) {
            return new Base58Check(obj);
        }
        if (buffer_1.Buffer.isBuffer(obj)) {
            const buf = obj;
            this.fromBuffer(buf);
        }
        else if (typeof obj === 'string') {
            const str = obj;
            this.fromString(str);
        }
        else if (obj) {
            this.set(obj);
        }
    }
    set(obj) {
        this.buf = obj.buf || this.buf || undefined;
        return this;
    }
    static validChecksum(data, checksum) {
        let newData = buffer_2.BufferUtil.toBufferIfString(data);
        let newChecksum = buffer_2.BufferUtil.toBufferIfString(checksum);
        if (_.isString(data)) {
            newData = new buffer_1.Buffer(base58_1.Base58.decode(data));
        }
        if (_.isString(checksum)) {
            newChecksum = new buffer_1.Buffer(base58_1.Base58.decode(checksum));
        }
        if (!checksum) {
            newChecksum = data.slice(-4);
            newData = data.slice(0, -4);
        }
        return (Base58Check.checksum(newData).toString('hex') ===
            newChecksum.toString('hex'));
    }
    static decode(s) {
        if (typeof s !== 'string') {
            throw new Error('Input must be a string');
        }
        const buf = buffer_1.Buffer.from(base58_1.Base58.decode(s));
        if (buf.length < 4) {
            throw new Error('Input string too short');
        }
        const data = buf.slice(0, -4);
        const csum = buf.slice(-4);
        const hash = hash_1.Hash.sha256sha256(data);
        const hash4 = hash.slice(0, 4);
        if (csum.toString('hex') !== hash4.toString('hex')) {
            throw new Error('Checksum mismatch');
        }
        return data;
    }
    static checksum(buffer) {
        return hash_1.Hash.sha256sha256(buffer).slice(0, 4);
    }
    static encode(buf) {
        if (!buffer_1.Buffer.isBuffer(buf)) {
            throw new Error('Input must be a buffer');
        }
        const checkedBuf = buffer_1.Buffer.alloc(buf.length + 4);
        const hash = Base58Check.checksum(buf);
        buf.copy(checkedBuf);
        hash.copy(checkedBuf, buf.length);
        return base58_1.Base58.encode(checkedBuf);
    }
    fromBuffer(buf) {
        this.buf = buf;
        return this;
    }
    fromString(str) {
        const buf = Base58Check.decode(str);
        this.buf = buf;
        return this;
    }
    toBuffer() {
        return this.buf;
    }
    toString() {
        return Base58Check.encode(this.buf);
    }
}
exports.Base58Check = Base58Check;
//# sourceMappingURL=base58check.js.map