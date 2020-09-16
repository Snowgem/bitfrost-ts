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
exports.HDPrivateKey = void 0;
const spec_1 = require("./errors/spec");
const assert_1 = __importDefault(require("assert"));
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("./util/preconditions"));
const buffer_1 = require("buffer");
const encoding_1 = require("./encoding");
const crypto_1 = require("./crypto");
const errors_1 = require("./errors");
const util_1 = require("./util");
const _1 = require(".");
const hdErrors = spec_1.ERROR_TYPES.HDPrivateKey.errors;
const MINIMUM_ENTROPY_BITS = 128;
const BITS_TO_BYTES = 1 / 8;
const MAXIMUM_ENTROPY_BITS = 512;
class HDPrivateKey {
    constructor(arg) {
        this.derive = function (arg, hardened) {
            return this.deriveNonCompliantChild(arg, hardened);
        };
        this.deriveChild = function (arg, hardened) {
            if (_.isNumber(arg)) {
                return this._deriveWithNumber(arg, hardened);
            }
            else if (_.isString(arg)) {
                return this._deriveFromString(arg);
            }
            else {
                throw new errors_1.BitcoreError(spec_1.ERROR_TYPES.HDPrivateKey.errors.InvalidDerivationArgument, arg);
            }
        };
        this.deriveNonCompliantChild = function (arg, hardened) {
            if (_.isNumber(arg)) {
                return this._deriveWithNumber(arg, hardened, true);
            }
            else if (_.isString(arg)) {
                return this._deriveFromString(arg, true);
            }
            else {
                throw new errors_1.BitcoreError(spec_1.ERROR_TYPES.HDPrivateKey.errors.InvalidDerivationArgument, arg);
            }
        };
        this._deriveWithNumber = function (index, hardened, nonCompliant) {
            if (!HDPrivateKey.isValidPath(index, hardened)) {
                throw new errors_1.BitcoreError(hdErrors.InvalidPath, index);
            }
            hardened = index >= HDPrivateKey.Hardened ? true : hardened;
            if (index < HDPrivateKey.Hardened && hardened === true) {
                index += HDPrivateKey.Hardened;
            }
            var indexBuffer = util_1.BufferUtil.integerAsBuffer(index);
            var data;
            if (hardened && nonCompliant) {
                var nonZeroPadded = this.privateKey.bn.toBuffer();
                data = util_1.BufferUtil.concat([new buffer_1.Buffer([0]), nonZeroPadded, indexBuffer]);
            }
            else if (hardened) {
                var privateKeyBuffer = this.privateKey.bn.toBuffer({ size: 32 });
                assert_1.default(privateKeyBuffer.length === 32, 'length of private key buffer is expected to be 32 bytes');
                data = util_1.BufferUtil.concat([new buffer_1.Buffer([0]), privateKeyBuffer, indexBuffer]);
            }
            else {
                data = util_1.BufferUtil.concat([this.publicKey.toBuffer(), indexBuffer]);
            }
            var hash = crypto_1.Hash.sha512hmac(data, this._buffers.chainCode);
            var leftPart = crypto_1.BitcoreBN.fromBuffer(hash.slice(0, 32), {
                size: 32
            });
            var chainCode = hash.slice(32, 64);
            var privateKey = new crypto_1.BitcoreBN(leftPart.add(this.privateKey.toBigNumber()).umod(crypto_1.Point.getN())).toBuffer({
                size: 32
            });
            if (!_1.PrivateKey.isValid(privateKey)) {
                return this._deriveWithNumber(index + 1, null, nonCompliant);
            }
            var derived = new HDPrivateKey({
                network: this.network,
                depth: this.depth + 1,
                parentFingerPrint: this.fingerPrint,
                childIndex: index,
                chainCode: chainCode,
                privateKey: privateKey
            });
            return derived;
        };
        this._deriveFromString = function (path, nonCompliant) {
            if (!HDPrivateKey.isValidPath(path)) {
                throw new errors_1.BitcoreError(hdErrors.InvalidPath, path);
            }
            var indexes = HDPrivateKey._getDerivationIndexes(path);
            var derived = indexes.reduce(function (prev, index) {
                return prev._deriveWithNumber(index, null, nonCompliant);
            }, this);
            return derived;
        };
        this._buildFromJSON = function (arg) {
            return this._buildFromObject(JSON.parse(arg));
        };
        this._buildFromObject = function (arg) {
            var buffers = {
                version: arg.network ? util_1.BufferUtil.integerAsBuffer(_1.Network.get(arg.network).xprivkey) : arg.version,
                depth: _.isNumber(arg.depth) ? util_1.BufferUtil.integerAsSingleByteBuffer(arg.depth) : arg.depth,
                parentFingerPrint: _.isNumber(arg.parentFingerPrint) ? util_1.BufferUtil.integerAsBuffer(arg.parentFingerPrint) : arg.parentFingerPrint,
                childIndex: _.isNumber(arg.childIndex) ? util_1.BufferUtil.integerAsBuffer(arg.childIndex) : arg.childIndex,
                chainCode: _.isString(arg.chainCode) ? util_1.BufferUtil.hexToBuffer(arg.chainCode) : arg.chainCode,
                privateKey: (_.isString(arg.privateKey) && util_1.JSUtil.isHexa(arg.privateKey)) ? util_1.BufferUtil.hexToBuffer(arg.privateKey) : arg.privateKey,
                checksum: arg.checksum ? (arg.checksum.length ? arg.checksum : util_1.BufferUtil.integerAsBuffer(arg.checksum)) : undefined
            };
            return this._buildFromBuffers(buffers);
        };
        this._buildFromSerialized = function (arg) {
            var decoded = encoding_1.Base58Check.decode(arg);
            var buffers = {
                version: decoded.slice(HDPrivateKey.VersionStart, HDPrivateKey.VersionEnd),
                depth: decoded.slice(HDPrivateKey.DepthStart, HDPrivateKey.DepthEnd),
                parentFingerPrint: decoded.slice(HDPrivateKey.ParentFingerPrintStart, HDPrivateKey.ParentFingerPrintEnd),
                childIndex: decoded.slice(HDPrivateKey.ChildIndexStart, HDPrivateKey.ChildIndexEnd),
                chainCode: decoded.slice(HDPrivateKey.ChainCodeStart, HDPrivateKey.ChainCodeEnd),
                privateKey: decoded.slice(HDPrivateKey.PrivateKeyStart, HDPrivateKey.PrivateKeyEnd),
                checksum: decoded.slice(HDPrivateKey.ChecksumStart, HDPrivateKey.ChecksumEnd),
                xprivkey: arg
            };
            return this._buildFromBuffers(buffers);
        };
        this._calcHDPublicKey = function () {
            if (!this._hdPublicKey) {
                var HDPublicKey = require('./hdpublickey');
                this._hdPublicKey = new HDPublicKey(this);
            }
        };
        this._buildFromBuffers = function (arg) {
            HDPrivateKey._validateBufferArguments(arg);
            util_1.JSUtil.defineImmutable(this, {
                _buffers: arg
            });
            var sequence = [
                arg.version, arg.depth, arg.parentFingerPrint, arg.childIndex, arg.chainCode,
                util_1.BufferUtil.emptyBuffer(1), arg.privateKey
            ];
            var concat = buffer_1.Buffer.concat(sequence);
            if (!arg.checksum || !arg.checksum.length) {
                arg.checksum = encoding_1.Base58Check.checksum(concat);
            }
            else {
                if (arg.checksum.toString() !== encoding_1.Base58Check.checksum(concat).toString()) {
                    throw new errors_1.BitcoreError(spec_1.ERROR_TYPES.InvalidB58Checksum, concat);
                }
            }
            var network = _1.Network.get(util_1.BufferUtil.integerFromBuffer(arg.version));
            var xprivkey;
            xprivkey = encoding_1.Base58Check.encode(buffer_1.Buffer.concat(sequence));
            arg.xprivkey = new buffer_1.Buffer(xprivkey);
            var privateKey = new _1.PrivateKey(crypto_1.BitcoreBN.fromBuffer(arg.privateKey), network);
            var publicKey = privateKey.toPublicKey();
            var size = HDPrivateKey.ParentFingerPrintSize;
            var fingerPrint = crypto_1.Hash.sha256ripemd160(publicKey.toBuffer()).slice(0, size);
            util_1.JSUtil.defineImmutable(this, {
                xprivkey: xprivkey,
                network: network,
                depth: util_1.BufferUtil.integerFromSingleByteBuffer(arg.depth),
                privateKey: privateKey,
                publicKey: publicKey,
                fingerPrint: fingerPrint
            });
            this._hdPublicKey = null;
            return this;
        };
        this.toString = function () {
            return this.xprivkey;
        };
        this.inspect = function () {
            return '<HDPrivateKey: ' + this.xprivkey + '>';
        };
        this.toObject = function toObject() {
            return {
                network: _1.Network.get(util_1.BufferUtil.integerFromBuffer(this._buffers.version), 'xprivkey').name,
                depth: util_1.BufferUtil.integerFromSingleByteBuffer(this._buffers.depth),
                fingerPrint: util_1.BufferUtil.integerFromBuffer(this.fingerPrint),
                parentFingerPrint: util_1.BufferUtil.integerFromBuffer(this._buffers.parentFingerPrint),
                childIndex: util_1.BufferUtil.integerFromBuffer(this._buffers.childIndex),
                chainCode: util_1.BufferUtil.bufferToHex(this._buffers.chainCode),
                privateKey: this.privateKey.toBuffer().toString('hex'),
                checksum: util_1.BufferUtil.integerFromBuffer(this._buffers.checksum),
                xprivkey: this.xprivkey
            };
        };
        this.toJSON = this.toObject;
        this.toBuffer = function () {
            return util_1.BufferUtil.copy(this._buffers.xprivkey);
        };
        if (arg instanceof HDPrivateKey) {
            return arg;
        }
        if (!(this instanceof HDPrivateKey)) {
            return new HDPrivateKey(arg);
        }
        if (!arg) {
            return this._generateRandomly();
        }
        if ((typeof arg === 'string' ||
            typeof arg === 'number' ||
            arg instanceof _1.Network) &&
            _1.Network.get(arg)) {
            return this._generateRandomly(arg);
        }
        else if (_.isString(arg) || util_1.BufferUtil.isBuffer(arg)) {
            if (HDPrivateKey.isValidSerialized(arg)) {
                this._buildFromSerialized(arg);
            }
            else if (util_1.JSUtil.isValidJSON(arg)) {
                this._buildFromJSON(arg);
            }
            else if (util_1.BufferUtil.isBuffer(arg) && HDPrivateKey.isValidSerialized(arg.toString())) {
                this._buildFromSerialized(arg.toString());
            }
            else {
                throw HDPrivateKey.getSerializedError(arg);
            }
        }
        else if (_.isObject(arg)) {
            this._buildFromObject(arg);
        }
        else {
            throw new errors_1.BitcoreError(spec_1.ERROR_TYPES.HDPrivateKey.errors.UnrecognizedArgument, arg);
        }
    }
    static isValidPath(arg, hardened = false) {
        if (_.isString(arg)) {
            var indexes = HDPrivateKey._getDerivationIndexes(arg);
            return indexes !== null && _.every(indexes, HDPrivateKey.isValidPath);
        }
        if (_.isNumber(arg)) {
            if (arg < HDPrivateKey.Hardened && hardened === true) {
                arg += HDPrivateKey.Hardened;
            }
            return arg >= 0 && arg < HDPrivateKey.MaxIndex;
        }
        return false;
    }
    ;
    static isValidSerialized(data, network) {
        return !HDPrivateKey.getSerializedError(data, network);
    }
    ;
    static getSerializedError(data, network) {
        if (!(_.isString(data) || util_1.BufferUtil.isBuffer(data))) {
            return new errors_1.BitcoreError(hdErrors.UnrecognizedArgument, 'Expected string or buffer');
        }
        if (!encoding_1.Base58.validCharacters(data)) {
            return new errors_1.BitcoreError(spec_1.ERROR_TYPES.InvalidB58Char, '(unknown)', data);
        }
        try {
            data = encoding_1.Base58Check.decode(data);
        }
        catch (e) {
            return new errors_1.BitcoreError(spec_1.ERROR_TYPES.InvalidB58Checksum, data);
        }
        if (data.length !== HDPrivateKey.DataLength) {
            return new errors_1.BitcoreError(hdErrors.InvalidLength, data);
        }
        if (!_.isUndefined(network)) {
            var error = HDPrivateKey._validateNetwork(data, network);
            if (error) {
                return error;
            }
        }
        return null;
    }
    ;
    _generateRandomly(network = _1.Network.defaultNetwork) {
        return HDPrivateKey.fromSeed(crypto_1.Random.getRandomBuffer(64), network);
    }
    ;
    get xpubkey() {
        this._calcHDPublicKey();
        return this._hdPublicKey.xpubkey;
    }
    get hdPublicKey() {
        this._calcHDPublicKey();
        return this._hdPublicKey;
    }
}
exports.HDPrivateKey = HDPrivateKey;
HDPrivateKey.DefaultDepth = 0;
HDPrivateKey.DefaultFingerprint = 0;
HDPrivateKey.DefaultChildIndex = 0;
HDPrivateKey.Hardened = 0x80000000;
HDPrivateKey.MaxIndex = 2 * HDPrivateKey.Hardened;
HDPrivateKey.RootElementAlias = ['m', 'M', 'm\'', 'M\''];
HDPrivateKey.VersionSize = 4;
HDPrivateKey.DepthSize = 1;
HDPrivateKey.ParentFingerPrintSize = 4;
HDPrivateKey.ChildIndexSize = 4;
HDPrivateKey.ChainCodeSize = 32;
HDPrivateKey.PrivateKeySize = 32;
HDPrivateKey.CheckSumSize = 4;
HDPrivateKey.DataLength = 78;
HDPrivateKey.SerializedByteSize = 82;
HDPrivateKey.VersionStart = 0;
HDPrivateKey.VersionEnd = HDPrivateKey.VersionStart + HDPrivateKey.VersionSize;
HDPrivateKey.DepthStart = HDPrivateKey.VersionEnd;
HDPrivateKey.DepthEnd = HDPrivateKey.DepthStart + HDPrivateKey.DepthSize;
HDPrivateKey.ParentFingerPrintStart = HDPrivateKey.DepthEnd;
HDPrivateKey.ParentFingerPrintEnd = HDPrivateKey.ParentFingerPrintStart + HDPrivateKey.ParentFingerPrintSize;
HDPrivateKey.ChildIndexStart = HDPrivateKey.ParentFingerPrintEnd;
HDPrivateKey.ChildIndexEnd = HDPrivateKey.ChildIndexStart + HDPrivateKey.ChildIndexSize;
HDPrivateKey.ChainCodeStart = HDPrivateKey.ChildIndexEnd;
HDPrivateKey.ChainCodeEnd = HDPrivateKey.ChainCodeStart + HDPrivateKey.ChainCodeSize;
HDPrivateKey.PrivateKeyStart = HDPrivateKey.ChainCodeEnd + 1;
HDPrivateKey.PrivateKeyEnd = HDPrivateKey.PrivateKeyStart + HDPrivateKey.PrivateKeySize;
HDPrivateKey.ChecksumStart = HDPrivateKey.PrivateKeyEnd;
HDPrivateKey.ChecksumEnd = HDPrivateKey.ChecksumStart + HDPrivateKey.CheckSumSize;
HDPrivateKey._getDerivationIndexes = function (path) {
    var steps = path.split('/');
    if (_.includes(HDPrivateKey.RootElementAlias, path)) {
        return [];
    }
    if (!_.includes(HDPrivateKey.RootElementAlias, steps[0])) {
        return null;
    }
    var indexes = steps.slice(1).map(function (step) {
        var isHardened = step.slice(-1) === '\'';
        if (isHardened) {
            step = step.slice(0, -1);
        }
        if (!step || step[0] === '-') {
            return NaN;
        }
        var index = +step;
        if (isHardened) {
            index += HDPrivateKey.Hardened;
        }
        return index;
    });
    return _.some(indexes, isNaN) ? null : indexes;
};
HDPrivateKey._validateNetwork = function (data, networkArg) {
    var network = _1.Network.get(networkArg);
    if (!network) {
        return new errors_1.BitcoreError(spec_1.ERROR_TYPES.InvalidNetworkArgument, networkArg);
    }
    var version = data.slice(0, 4);
    if (util_1.BufferUtil.integerFromBuffer(version) !== network.xprivkey) {
        return new errors_1.BitcoreError(spec_1.ERROR_TYPES.InvalidNetwork, version);
    }
    return null;
};
HDPrivateKey.fromString = function (arg) {
    preconditions_1.default.checkArgument(_.isString(arg), 'No valid string was provided');
    return new HDPrivateKey(arg);
};
HDPrivateKey.fromObject = function (arg) {
    preconditions_1.default.checkArgument(_.isObject(arg), 'No valid argument was provided');
    return new HDPrivateKey(arg);
};
HDPrivateKey.fromSeed = function (hexa, network) {
    if (util_1.JSUtil.isHexaString(hexa)) {
        hexa = util_1.BufferUtil.hexToBuffer(hexa);
    }
    if (!buffer_1.Buffer.isBuffer(hexa)) {
        throw new errors_1.BitcoreError(hdErrors.InvalidEntropyArgument, hexa);
    }
    if (hexa.length < MINIMUM_ENTROPY_BITS * BITS_TO_BYTES) {
        throw new errors_1.BitcoreError(hdErrors.InvalidEntropyArgument.errors.NotEnoughEntropy, hexa);
    }
    if (hexa.length > MAXIMUM_ENTROPY_BITS * BITS_TO_BYTES) {
        throw new errors_1.BitcoreError(hdErrors.InvalidEntropyArgument.errors.TooMuchEntropy, hexa);
    }
    var hash = crypto_1.Hash.sha512hmac(hexa, new buffer_1.Buffer('Bitcoin seed'));
    return new HDPrivateKey({
        network: _1.Network.get(network) || _1.Network.defaultNetwork,
        depth: 0,
        parentFingerPrint: 0,
        childIndex: 0,
        privateKey: hash.slice(0, 32),
        chainCode: hash.slice(32, 64)
    });
};
HDPrivateKey._validateBufferArguments = function (arg) {
    var checkBuffer = function (name, size) {
        var buff = arg[name];
        assert_1.default(util_1.BufferUtil.isBuffer(buff), name + ' argument is not a buffer');
        assert_1.default(buff.length === size, name + ' has not the expected size: found ' + buff.length + ', expected ' + size);
    };
    checkBuffer('version', HDPrivateKey.VersionSize);
    checkBuffer('depth', HDPrivateKey.DepthSize);
    checkBuffer('parentFingerPrint', HDPrivateKey.ParentFingerPrintSize);
    checkBuffer('childIndex', HDPrivateKey.ChildIndexSize);
    checkBuffer('chainCode', HDPrivateKey.ChainCodeSize);
    checkBuffer('privateKey', HDPrivateKey.PrivateKeySize);
    if (arg.checksum && arg.checksum.length) {
        checkBuffer('checksum', HDPrivateKey.CheckSumSize);
    }
};
HDPrivateKey.fromBuffer = function (arg) {
    return new HDPrivateKey(arg.toString());
};
//# sourceMappingURL=hdprivatekey.js.map