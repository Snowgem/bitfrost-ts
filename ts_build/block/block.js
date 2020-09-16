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
exports.Block = void 0;
const _ = __importStar(require("lodash"));
const blockheader_1 = require("./blockheader");
const bn_1 = require("../crypto/bn");
const buffer_1 = require("../util/buffer");
const bufferreader_1 = require("../encoding/bufferreader");
const bufferwriter_1 = require("../encoding/bufferwriter");
const hash_1 = require("../crypto/hash");
const transaction_1 = require("../transaction");
const $ = require('../util/preconditions');
class Block {
    constructor(arg) {
        this.toObject = function toObject() {
            var transactions = [];
            this.transactions.forEach(function (tx) {
                transactions.push(tx.toObject());
            });
            return {
                header: this.header.toObject(),
                transactions: transactions
            };
        };
        this.toJSON = this.toObject;
        this.toBuffer = function toBuffer() {
            return this.toBufferWriter().concat();
        };
        this.toString = function toString() {
            return this.toBuffer().toString('hex');
        };
        this.toBufferWriter = function toBufferWriter(bw) {
            if (!bw) {
                bw = new bufferwriter_1.BufferWriter();
            }
            bw.write(this.header.toBuffer());
            bw.writeVarintNum(this.transactions.length);
            for (var i = 0; i < this.transactions.length; i++) {
                this.transactions[i].toBufferWriter(bw);
            }
            return bw;
        };
        this.getTransactionHashes = function getTransactionHashes() {
            var hashes = [];
            if (this.transactions.length === 0) {
                return [Block.Values.NULL_HASH];
            }
            for (var t = 0; t < this.transactions.length; t++) {
                hashes.push(this.transactions[t]._getHash());
            }
            return hashes;
        };
        this.getMerkleTree = function getMerkleTree() {
            var tree = this.getTransactionHashes();
            var j = 0;
            for (var size = this.transactions.length; size > 1; size = Math.floor((size + 1) / 2)) {
                for (var i = 0; i < size; i += 2) {
                    var i2 = Math.min(i + 1, size - 1);
                    var buf = Buffer.concat([tree[j + i], tree[j + i2]]);
                    tree.push(hash_1.Hash.sha256sha256(buf));
                }
                j += size;
            }
            return tree;
        };
        this.getMerkleRoot = function getMerkleRoot() {
            var tree = this.getMerkleTree();
            return tree[tree.length - 1];
        };
        this.validMerkleRoot = function validMerkleRoot() {
            var h = new bn_1.BitcoreBN(this.header.merkleRoot.toString('hex'), 'hex');
            var c = new bn_1.BitcoreBN(this.getMerkleRoot().toString('hex'), 'hex');
            if (h.cmp(c) !== 0) {
                return false;
            }
            return true;
        };
        this._getHash = function () {
            return this.header._getHash();
        };
        this.inspect = function inspect() {
            return '<Block ' + this.id + '>';
        };
        if (!(this instanceof Block)) {
            return new Block(arg);
        }
        _.extend(this, Block._from(arg));
        return this;
    }
    get hash() {
        return this.id;
    }
    get id() {
        if (!this._id) {
            this._id = this.header.id;
        }
        return this._id;
    }
}
exports.Block = Block;
Block.MAX_BLOCK_SIZE = 2000000;
Block._from = function _from(arg) {
    var info = {};
    if (buffer_1.BufferUtil.isBuffer(arg)) {
        info = Block._fromBufferReader(new bufferreader_1.BufferReader(arg));
    }
    else if (_.isObject(arg)) {
        info = Block._fromObject(arg);
    }
    else {
        throw new TypeError('Unrecognized argument for Block');
    }
    return info;
};
Block._fromObject = function _fromObject(data) {
    var transactions = [];
    data.transactions.forEach(function (tx) {
        if (tx instanceof transaction_1.Transaction) {
            transactions.push(tx);
        }
        else {
            transactions.push(new transaction_1.Transaction().fromObject(tx));
        }
    });
    var info = {
        header: blockheader_1.BlockHeader.fromObject(data.header),
        transactions: transactions
    };
    return info;
};
Block.fromObject = function fromObject(obj) {
    var info = Block._fromObject(obj);
    return new Block(info);
};
Block._fromBufferReader = function _fromBufferReader(br) {
    const info = {};
    $.checkState(!br.finished(), 'No block data received');
    info.header = blockheader_1.BlockHeader.fromBufferReader(br);
    var transactions = br.readVarintNum();
    info.transactions = [];
    for (var i = 0; i < transactions; i++) {
        info.transactions.push(new transaction_1.Transaction().fromBufferReader(br));
    }
    return info;
};
Block.fromBufferReader = function fromBufferReader(br) {
    $.checkArgument(br, 'br is required');
    var info = Block._fromBufferReader(br);
    return new Block(info);
};
Block.fromBuffer = function fromBuffer(buf) {
    return Block.fromBufferReader(new bufferreader_1.BufferReader(buf));
};
Block.fromString = function fromString(str) {
    var buf = new Buffer(str, 'hex');
    return Block.fromBuffer(buf);
};
Block.fromRawBlock = function fromRawBlock(data) {
    if (!buffer_1.BufferUtil.isBuffer(data)) {
        data = new Buffer(data, 'binary');
    }
    var br = new bufferreader_1.BufferReader(data);
    br.pos = Block.Values.START_OF_BLOCK;
    var info = Block._fromBufferReader(br);
    return new Block(info);
};
Block.Values = {
    START_OF_BLOCK: 8,
    NULL_HASH: Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')
};
//# sourceMappingURL=block.js.map