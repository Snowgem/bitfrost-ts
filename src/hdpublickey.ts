import assert from 'assert';
import * as _ from 'lodash';
import $ from './util/preconditions';
import { BitcoreBN } from './crypto/bn';
import { Base58 } from './encoding/base58';
import { Base58Check } from './encoding/base58check';
import { Hash } from './crypto/hash';
import { HDPrivateKey } from './hdprivatekey';
import { Network } from './networks';
import { Point } from './crypto/point';
import { PublicKey } from './publickey';
import { ERROR_TYPES } from './errors/spec';
import { JSUtil } from './util/js';
import { BufferUtil } from './util/buffer';
import { BitcoreError } from './errors';

const hdErrors = ERROR_TYPES.HDPublicKey.errors;

export namespace HDPublicKey {
    export type DataType = HDPublicKey.HDPublicKeyObj<string | Buffer | number> | Buffer | string | HDPublicKey
    export interface HDPublicKeyObj<T> {
        network: Network | string;
        depth: number;
        fingerPrint?: T;
        parentFingerPrint: T;
        childIndex: T;
        chainCode: T;
        publicKey: string | PublicKey | Buffer;
        version?: T;
        checksum?: T;
        xpubkey?: T;
    }
}
/**
 * The representation of an hierarchically derived public key.
 *
 * See https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 *
 * @constructor
 * @param {Object|string|Buffer} arg
 */
export class HDPublicKey {
    public _buffers: HDPublicKey.HDPublicKeyObj<Buffer>;
    public network: Network;
    public depth: number;
    public fingerPrint: Buffer;
    public parentFingerPrint: number;
    public childIndex: number;
    public chainCode: number;
    public publicKey: PublicKey;
    public checksum: number;
    public xpubkey: Buffer;
    constructor(arg: HDPublicKey.DataType) {
        /* jshint maxcomplexity: 12 */
        /* jshint maxstatements: 20 */
        if (arg instanceof HDPublicKey) {
            return arg;
        }
        if (!(this instanceof HDPublicKey)) {
            return new HDPublicKey(arg);
        }
        if (arg) {
            if (_.isString(arg) || BufferUtil.isBuffer(arg)) {
                var error = HDPublicKey.getSerializedError(arg);
                if (!error) {
                    return this._buildFromSerialized(arg);
                }
                else if (BufferUtil.isBuffer(arg) && !HDPublicKey.getSerializedError(arg.toString())) {
                    return this._buildFromSerialized(arg.toString());
                }
                else {
                    if (error instanceof BitcoreError) {
                        return new HDPrivateKey(arg).hdPublicKey;
                    }
                    throw error;
                }
            }
            else {
                if (_.isObject(arg)) {
                    if (arg instanceof HDPrivateKey) {
                        return this._buildFromPrivate(arg);
                    }
                    else {
                        return this._buildFromObject(arg);
                    }
                }
                else {
                    throw new BitcoreError(hdErrors.UnrecognizedArgument, arg);
                }
            }
        }
        else {
            throw new BitcoreError(hdErrors.MustSupplyArgument);
        }
    }
    /**
     * Verifies that a given path is valid.
     *
     * @param {string|number} arg
     * @return {boolean}
     */
    public isValidPath = function (arg) {
        if (_.isString(arg)) {
            var indexes = HDPrivateKey._getDerivationIndexes(arg);
            return indexes !== null && _.every(indexes, this.isValidPath);
        }
        if (_.isNumber(arg)) {
            return arg >= 0 && arg < this.Hardened;
        }
        return false;
    };
    /**
     * WARNING: This method is deprecated. Use deriveChild instead.
     *
     *
     * Get a derivated child based on a string or number.
     *
     * If the first argument is a string, it's parsed as the full path of
     * derivation. Valid values for this argument include "m" (which returns the
     * same public key), "m/0/1/40/2/1000".
     *
     * Note that hardened keys can't be derived from a public extended key.
     *
     * If the first argument is a number, the child with that index will be
     * derived. See the example usage for clarification.
     *
     * @example
     * ```javascript
     * var parent = new HDPublicKey('xpub...');
     * var child_0_1_2 = parent.derive(0).derive(1).derive(2);
     * var copy_of_child_0_1_2 = parent.derive("m/0/1/2");
     * assert(child_0_1_2.xprivkey === copy_of_child_0_1_2);
     * ```
     *
     * @param {string|number} arg
     */
    public derive(arg: string | number, hardened = false) {
        return this.deriveChild(arg, hardened);
    };
    /**
     * WARNING: This method will not be officially supported until v1.0.0.
     *
     *
     * Get a derivated child based on a string or number.
     *
     * If the first argument is a string, it's parsed as the full path of
     * derivation. Valid values for this argument include "m" (which returns the
     * same public key), "m/0/1/40/2/1000".
     *
     * Note that hardened keys can't be derived from a public extended key.
     *
     * If the first argument is a number, the child with that index will be
     * derived. See the example usage for clarification.
     *
     * @example
     * ```javascript
     * var parent = new HDPublicKey('xpub...');
     * var child_0_1_2 = parent.deriveChild(0).deriveChild(1).deriveChild(2);
     * var copy_of_child_0_1_2 = parent.deriveChild("m/0/1/2");
     * assert(child_0_1_2.xprivkey === copy_of_child_0_1_2);
     * ```
     *
     * @param {string|number} arg
     */
    public deriveChild = function (arg, hardened) {
        if (_.isNumber(arg)) {
            return this._deriveWithNumber(arg, hardened);
        }
        else if (_.isString(arg)) {
            return this._deriveFromString(arg);
        }
        else {
            throw new BitcoreError(hdErrors.InvalidDerivationArgument, arg);
        }
    };
    public _deriveWithNumber(index, hardened = false) {
        if (index >= HDPublicKey.Hardened || hardened) {
            throw new BitcoreError(hdErrors.InvalidIndexCantDeriveHardened);
        }
        if (index < 0) {
            throw new BitcoreError(hdErrors.InvalidPath, index);
        }
        const indexBuffer = BufferUtil.integerAsBuffer(index);
        const data = BufferUtil.concat([this.publicKey.toBuffer(), indexBuffer]);
        const hash = Hash.sha512hmac(data, this._buffers.chainCode);
        const leftPart = BitcoreBN.fromBuffer(hash.slice(0, 32), { size: 32 });
        const chainCode = hash.slice(32, 64);
        let publicKey;
        try {
            publicKey = PublicKey.fromPoint(Point.getG().mul(leftPart).add(this.publicKey.point));
        }
        catch (e) {
            return this._deriveWithNumber(index + 1);
        }
        var derived = new HDPublicKey({
            network: this.network,
            depth: this.depth + 1,
            parentFingerPrint: this.fingerPrint,
            childIndex: index,
            chainCode: chainCode,
            publicKey: publicKey
        });
        return derived;
    };
    public _deriveFromString = function (path) {
        /* jshint maxcomplexity: 8 */
        if (_.includes(path, "'")) {
            throw new BitcoreError(hdErrors.InvalidIndexCantDeriveHardened);
        }
        else if (!this.isValidPath(path)) {
            throw new BitcoreError(hdErrors.InvalidPath, path);
        }
        var indexes = HDPrivateKey._getDerivationIndexes(path);
        var derived = indexes.reduce(function (prev, index) {
            return prev._deriveWithNumber(index);
        }, this);
        return derived;
    };
    /**
     * Verifies that a given serialized public key in base58 with checksum format
     * is valid.
     *
     * @param {string|Buffer} data - the serialized public key
     * @param {string|Network=} network - optional, if present, checks that the
     *     network provided matches the network serialized.
     * @return {boolean}
     */
    public static isValidSerialized(data, network?: Network | string) {
        return _.isNull(this.getSerializedError(data, network));
    };
    /**
     * Checks what's the error that causes the validation of a serialized public key
     * in base58 with checksum to fail.
     *
     * @param {string|Buffer} data - the serialized public key
     * @param {string|Network=} network - optional, if present, checks that the
     *     network provided matches the network serialized.
     * @return {errors|null}
     */
    public static getSerializedError = function (data, network = undefined) {
        /* jshint maxcomplexity: 10 */
        /* jshint maxstatements: 20 */
        if (!(_.isString(data) || BufferUtil.isBuffer(data))) {
            return new BitcoreError(
                hdErrors.UnrecognizedArgument,
                'expected buffer or string'
            );
        }
        if (!Base58.validCharacters(data)) {
            return new BitcoreError(ERROR_TYPES.InvalidB58Char, '(unknown)', data);
        }
        try {
            data = Base58Check.decode(data);
        }
        catch (e) {
            return new BitcoreError(ERROR_TYPES.InvalidB58Checksum, data);
        }
        if (data.length !== this.DataSize) {
            return new BitcoreError(hdErrors.InvalidLength, data);
        }
        if (!_.isUndefined(network)) {
            var error = this._validateNetwork(data, network);
            if (error) {
                return error;
            }
        }
        var version = BufferUtil.integerFromBuffer(data.slice(0, 4));
        if (version === Network.livenet.xprivkey || version === Network.testnet.xprivkey) {
            return new BitcoreError(hdErrors.ArgumentIsPrivateExtended);
        }
        return null;
    };
    public static _validateNetwork = function (data, networkArg) {
        var network = Network.get(networkArg);
        if (!network) {
            return new BitcoreError(ERROR_TYPES.InvalidNetworkArgument, networkArg);
        }
        var version = data.slice(this.VersionStart, this.VersionEnd);
        if (BufferUtil.integerFromBuffer(version) !== network.xpubkey) {
            return new BitcoreError(ERROR_TYPES.InvalidNetwork, version);
        }
        return null;
    };
    public _buildFromPrivate = function (arg) {
        var args = _.clone(arg._buffers);
        var point = Point.getG().mul(BitcoreBN.fromBuffer(args.privateKey));
        args.publicKey = Point.pointToCompressed(point);
        args.version = BufferUtil.integerAsBuffer(Network.get(BufferUtil.integerFromBuffer(args.version)).xpubkey);
        args.privateKey = undefined;
        args.checksum = undefined;
        args.xprivkey = undefined;
        return this._buildFromBuffers(args);
    };
    public _buildFromObject = function (arg) {
        /* jshint maxcomplexity: 10 */
        // TODO: Type validation
        var buffers = {
            version: arg.network ? BufferUtil.integerAsBuffer(Network.get(arg.network).xpubkey) : arg.version,
            depth: _.isNumber(arg.depth) ? BufferUtil.integerAsSingleByteBuffer(arg.depth) : arg.depth,
            parentFingerPrint: _.isNumber(arg.parentFingerPrint) ? BufferUtil.integerAsBuffer(arg.parentFingerPrint) : arg.parentFingerPrint,
            childIndex: _.isNumber(arg.childIndex) ? BufferUtil.integerAsBuffer(arg.childIndex) : arg.childIndex,
            chainCode: _.isString(arg.chainCode) ? BufferUtil.hexToBuffer(arg.chainCode) : arg.chainCode,
            publicKey: _.isString(arg.publicKey) ? BufferUtil.hexToBuffer(arg.publicKey) :
                BufferUtil.isBuffer(arg.publicKey) ? arg.publicKey : arg.publicKey.toBuffer(),
            checksum: _.isNumber(arg.checksum) ? BufferUtil.integerAsBuffer(arg.checksum) : arg.checksum
        };
        return this._buildFromBuffers(buffers);
    };
    public _buildFromSerialized = function (arg) {
        var decoded = Base58Check.decode(arg);
        var buffers = {
            version: decoded.slice(this.VersionStart, this.VersionEnd),
            depth: decoded.slice(this.DepthStart, this.DepthEnd),
            parentFingerPrint: decoded.slice(this.ParentFingerPrintStart, this.ParentFingerPrintEnd),
            childIndex: decoded.slice(this.ChildIndexStart, this.ChildIndexEnd),
            chainCode: decoded.slice(this.ChainCodeStart, this.ChainCodeEnd),
            publicKey: decoded.slice(this.PublicKeyStart, this.PublicKeyEnd),
            checksum: decoded.slice(this.ChecksumStart, this.ChecksumEnd),
            xpubkey: arg
        };
        return this._buildFromBuffers(buffers);
    };
    /**
     * Receives a object with buffers in all the properties and populates the
     * internal structure
     *
     * @param {Object} arg
     * @param {buffer.Buffer} arg.version
     * @param {buffer.Buffer} arg.depth
     * @param {buffer.Buffer} arg.parentFingerPrint
     * @param {buffer.Buffer} arg.childIndex
     * @param {buffer.Buffer} arg.chainCode
     * @param {buffer.Buffer} arg.publicKey
     * @param {buffer.Buffer} arg.checksum
     * @param {string=} arg.xpubkey - if set, don't recalculate the base58
     *      representation
     * @return {HDPublicKey} this
     */
    public _buildFromBuffers = function (arg) {
        /* jshint maxcomplexity: 8 */
        /* jshint maxstatements: 20 */
        this._validateBufferArguments(arg);
        JSUtil.defineImmutable(this, {
            _buffers: arg
        });
        var sequence = [
            arg.version, arg.depth, arg.parentFingerPrint, arg.childIndex, arg.chainCode,
            arg.publicKey
        ];
        var concat = BufferUtil.concat(sequence);
        var checksum = Base58Check.checksum(concat);
        if (!arg.checksum || !arg.checksum.length) {
            arg.checksum = checksum;
        }
        else {
            if (arg.checksum.toString('hex') !== checksum.toString('hex')) {
                throw new BitcoreError(
                    ERROR_TYPES.InvalidB58Checksum,
                    concat,
                    checksum
                );
            }
        }
        var network = Network.get(BufferUtil.integerFromBuffer(arg.version));
        var xpubkey;
        xpubkey = Base58Check.encode(BufferUtil.concat(sequence));
        arg.xpubkey = new Buffer(xpubkey);
        var publicKey = new PublicKey(arg.publicKey, { network: network });
        var size = this.ParentFingerPrintSize;
        var fingerPrint = Hash.sha256ripemd160(publicKey.toBuffer()).slice(0, size);
        JSUtil.defineImmutable(this, {
            xpubkey: xpubkey,
            network: network,
            depth: BufferUtil.integerFromSingleByteBuffer(arg.depth),
            publicKey: publicKey,
            fingerPrint: fingerPrint
        });
        return this;
    };
    public static _validateBufferArguments = function (arg) {
        var checkBuffer = function (name, size) {
            var buff = arg[name];
            assert(BufferUtil.isBuffer(buff), name + ' argument is not a buffer, it\'s ' + typeof buff);
            assert(buff.length === size, name + ' has not the expected size: found ' + buff.length + ', expected ' + size);
        };
        checkBuffer('version', this.VersionSize);
        checkBuffer('depth', this.DepthSize);
        checkBuffer('parentFingerPrint', this.ParentFingerPrintSize);
        checkBuffer('childIndex', this.ChildIndexSize);
        checkBuffer('chainCode', this.ChainCodeSize);
        checkBuffer('publicKey', this.PublicKeySize);
        if (arg.checksum && arg.checksum.length) {
            checkBuffer('checksum', this.CheckSumSize);
        }
    };
    public static fromString = function (arg) {
        $.checkArgument(_.isString(arg), 'No valid string was provided');
        return new HDPublicKey(arg);
    };
    public static fromObject = function (arg) {
        $.checkArgument(_.isObject(arg), 'No valid argument was provided');
        return new HDPublicKey(arg);
    };
    /**
     * Returns the base58 checked representation of the public key
     * @return {string} a string starting with "xpub..." in livenet
     */
    public toString = function () {
        return this.xpubkey;
    };
    /**
     * Returns the console representation of this extended public key.
     * @return string
     */
    public inspect = function () {
        return '<HDPublicKey: ' + this.xpubkey + '>';
    };
    /**
     * Returns a plain JavaScript object with information to reconstruct a key.
     *
     * Fields are: <ul>
     *  <li> network: 'livenet' or 'testnet'
     *  <li> depth: a number from 0 to 255, the depth to the master extended key
     *  <li> fingerPrint: a number of 32 bits taken from the hash of the public key
     *  <li> fingerPrint: a number of 32 bits taken from the hash of this key's
     *  <li>     parent's public key
     *  <li> childIndex: index with which this key was derived
     *  <li> chainCode: string in hexa encoding used for derivation
     *  <li> publicKey: string, hexa encoded, in compressed key format
     *  <li> checksum: BufferUtil.integerFromBuffer(this._buffers.checksum),
     *  <li> xpubkey: the string with the base58 representation of this extended key
     *  <li> checksum: the base58 checksum of xpubkey
     * </ul>
     */
    public toObject = function toObject() {
        return {
            network: Network.get(BufferUtil.integerFromBuffer(this._buffers.version)).name,
            depth: BufferUtil.integerFromSingleByteBuffer(this._buffers.depth),
            fingerPrint: BufferUtil.integerFromBuffer(this.fingerPrint),
            parentFingerPrint: BufferUtil.integerFromBuffer(this._buffers.parentFingerPrint),
            childIndex: BufferUtil.integerFromBuffer(this._buffers.childIndex),
            chainCode: BufferUtil.bufferToHex(this._buffers.chainCode),
            publicKey: this.publicKey.toString(),
            checksum: BufferUtil.integerFromBuffer(this._buffers.checksum),
            xpubkey: this.xpubkey
        };
    };

    toJSON = this.toObject
    /**
     * Create a HDPublicKey from a buffer argument
     *
     * @param {Buffer} arg
     * @return {HDPublicKey}
     */
    public static fromBuffer = function (arg) {
        return new HDPublicKey(arg);
    };
    /**
     * Return a buffer representation of the xpubkey
     *
     * @return {Buffer}
     */
    public toBuffer = function () {
        return BufferUtil.copy(this._buffers.xpubkey);
    };

    public static Hardened = 0x80000000;
    public static RootElementAlias = ['m', 'M'];
    public static VersionSize = 4;
    public static DepthSize = 1;
    public static ParentFingerPrintSize = 4;
    public static ChildIndexSize = 4;
    public static ChainCodeSize = 32;
    public static PublicKeySize = 33;
    public static CheckSumSize = 4;
    public static DataSize = 78;
    public static SerializedByteSize = 82;
    public static VersionStart = 0;
    public static VersionEnd = HDPublicKey.VersionStart + HDPublicKey.VersionSize;
    public static DepthStart = HDPublicKey.VersionEnd;
    public static DepthEnd = HDPublicKey.DepthStart + HDPublicKey.DepthSize;
    public static ParentFingerPrintStart = HDPublicKey.DepthEnd;
    public static ParentFingerPrintEnd = HDPublicKey.ParentFingerPrintStart + HDPublicKey.ParentFingerPrintSize;
    public static ChildIndexStart = HDPublicKey.ParentFingerPrintEnd;
    public static ChildIndexEnd = HDPublicKey.ChildIndexStart + HDPublicKey.ChildIndexSize;
    public static ChainCodeStart = HDPublicKey.ChildIndexEnd;
    public static ChainCodeEnd = HDPublicKey.ChainCodeStart + HDPublicKey.ChainCodeSize;
    public static PublicKeyStart = HDPublicKey.ChainCodeEnd;
    public static PublicKeyEnd = HDPublicKey.PublicKeyStart + HDPublicKey.PublicKeySize;
    public static ChecksumStart = HDPublicKey.PublicKeyEnd;
    public static ChecksumEnd = HDPublicKey.ChecksumStart + HDPublicKey.CheckSumSize;

}

assert(HDPublicKey.PublicKeyEnd === HDPublicKey.DataSize);
assert(HDPublicKey.ChecksumEnd === HDPublicKey.SerializedByteSize);
