import * as _ from 'lodash';
import { BlockHeader } from './blockheader';
import { BitcoreBN } from '../crypto/bn';
import { BufferUtil } from '../util/buffer';
import { BufferReader } from '../encoding/bufferreader';
import { BufferWriter } from '../encoding/bufferwriter';
import { Hash } from '../crypto/hash';
import { Transaction } from '../transaction';
const $ = require('../util/preconditions');

export namespace Block {
    export interface BlockObj {
        transactions: Array<Transaction>;
        header: BlockHeader;
    }
}

/**
 * Instantiate a Block from a Buffer, JSON object, or Object with
 * the properties of the Block
 *
 * @param {*} - A Buffer, JSON string, or Object
 * @returns {Block}
 * @constructor
 */
export class Block {
    public transactions: Array<Transaction>;
    public _id: string;
    public header: BlockHeader;
    constructor(arg?: Partial<Block.BlockObj> | Buffer) {
        if (!(this instanceof Block)) {
            return new Block(arg);
        }
        _.extend(this, Block._from(arg));
        return this;
    }
    // https://github.com/bitcoin/bitcoin/blob/b5fa132329f0377d787a4a21c1686609c2bfaece/src/primitives/block.h#L14
    public static MAX_BLOCK_SIZE = 2000000;
    /**
     * @param {*} - A Buffer, JSON string or Object
     * @returns {Object} - An object representing block data
     * @throws {TypeError} - If the argument was not recognized
     * @private
     */
    public static _from = function _from(arg) {
        var info = {};
        if (BufferUtil.isBuffer(arg)) {
            info = Block._fromBufferReader(new BufferReader(arg));
        }
        else if (_.isObject(arg)) {
            info = Block._fromObject(arg);
        }
        else {
            throw new TypeError('Unrecognized argument for Block');
        }
        return info;
    };
    /**
     * @param {Object} - A plain JavaScript object
     * @returns {Object} - An object representing block data
     * @private
     */
    public static _fromObject = function _fromObject(data) {
        var transactions = [];
        data.transactions.forEach(function (tx) {
            if (tx instanceof Transaction) {
                transactions.push(tx);
            }
            else {
                transactions.push(new Transaction().fromObject(tx));
            }
        });
        var info = {
            header: BlockHeader.fromObject(data.header),
            transactions: transactions
        };
        return info;
    };
    /**
     * @param {Object} - A plain JavaScript object
     * @returns {Block} - An instance of block
     */
    public static fromObject = function fromObject(obj) {
        var info = Block._fromObject(obj);
        return new Block(info);
    };
    /**
     * @param {BufferReader} - Block data
     * @returns {Object} - An object representing the block data
     * @private
     */
    public static _fromBufferReader = function _fromBufferReader(br) {
        const info: Partial<Block.BlockObj> = {};
        $.checkState(!br.finished(), 'No block data received');
        info.header = BlockHeader.fromBufferReader(br);
        var transactions = br.readVarintNum();
        info.transactions = [];
        for (var i = 0; i < transactions; i++) {
            info.transactions.push(new Transaction().fromBufferReader(br));
        }
        return info;
    };
    /**
     * @param {BufferReader} - A buffer reader of the block
     * @returns {Block} - An instance of block
     */
    public static fromBufferReader = function fromBufferReader(br) {
        $.checkArgument(br, 'br is required');
        var info = Block._fromBufferReader(br);
        return new Block(info);
    };
    /**
     * @param {Buffer} - A buffer of the block
     * @returns {Block} - An instance of block
     */
    public static fromBuffer = function fromBuffer(buf) {
        return Block.fromBufferReader(new BufferReader(buf));
    };
    /**
     * @param {string} - str - A hex encoded string of the block
     * @returns {Block} - A hex encoded string of the block
     */
    public static fromString = function fromString(str) {
        var buf = new Buffer(str, 'hex');
        return Block.fromBuffer(buf);
    };
    /**
     * @param {Binary} - Raw block binary data or buffer
     * @returns {Block} - An instance of block
     */
    public static fromRawBlock = function fromRawBlock(data) {
        if (!BufferUtil.isBuffer(data)) {
            data = new Buffer(data, 'binary');
        }
        var br = new BufferReader(data);
        br.pos = Block.Values.START_OF_BLOCK;
        var info = Block._fromBufferReader(br);
        return new Block(info);
    };
    /**
     * @returns {Object} - A plain object with the block properties
     */
    public toObject = function toObject() {
        var transactions = [];
        this.transactions.forEach(function (tx) {
            transactions.push(tx.toObject());
        });
        return {
            header: this.header.toObject(),
            transactions: transactions
        };
    };

    public toJSON = this.toObject;
    /**
     * @returns {Buffer} - A buffer of the block
     */
    public toBuffer = function toBuffer() {
        return this.toBufferWriter().concat();
    };
    /**
     * @returns {string} - A hex encoded string of the block
     */
    public toString = function toString() {
        return this.toBuffer().toString('hex');
    };
    /**
     * @param {BufferWriter} - An existing instance of BufferWriter
     * @returns {BufferWriter} - An instance of BufferWriter representation of the Block
     */
    public toBufferWriter = function toBufferWriter(bw) {
        if (!bw) {
            bw = new BufferWriter();
        }
        bw.write(this.header.toBuffer());
        bw.writeVarintNum(this.transactions.length);
        for (var i = 0; i < this.transactions.length; i++) {
            this.transactions[i].toBufferWriter(bw);
        }
        return bw;
    };
    /**
     * Will iterate through each transaction and return an array of hashes
     * @returns {Array} - An array with transaction hashes
     */
    public getTransactionHashes = function getTransactionHashes() {
        var hashes = [];
        if (this.transactions.length === 0) {
            return [Block.Values.NULL_HASH];
        }
        for (var t = 0; t < this.transactions.length; t++) {
            hashes.push(this.transactions[t]._getHash());
        }
        return hashes;
    };
    /**
     * Will build a merkle tree of all the transactions, ultimately arriving at
     * a single point, the merkle root.
     * @link https://en.bitcoin.it/wiki/Protocol_specification#Merkle_Trees
     * @returns {Array} - An array with each level of the tree after the other.
     */
    public getMerkleTree = function getMerkleTree() {
        var tree = this.getTransactionHashes();
        var j = 0;
        for (var size = this.transactions.length; size > 1; size = Math.floor((size + 1) / 2)) {
            for (var i = 0; i < size; i += 2) {
                var i2 = Math.min(i + 1, size - 1);
                var buf = Buffer.concat([tree[j + i], tree[j + i2]]);
                tree.push(Hash.sha256sha256(buf));
            }
            j += size;
        }
        return tree;
    };
    /**
     * Calculates the merkleRoot from the transactions.
     * @returns {Buffer} - A buffer of the merkle root hash
     */
    public getMerkleRoot = function getMerkleRoot() {
        var tree = this.getMerkleTree();
        return tree[tree.length - 1];
    };
    /**
     * Verifies that the transactions in the block match the header merkle root
     * @returns {Boolean} - If the merkle roots match
     */
    public validMerkleRoot = function validMerkleRoot() {
        var h = new BitcoreBN(this.header.merkleRoot.toString('hex'), 'hex');
        var c = new BitcoreBN(this.getMerkleRoot().toString('hex'), 'hex');
        if (h.cmp(c) !== 0) {
            return false;
        }
        return true;
    };
    /**
     * @returns {Buffer} - The little endian hash buffer of the header
     */
    public _getHash = function () {
        return this.header._getHash();
    };

    public get hash() {
        return this.id;
    }
    public get id() {
        if (!this._id) {
            this._id = this.header.id;
        }
        return this._id;
    }
    /**
     * @returns {string} - A string formatted for the console
     */
    public inspect = function inspect() {
        return '<Block ' + this.id + '>';
    };
    public static Values = {
        START_OF_BLOCK: 8, // Start of block in raw block data
        NULL_HASH: Buffer.from(
            '0000000000000000000000000000000000000000000000000000000000000000',
            'hex'
        )
    };
}
