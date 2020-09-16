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
exports.HDPublicKey = void 0;
const assert_1 = __importDefault(require("assert"));
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("./util/preconditions"));
const bn_1 = require("./crypto/bn");
const base58_1 = require("./encoding/base58");
const base58check_1 = require("./encoding/base58check");
const hash_1 = require("./crypto/hash");
const hdprivatekey_1 = require("./hdprivatekey");
const networks_1 = require("./networks");
const point_1 = require("./crypto/point");
const publickey_1 = require("./publickey");
const spec_1 = require("./errors/spec");
const js_1 = require("./util/js");
const buffer_1 = require("./util/buffer");
const errors_1 = require("./errors");
const hdErrors = spec_1.ERROR_TYPES.HDPublicKey.errors;
class HDPublicKey {
    constructor(arg) {
        this.isValidPath = function (arg) {
            if (_.isString(arg)) {
                var indexes = hdprivatekey_1.HDPrivateKey._getDerivationIndexes(arg);
                return indexes !== null && _.every(indexes, this.isValidPath);
            }
            if (_.isNumber(arg)) {
                return arg >= 0 && arg < this.Hardened;
            }
            return false;
        };
        this.deriveChild = function (arg, hardened) {
            if (_.isNumber(arg)) {
                return this._deriveWithNumber(arg, hardened);
            }
            else if (_.isString(arg)) {
                return this._deriveFromString(arg);
            }
            else {
                throw new errors_1.BitcoreError(hdErrors.InvalidDerivationArgument, arg);
            }
        };
        this._deriveFromString = function (path) {
            if (_.includes(path, "'")) {
                throw new errors_1.BitcoreError(hdErrors.InvalidIndexCantDeriveHardened);
            }
            else if (!this.isValidPath(path)) {
                throw new errors_1.BitcoreError(hdErrors.InvalidPath, path);
            }
            var indexes = hdprivatekey_1.HDPrivateKey._getDerivationIndexes(path);
            var derived = indexes.reduce(function (prev, index) {
                return prev._deriveWithNumber(index);
            }, this);
            return derived;
        };
        this._buildFromPrivate = function (arg) {
            var args = _.clone(arg._buffers);
            var point = point_1.Point.getG().mul(bn_1.BitcoreBN.fromBuffer(args.privateKey));
            args.publicKey = point_1.Point.pointToCompressed(point);
            args.version = buffer_1.BufferUtil.integerAsBuffer(networks_1.Network.get(buffer_1.BufferUtil.integerFromBuffer(args.version)).xpubkey);
            args.privateKey = undefined;
            args.checksum = undefined;
            args.xprivkey = undefined;
            return this._buildFromBuffers(args);
        };
        this._buildFromObject = function (arg) {
            var buffers = {
                version: arg.network ? buffer_1.BufferUtil.integerAsBuffer(networks_1.Network.get(arg.network).xpubkey) : arg.version,
                depth: _.isNumber(arg.depth) ? buffer_1.BufferUtil.integerAsSingleByteBuffer(arg.depth) : arg.depth,
                parentFingerPrint: _.isNumber(arg.parentFingerPrint) ? buffer_1.BufferUtil.integerAsBuffer(arg.parentFingerPrint) : arg.parentFingerPrint,
                childIndex: _.isNumber(arg.childIndex) ? buffer_1.BufferUtil.integerAsBuffer(arg.childIndex) : arg.childIndex,
                chainCode: _.isString(arg.chainCode) ? buffer_1.BufferUtil.hexToBuffer(arg.chainCode) : arg.chainCode,
                publicKey: _.isString(arg.publicKey) ? buffer_1.BufferUtil.hexToBuffer(arg.publicKey) :
                    buffer_1.BufferUtil.isBuffer(arg.publicKey) ? arg.publicKey : arg.publicKey.toBuffer(),
                checksum: _.isNumber(arg.checksum) ? buffer_1.BufferUtil.integerAsBuffer(arg.checksum) : arg.checksum
            };
            return this._buildFromBuffers(buffers);
        };
        this._buildFromSerialized = function (arg) {
            var decoded = base58check_1.Base58Check.decode(arg);
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
        this._buildFromBuffers = function (arg) {
            this._validateBufferArguments(arg);
            js_1.JSUtil.defineImmutable(this, {
                _buffers: arg
            });
            var sequence = [
                arg.version, arg.depth, arg.parentFingerPrint, arg.childIndex, arg.chainCode,
                arg.publicKey
            ];
            var concat = buffer_1.BufferUtil.concat(sequence);
            var checksum = base58check_1.Base58Check.checksum(concat);
            if (!arg.checksum || !arg.checksum.length) {
                arg.checksum = checksum;
            }
            else {
                if (arg.checksum.toString('hex') !== checksum.toString('hex')) {
                    throw new errors_1.BitcoreError(spec_1.ERROR_TYPES.InvalidB58Checksum, concat, checksum);
                }
            }
            var network = networks_1.Network.get(buffer_1.BufferUtil.integerFromBuffer(arg.version));
            var xpubkey;
            xpubkey = base58check_1.Base58Check.encode(buffer_1.BufferUtil.concat(sequence));
            arg.xpubkey = new Buffer(xpubkey);
            var publicKey = new publickey_1.PublicKey(arg.publicKey, { network: network });
            var size = this.ParentFingerPrintSize;
            var fingerPrint = hash_1.Hash.sha256ripemd160(publicKey.toBuffer()).slice(0, size);
            js_1.JSUtil.defineImmutable(this, {
                xpubkey: xpubkey,
                network: network,
                depth: buffer_1.BufferUtil.integerFromSingleByteBuffer(arg.depth),
                publicKey: publicKey,
                fingerPrint: fingerPrint
            });
            return this;
        };
        this.toString = function () {
            return this.xpubkey;
        };
        this.inspect = function () {
            return '<HDPublicKey: ' + this.xpubkey + '>';
        };
        this.toObject = function toObject() {
            return {
                network: networks_1.Network.get(buffer_1.BufferUtil.integerFromBuffer(this._buffers.version)).name,
                depth: buffer_1.BufferUtil.integerFromSingleByteBuffer(this._buffers.depth),
                fingerPrint: buffer_1.BufferUtil.integerFromBuffer(this.fingerPrint),
                parentFingerPrint: buffer_1.BufferUtil.integerFromBuffer(this._buffers.parentFingerPrint),
                childIndex: buffer_1.BufferUtil.integerFromBuffer(this._buffers.childIndex),
                chainCode: buffer_1.BufferUtil.bufferToHex(this._buffers.chainCode),
                publicKey: this.publicKey.toString(),
                checksum: buffer_1.BufferUtil.integerFromBuffer(this._buffers.checksum),
                xpubkey: this.xpubkey
            };
        };
        this.toJSON = this.toObject;
        this.toBuffer = function () {
            return buffer_1.BufferUtil.copy(this._buffers.xpubkey);
        };
        if (arg instanceof HDPublicKey) {
            return arg;
        }
        if (!(this instanceof HDPublicKey)) {
            return new HDPublicKey(arg);
        }
        if (arg) {
            if (_.isString(arg) || buffer_1.BufferUtil.isBuffer(arg)) {
                var error = HDPublicKey.getSerializedError(arg);
                if (!error) {
                    return this._buildFromSerialized(arg);
                }
                else if (buffer_1.BufferUtil.isBuffer(arg) && !HDPublicKey.getSerializedError(arg.toString())) {
                    return this._buildFromSerialized(arg.toString());
                }
                else {
                    if (error instanceof errors_1.BitcoreError) {
                        return new hdprivatekey_1.HDPrivateKey(arg).hdPublicKey;
                    }
                    throw error;
                }
            }
            else {
                if (_.isObject(arg)) {
                    if (arg instanceof hdprivatekey_1.HDPrivateKey) {
                        return this._buildFromPrivate(arg);
                    }
                    else {
                        return this._buildFromObject(arg);
                    }
                }
                else {
                    throw new errors_1.BitcoreError(hdErrors.UnrecognizedArgument, arg);
                }
            }
        }
        else {
            throw new errors_1.BitcoreError(hdErrors.MustSupplyArgument);
        }
    }
    derive(arg, hardened = false) {
        return this.deriveChild(arg, hardened);
    }
    ;
    _deriveWithNumber(index, hardened = false) {
        if (index >= HDPublicKey.Hardened || hardened) {
            throw new errors_1.BitcoreError(hdErrors.InvalidIndexCantDeriveHardened);
        }
        if (index < 0) {
            throw new errors_1.BitcoreError(hdErrors.InvalidPath, index);
        }
        const indexBuffer = buffer_1.BufferUtil.integerAsBuffer(index);
        const data = buffer_1.BufferUtil.concat([this.publicKey.toBuffer(), indexBuffer]);
        const hash = hash_1.Hash.sha512hmac(data, this._buffers.chainCode);
        const leftPart = bn_1.BitcoreBN.fromBuffer(hash.slice(0, 32), { size: 32 });
        const chainCode = hash.slice(32, 64);
        let publicKey;
        try {
            publicKey = publickey_1.PublicKey.fromPoint(point_1.Point.getG().mul(leftPart).add(this.publicKey.point));
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
    }
    ;
    static isValidSerialized(data, network) {
        return _.isNull(this.getSerializedError(data, network));
    }
    ;
}
exports.HDPublicKey = HDPublicKey;
HDPublicKey.getSerializedError = function (data, network = undefined) {
    if (!(_.isString(data) || buffer_1.BufferUtil.isBuffer(data))) {
        return new errors_1.BitcoreError(hdErrors.UnrecognizedArgument, 'expected buffer or string');
    }
    if (!base58_1.Base58.validCharacters(data)) {
        return new errors_1.BitcoreError(spec_1.ERROR_TYPES.InvalidB58Char, '(unknown)', data);
    }
    try {
        data = base58check_1.Base58Check.decode(data);
    }
    catch (e) {
        return new errors_1.BitcoreError(spec_1.ERROR_TYPES.InvalidB58Checksum, data);
    }
    if (data.length !== this.DataSize) {
        return new errors_1.BitcoreError(hdErrors.InvalidLength, data);
    }
    if (!_.isUndefined(network)) {
        var error = this._validateNetwork(data, network);
        if (error) {
            return error;
        }
    }
    var version = buffer_1.BufferUtil.integerFromBuffer(data.slice(0, 4));
    if (version === networks_1.Network.livenet.xprivkey || version === networks_1.Network.testnet.xprivkey) {
        return new errors_1.BitcoreError(hdErrors.ArgumentIsPrivateExtended);
    }
    return null;
};
HDPublicKey._validateNetwork = function (data, networkArg) {
    var network = networks_1.Network.get(networkArg);
    if (!network) {
        return new errors_1.BitcoreError(spec_1.ERROR_TYPES.InvalidNetworkArgument, networkArg);
    }
    var version = data.slice(this.VersionStart, this.VersionEnd);
    if (buffer_1.BufferUtil.integerFromBuffer(version) !== network.xpubkey) {
        return new errors_1.BitcoreError(spec_1.ERROR_TYPES.InvalidNetwork, version);
    }
    return null;
};
HDPublicKey._validateBufferArguments = function (arg) {
    var checkBuffer = function (name, size) {
        var buff = arg[name];
        assert_1.default(buffer_1.BufferUtil.isBuffer(buff), name + ' argument is not a buffer, it\'s ' + typeof buff);
        assert_1.default(buff.length === size, name + ' has not the expected size: found ' + buff.length + ', expected ' + size);
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
HDPublicKey.fromString = function (arg) {
    preconditions_1.default.checkArgument(_.isString(arg), 'No valid string was provided');
    return new HDPublicKey(arg);
};
HDPublicKey.fromObject = function (arg) {
    preconditions_1.default.checkArgument(_.isObject(arg), 'No valid argument was provided');
    return new HDPublicKey(arg);
};
HDPublicKey.fromBuffer = function (arg) {
    return new HDPublicKey(arg);
};
HDPublicKey.Hardened = 0x80000000;
HDPublicKey.RootElementAlias = ['m', 'M'];
HDPublicKey.VersionSize = 4;
HDPublicKey.DepthSize = 1;
HDPublicKey.ParentFingerPrintSize = 4;
HDPublicKey.ChildIndexSize = 4;
HDPublicKey.ChainCodeSize = 32;
HDPublicKey.PublicKeySize = 33;
HDPublicKey.CheckSumSize = 4;
HDPublicKey.DataSize = 78;
HDPublicKey.SerializedByteSize = 82;
HDPublicKey.VersionStart = 0;
HDPublicKey.VersionEnd = HDPublicKey.VersionStart + HDPublicKey.VersionSize;
HDPublicKey.DepthStart = HDPublicKey.VersionEnd;
HDPublicKey.DepthEnd = HDPublicKey.DepthStart + HDPublicKey.DepthSize;
HDPublicKey.ParentFingerPrintStart = HDPublicKey.DepthEnd;
HDPublicKey.ParentFingerPrintEnd = HDPublicKey.ParentFingerPrintStart + HDPublicKey.ParentFingerPrintSize;
HDPublicKey.ChildIndexStart = HDPublicKey.ParentFingerPrintEnd;
HDPublicKey.ChildIndexEnd = HDPublicKey.ChildIndexStart + HDPublicKey.ChildIndexSize;
HDPublicKey.ChainCodeStart = HDPublicKey.ChildIndexEnd;
HDPublicKey.ChainCodeEnd = HDPublicKey.ChainCodeStart + HDPublicKey.ChainCodeSize;
HDPublicKey.PublicKeyStart = HDPublicKey.ChainCodeEnd;
HDPublicKey.PublicKeyEnd = HDPublicKey.PublicKeyStart + HDPublicKey.PublicKeySize;
HDPublicKey.ChecksumStart = HDPublicKey.PublicKeyEnd;
HDPublicKey.ChecksumEnd = HDPublicKey.ChecksumStart + HDPublicKey.CheckSumSize;
assert_1.default(HDPublicKey.PublicKeyEnd === HDPublicKey.DataSize);
assert_1.default(HDPublicKey.ChecksumEnd === HDPublicKey.SerializedByteSize);
//# sourceMappingURL=hdpublickey.js.map