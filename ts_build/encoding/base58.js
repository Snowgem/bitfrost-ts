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
exports.Base58 = void 0;
const _ = __importStar(require("lodash"));
const bs58 = __importStar(require("bs58"));
const buffer_1 = require("buffer");
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.split('');
class Base58 {
    constructor(obj) {
        if (!(this instanceof Base58)) {
            return new Base58(obj);
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
    static validCharacters(chars) {
        if (buffer_1.Buffer.isBuffer(chars)) {
            chars = chars.toString();
        }
        return _.every(_.map(chars, char => _.includes(ALPHABET, char)));
    }
    set(obj) {
        this.buf = obj.buf || this.buf || undefined;
        return this;
    }
    static encode(buf) {
        if (!buffer_1.Buffer.isBuffer(buf)) {
            throw new Error('Input should be a buffer');
        }
        return bs58.encode(buf);
    }
    static decode(str) {
        if (typeof str !== 'string') {
            throw new Error('Input should be a string');
        }
        return buffer_1.Buffer.from(bs58.decode(str));
    }
    fromBuffer(buf) {
        this.buf = buf;
        return this;
    }
    fromString(str) {
        const buf = Base58.decode(str);
        this.buf = buf;
        return this;
    }
    toBuffer() {
        return this.buf;
    }
    toString() {
        return Base58.encode(this.buf);
    }
}
exports.Base58 = Base58;
//# sourceMappingURL=base58.js.map