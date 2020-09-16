'use strict';
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
exports.BlockHeader = void 0;
const _ = __importStar(require("lodash"));
const buffer_1 = require("../util/buffer");
const bufferreader_1 = require("../encoding/bufferreader");
const bufferwriter_1 = require("../encoding/bufferwriter");
const hash_1 = require("../crypto/hash");
const preconditions_1 = __importDefault(require("../util/preconditions"));
const bn_js_1 = __importDefault(require("bn.js"));
const GENESIS_BITS = 0x1f07ffff;
class BlockHeader {
    constructor(arg) {
        this.toJSON = this.toObject;
        this.validTimestamp = function validTimestamp() {
            var currentTime = Math.round(new Date().getTime() / 1000);
            if (this.time > currentTime + BlockHeader.Constants.MAX_TIME_OFFSET) {
                return false;
            }
            return true;
        };
        this.validProofOfWork = function validProofOfWork() {
            var pow = new bn_js_1.default(this.id, 'hex');
            var target = this.getTargetDifficulty();
            if (pow.cmp(target) > 0) {
                return false;
            }
            return true;
        };
        if (!(this instanceof BlockHeader)) {
            return new BlockHeader(arg);
        }
        var info = BlockHeader._from(arg);
        this.version = info.version;
        this.prevHash = info.prevHash;
        this.merkleRoot = info.merkleRoot;
        this.reserved = info.reserved;
        this.time = info.time;
        this.timestamp = info.time;
        this.bits = info.bits;
        this.nonce = info.nonce;
        this.solution = info.solution;
        if (info.hash) {
            preconditions_1.default.checkState(this.hash === info.hash, 'Argument object hash property does not match block hash.');
        }
        return this;
    }
    ;
    static _from(arg) {
        let info = {};
        if (buffer_1.BufferUtil.isBuffer(arg)) {
            info = BlockHeader._fromBufferReader(new bufferreader_1.BufferReader(arg));
        }
        else if (_.isObject(arg)) {
            info = BlockHeader._fromObject(arg);
        }
        else {
            throw new TypeError('Unrecognized argument for BlockHeader');
        }
        return info;
    }
    ;
    static _fromObject(data) {
        preconditions_1.default.checkArgument(data, 'data is required');
        var prevHash = data.prevHash;
        var merkleRoot = data.merkleRoot;
        var reserved = data.reserved;
        var nonce = data.nonce;
        var solution = data.solution;
        if (_.isString(data.prevHash)) {
            prevHash = buffer_1.BufferUtil.reverse(new Buffer(data.prevHash, 'hex'));
        }
        if (_.isString(data.merkleRoot)) {
            merkleRoot = buffer_1.BufferUtil.reverse(new Buffer(data.merkleRoot, 'hex'));
        }
        if (_.isString(data.reserved)) {
            reserved = buffer_1.BufferUtil.reverse(new Buffer(data.reserved, 'hex'));
        }
        if (_.isString(data.nonce)) {
            nonce = buffer_1.BufferUtil.reverse(new Buffer(data.nonce, 'hex'));
        }
        if (_.isString(data.solution)) {
            solution = new Buffer(data.solution, 'hex');
        }
        var info = {
            hash: data.hash,
            version: data.version,
            prevHash: prevHash,
            merkleRoot: merkleRoot,
            reserved: reserved,
            time: data.time,
            timestamp: data.time,
            bits: data.bits,
            nonce: nonce,
            solution: solution
        };
        return info;
    }
    ;
    static fromObject(obj) {
        var info = BlockHeader._fromObject(obj);
        return new BlockHeader(info);
    }
    ;
    static fromRawBlock(data) {
        if (!buffer_1.BufferUtil.isBuffer(data)) {
            data = new Buffer(data, 'binary');
        }
        var br = new bufferreader_1.BufferReader(data);
        br.pos = BlockHeader.Constants.START_OF_HEADER;
        var info = BlockHeader._fromBufferReader(br);
        return new BlockHeader(info);
    }
    ;
    static fromBuffer(buf) {
        var info = BlockHeader._fromBufferReader(new bufferreader_1.BufferReader(buf));
        return new BlockHeader(info);
    }
    ;
    static fromString(str) {
        var buf = new Buffer(str, 'hex');
        return BlockHeader.fromBuffer(buf);
    }
    ;
    static _fromBufferReader(br) {
        const info = {};
        info.version = br.readInt32LE();
        info.prevHash = br.read(32);
        info.merkleRoot = br.read(32);
        info.reserved = br.read(32);
        info.time = br.readUInt32LE();
        info.bits = br.readUInt32LE();
        info.nonce = br.read(32);
        var lenSolution = br.readVarintNum();
        info.solution = br.read(lenSolution);
        return info;
    }
    ;
    static fromBufferReader(br) {
        var info = BlockHeader._fromBufferReader(br);
        return new BlockHeader(info);
    }
    ;
    toObject() {
        return {
            hash: this.hash,
            version: this.version,
            prevHash: buffer_1.BufferUtil.reverse(this.prevHash).toString('hex'),
            merkleRoot: buffer_1.BufferUtil.reverse(this.merkleRoot).toString('hex'),
            reserved: buffer_1.BufferUtil.reverse(this.reserved).toString('hex'),
            time: this.time,
            bits: this.bits,
            nonce: buffer_1.BufferUtil.reverse(this.nonce).toString('hex'),
            solution: this.solution.toString('hex')
        };
    }
    ;
    toBuffer() {
        return this.toBufferWriter().concat();
    }
    ;
    toString() {
        return this.toBuffer().toString('hex');
    }
    ;
    toBufferWriter(bw) {
        if (!bw) {
            bw = new bufferwriter_1.BufferWriter();
        }
        bw.writeInt32LE(this.version);
        bw.write(this.prevHash);
        bw.write(this.merkleRoot);
        bw.write(this.reserved);
        bw.writeUInt32LE(this.time);
        bw.writeUInt32LE(this.bits);
        bw.write(this.nonce);
        bw.writeVarintNum(this.solution.length);
        bw.write(this.solution);
        return bw;
    }
    ;
    getTargetDifficulty(bits) {
        bits = bits || this.bits;
        var target = new bn_js_1.default(bits & 0xffffff);
        var mov = 8 * ((bits >>> 24) - 3);
        while (mov-- > 0) {
            target = target.mul(new bn_js_1.default(2));
        }
        return target;
    }
    ;
    getDifficulty() {
        var difficulty1TargetBN = this.getTargetDifficulty(GENESIS_BITS).mul(new bn_js_1.default(Math.pow(10, 8)));
        var currentTargetBN = this.getTargetDifficulty();
        var difficultyString = difficulty1TargetBN.div(currentTargetBN).toString(10);
        var decimalPos = difficultyString.length - 8;
        difficultyString = difficultyString.slice(0, decimalPos) + '.' + difficultyString.slice(decimalPos);
        return parseFloat(difficultyString);
    }
    ;
    _getHash() {
        const buf = this.toBuffer();
        return hash_1.Hash.sha256sha256(buf);
    }
    _getId() {
        if (!this._id) {
            this._id = new bufferreader_1.BufferReader(this._getHash())
                .readReverse()
                .toString('hex');
        }
        return this._id;
    }
    get id() {
        return this._getId();
    }
    get hash() {
        return this._getId();
    }
    inspect() {
        return '<BlockHeader ' + this.id + '>';
    }
}
exports.BlockHeader = BlockHeader;
BlockHeader.Constants = {
    START_OF_HEADER: 8,
    MAX_TIME_OFFSET: 2 * 60 * 60,
    LARGEST_HASH: new bn_js_1.default('10000000000000000000000000000000000000000000000000000000000000000', 'hex')
};
//# sourceMappingURL=blockheader.js.map