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
exports.Hash = void 0;
const preconditions_1 = __importDefault(require("../util/preconditions"));
const crypto = __importStar(require("crypto"));
const util_1 = require("../util");
const BlockSizes = {
    sha1: 512,
    sha512: 1024,
    sha256: 512
};
class Hash {
    static sha1(buf) {
        preconditions_1.default.checkArgument(util_1.BufferUtil.isBuffer(buf));
        return crypto
            .createHash('sha1')
            .update(buf)
            .digest();
    }
    static sha256(buf) {
        preconditions_1.default.checkArgument(util_1.BufferUtil.isBuffer(buf));
        return crypto
            .createHash('sha256')
            .update(buf)
            .digest();
    }
    static sha256sha256(buf) {
        preconditions_1.default.checkArgument(util_1.BufferUtil.isBuffer(buf));
        return Hash.sha256(Hash.sha256(buf));
    }
    static ripemd160(buf) {
        preconditions_1.default.checkArgument(util_1.BufferUtil.isBuffer(buf));
        return crypto
            .createHash('ripemd160')
            .update(buf)
            .digest();
    }
    static sha256ripemd160(buf) {
        preconditions_1.default.checkArgument(util_1.BufferUtil.isBuffer(buf));
        return Hash.ripemd160(Hash.sha256(buf));
    }
    static sha512(buf) {
        preconditions_1.default.checkArgument(util_1.BufferUtil.isBuffer(buf));
        return crypto
            .createHash('sha512')
            .update(buf)
            .digest();
    }
    static hmac(hashFnName, data, key) {
        preconditions_1.default.checkArgument(util_1.BufferUtil.isBuffer(data));
        preconditions_1.default.checkArgument(util_1.BufferUtil.isBuffer(key));
        const hashFnBlockSize = BlockSizes[hashFnName];
        const hashf = Hash[hashFnName];
        preconditions_1.default.checkArgument(hashFnBlockSize);
        const blocksize = hashFnBlockSize / 8;
        if (key.length > blocksize) {
            key = hashf(key);
        }
        else if (key.length < blocksize) {
            const fill = Buffer.alloc(blocksize);
            fill.fill(0);
            key.copy(fill);
            key = fill;
        }
        const o_key = Buffer.alloc(blocksize);
        o_key.fill(0x5c);
        const i_key = Buffer.alloc(blocksize);
        i_key.fill(0x36);
        const o_key_pad = Buffer.alloc(blocksize);
        const i_key_pad = Buffer.alloc(blocksize);
        for (let i = 0; i < blocksize; i++) {
            o_key_pad[i] = o_key[i] ^ key[i];
            i_key_pad[i] = i_key[i] ^ key[i];
        }
        return hashf(Buffer.concat([o_key_pad, hashf(Buffer.concat([i_key_pad, data]))]));
    }
    static sha256hmac(data, key) {
        return Hash.hmac('sha256', data, key);
    }
    static sha512hmac(data, key) {
        return Hash.hmac('sha512', data, key);
    }
}
exports.Hash = Hash;
//# sourceMappingURL=hash.js.map