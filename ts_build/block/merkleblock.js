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
exports.MerkleBlock = void 0;
const _ = __importStar(require("lodash"));
const blockheader_1 = require("./blockheader");
const buffer_1 = require("../util/buffer");
const bufferreader_1 = require("../encoding/bufferreader");
const bufferwriter_1 = require("../encoding/bufferwriter");
const hash_1 = require("../crypto/hash");
const transaction_1 = require("../transaction");
const errors_1 = require("../errors");
const preconditions_1 = __importDefault(require("../util/preconditions"));
const spec_1 = require("../errors/spec");
class MerkleBlock {
    constructor(arg) {
        this.toJSON = this.toObject;
        if (!(this instanceof MerkleBlock)) {
            return new MerkleBlock(arg);
        }
        var info = {};
        if (buffer_1.BufferUtil.isBuffer(arg)) {
            info = MerkleBlock._fromBufferReader(new bufferreader_1.BufferReader(arg));
        }
        else if (_.isObject(arg)) {
            arg = arg;
            var header;
            if (arg.header instanceof blockheader_1.BlockHeader) {
                header = arg.header;
            }
            else {
                header = blockheader_1.BlockHeader.fromObject(arg.header);
            }
            info = {
                header: header,
                numTransactions: arg.numTransactions,
                hashes: arg.hashes,
                flags: arg.flags
            };
        }
        else {
            throw new TypeError('Unrecognized argument for MerkleBlock');
        }
        _.extend(this, info);
        this._flagBitsUsed = 0;
        this._hashesUsed = 0;
        return this;
    }
    static fromBuffer(buf) {
        return MerkleBlock.fromBufferReader(new bufferreader_1.BufferReader(buf));
    }
    ;
    static fromBufferReader(br) {
        return new MerkleBlock(MerkleBlock._fromBufferReader(br));
    }
    ;
    toBuffer() {
        return this.toBufferWriter().concat();
    }
    ;
    toBufferWriter(bw) {
        if (!bw) {
            bw = new bufferwriter_1.BufferWriter();
        }
        bw.write(this.header.toBuffer());
        bw.writeUInt32LE(this.numTransactions);
        bw.writeVarintNum(this.hashes.length);
        for (var i = 0; i < this.hashes.length; i++) {
            bw.write(new Buffer(this.hashes[i], 'hex'));
        }
        bw.writeVarintNum(this.flags.length);
        for (i = 0; i < this.flags.length; i++) {
            bw.writeUInt8(this.flags[i]);
        }
        return bw;
    }
    ;
    toObject() {
        return {
            header: this.header.toObject(),
            numTransactions: this.numTransactions,
            hashes: this.hashes,
            flags: this.flags
        };
    }
    ;
    validMerkleTree() {
        preconditions_1.default.checkState(_.isArray(this.flags), 'MerkleBlock flags is not an array');
        preconditions_1.default.checkState(_.isArray(this.hashes), 'MerkleBlock hashes is not an array');
        if (this.hashes.length > this.numTransactions) {
            return false;
        }
        if (this.flags.length * 8 < this.hashes.length) {
            return false;
        }
        var height = this._calcTreeHeight();
        var opts = { hashesUsed: 0, flagBitsUsed: 0 };
        var root = this._traverseMerkleTree(height, 0, opts);
        if (opts.hashesUsed !== this.hashes.length) {
            return false;
        }
        return buffer_1.BufferUtil.equals(root, this.header.merkleRoot);
    }
    ;
    filterdTxsHash() {
        preconditions_1.default.checkState(_.isArray(this.flags), 'MerkleBlock flags is not an array');
        preconditions_1.default.checkState(_.isArray(this.hashes), 'MerkleBlock hashes is not an array');
        if (this.hashes.length > this.numTransactions) {
            throw new errors_1.BitcoreError(spec_1.ERROR_TYPES.MerkleBlock.errors.InvalidMerkleTree);
        }
        if (this.flags.length * 8 < this.hashes.length) {
            throw new errors_1.BitcoreError(spec_1.ERROR_TYPES.MerkleBlock.errors.InvalidMerkleTree);
        }
        if (this.hashes.length === 1) {
            return [];
        }
        ;
        var height = this._calcTreeHeight();
        var opts = { hashesUsed: 0, flagBitsUsed: 0 };
        var txs = this._traverseMerkleTree(height, 0, opts, true);
        if (opts.hashesUsed !== this.hashes.length) {
            throw new errors_1.BitcoreError(spec_1.ERROR_TYPES.MerkleBlock.errors.InvalidMerkleTree);
        }
        return txs;
    }
    ;
    _traverseMerkleTree(depth, pos, opts, checkForTxs = false) {
        opts = opts || {};
        opts.txs = opts.txs || [];
        opts.flagBitsUsed = opts.flagBitsUsed || 0;
        opts.hashesUsed = opts.hashesUsed || 0;
        var checkForTxs = checkForTxs || false;
        if (opts.flagBitsUsed > this.flags.length * 8) {
            return null;
        }
        var isParentOfMatch = (this.flags[opts.flagBitsUsed >> 3] >>> (opts.flagBitsUsed++ & 7)) & 1;
        if (depth === 0 || !isParentOfMatch) {
            if (opts.hashesUsed >= this.hashes.length) {
                return null;
            }
            var hash = this.hashes[opts.hashesUsed++];
            if (depth === 0 && isParentOfMatch) {
                opts.txs.push(hash);
            }
            return new Buffer(hash, 'hex');
        }
        else {
            var left = this._traverseMerkleTree(depth - 1, pos * 2, opts);
            var right = left;
            if (pos * 2 + 1 < this._calcTreeWidth(depth - 1)) {
                right = this._traverseMerkleTree(depth - 1, pos * 2 + 1, opts);
            }
            if (checkForTxs) {
                return opts.txs;
            }
            else {
                return hash_1.Hash.sha256sha256(Buffer.concat([left, right]));
            }
            ;
        }
    }
    ;
    _calcTreeWidth(height) {
        return (this.numTransactions + (1 << height) - 1) >> height;
    }
    ;
    _calcTreeHeight() {
        var height = 0;
        while (this._calcTreeWidth(height) > 1) {
            height++;
        }
        return height;
    }
    ;
    hasTransaction(tx) {
        preconditions_1.default.checkArgument(!_.isUndefined(tx), 'tx cannot be undefined');
        preconditions_1.default.checkArgument(tx instanceof transaction_1.Transaction || typeof tx === 'string', 'Invalid tx given, tx must be a "string" or "Transaction"');
        var hash = tx;
        if (tx instanceof transaction_1.Transaction) {
            hash = buffer_1.BufferUtil.reverse(new Buffer(tx.id, 'hex')).toString('hex');
        }
        var txs = [];
        var height = this._calcTreeHeight();
        this._traverseMerkleTree(height, 0, { txs: txs });
        return txs.indexOf(hash) !== -1;
    }
    ;
    static _fromBufferReader(br) {
        preconditions_1.default.checkState(!br.finished(), 'No merkleblock data received');
        const info = {};
        info.header = blockheader_1.BlockHeader.fromBufferReader(br);
        info.numTransactions = br.readUInt32LE();
        var numHashes = br.readVarintNum();
        info.hashes = [];
        for (var i = 0; i < numHashes; i++) {
            info.hashes.push(br.read(32).toString('hex'));
        }
        var numFlags = br.readVarintNum();
        info.flags = [];
        for (i = 0; i < numFlags; i++) {
            info.flags.push(br.readUInt8());
        }
        return info;
    }
    ;
}
exports.MerkleBlock = MerkleBlock;
MerkleBlock.fromObject = function fromObject(obj) {
    return new MerkleBlock(obj);
};
//# sourceMappingURL=merkleblock.js.map