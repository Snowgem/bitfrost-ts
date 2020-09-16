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
exports.PrivateKey = void 0;
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("./util/preconditions"));
const _1 = require(".");
const encoding_1 = require("./encoding");
const crypto_1 = require("./crypto");
const util_1 = require("./util");
class PrivateKey {
    constructor(data, network) {
        this._classifyArguments = function (data, network) {
            let info = {
                compressed: true,
                network: network ? _1.Network.get(network) : _1.Network.defaultNetwork
            };
            if (_.isUndefined(data) || _.isNull(data)) {
                info.bn = PrivateKey._getRandomBN();
            }
            else if (data instanceof crypto_1.BitcoreBN) {
                info.bn = data;
            }
            else if (data instanceof Buffer || data instanceof Uint8Array) {
                info = PrivateKey._transformBuffer(data, network);
            }
            else if (data.bn && data.network) {
                info = PrivateKey._transformObject(data);
            }
            else if (!network && _1.Network.get(data)) {
                info.bn = PrivateKey._getRandomBN();
                info.network = _1.Network.get(data);
            }
            else if (typeof (data) === 'string') {
                if (util_1.JSUtil.isHexa(data)) {
                    info.bn = new crypto_1.BitcoreBN(new Buffer(data, 'hex'));
                }
                else {
                    info = PrivateKey._transformWIF(data, network);
                }
            }
            else {
                throw new TypeError('First argument is an unrecognized data type.');
            }
            return info;
        };
        this.toString = function () {
            return this.toBuffer().toString('hex');
        };
        this.toWIF = function () {
            var network = this.network;
            var compressed = this.compressed;
            var buf;
            if (compressed) {
                buf = Buffer.concat([new Buffer([network.privatekey]),
                    this.bn.toBuffer({ size: 32 }),
                    new Buffer([0x01])]);
            }
            else {
                buf = Buffer.concat([new Buffer([network.privatekey]),
                    this.bn.toBuffer({ size: 32 })]);
            }
            return encoding_1.Base58Check.encode(buf);
        };
        this.toBigNumber = function () {
            return this.bn;
        };
        this.toBuffer = function () {
            return this.bn.toBuffer();
        };
        this.toBufferNoPadding = function () {
            return this.bn.toBuffer();
        };
        this.toPublicKey = function () {
            if (!this._pubkey) {
                this._pubkey = _1.PublicKey.fromPrivateKey(this);
            }
            return this._pubkey;
        };
        this.toAddress = function (network) {
            var pubkey = this.toPublicKey();
            return _1.Address.fromPublicKey(pubkey, network || this.network);
        };
        this.toObject = function toObject() {
            return {
                bn: this.bn.toString('hex'),
                compressed: this.compressed,
                network: this.network.toString()
            };
        };
        this.toJSON = this.toObject;
        this.inspect = function () {
            var uncompressed = !this.compressed ? ', uncompressed' : '';
            return '<PrivateKey: ' + this.toString() + ', network: ' + this.network + uncompressed + '>';
        };
        if (!(this instanceof PrivateKey)) {
            return new PrivateKey(data, network);
        }
        if (data instanceof PrivateKey) {
            return data;
        }
        var info = this._classifyArguments(data, network);
        if (!info.bn || info.bn.cmp(new crypto_1.BitcoreBN(0)) === 0) {
            throw new TypeError('Number can not be equal to zero, undefined, null or false');
        }
        if (!info.bn.lt(crypto_1.Point.getN())) {
            throw new TypeError('Number must be less than N');
        }
        if (typeof (info.network) === 'undefined') {
            throw new TypeError('Must specify the network ("livenet" or "testnet")');
        }
        util_1.JSUtil.defineImmutable(this, {
            bn: info.bn,
            compressed: info.compressed,
            network: info.network
        });
        return this;
    }
    get publicKey() {
        return this.toPublicKey();
    }
    ;
    static isValid(data, network) {
        if (!data) {
            return false;
        }
        return !PrivateKey.getValidationError(data, network);
    }
    ;
}
exports.PrivateKey = PrivateKey;
PrivateKey._getRandomBN = function () {
    var condition;
    var bn;
    do {
        var privbuf = crypto_1.Random.getRandomBuffer(32);
        bn = crypto_1.BitcoreBN.fromBuffer(privbuf);
        condition = bn.lt(crypto_1.Point.getN());
    } while (!condition);
    return bn;
};
PrivateKey._transformBuffer = function (buf, network) {
    const info = {};
    if (buf.length === 32) {
        return PrivateKey._transformBNBuffer(buf, network);
    }
    info.network = _1.Network.get(buf[0], 'privatekey');
    if (!info.network) {
        throw new Error('Invalid network');
    }
    if (network && info.network !== _1.Network.get(network)) {
        throw new TypeError('Private key network mismatch');
    }
    if (buf.length === 1 + 32 + 1 && buf[1 + 32 + 1 - 1] === 1) {
        info.compressed = true;
    }
    else if (buf.length === 1 + 32) {
        info.compressed = false;
    }
    else {
        throw new Error('Length of buffer must be 33 (uncompressed) or 34 (compressed)');
    }
    info.bn = crypto_1.BitcoreBN.fromBuffer(buf.slice(1, 32 + 1));
    return info;
};
PrivateKey._transformBNBuffer = function (buf, network) {
    const info = {};
    info.network = _1.Network.get(network) || _1.Network.defaultNetwork;
    info.bn = crypto_1.BitcoreBN.fromBuffer(buf);
    info.compressed = false;
    return info;
};
PrivateKey._transformWIF = function (str, network) {
    return PrivateKey._transformBuffer(encoding_1.Base58Check.decode(str), network);
};
PrivateKey.fromBuffer = function (arg, network) {
    return new PrivateKey(arg, network);
};
PrivateKey._transformObject = function (json) {
    var bn = new crypto_1.BitcoreBN(json.bn, 'hex');
    var network = _1.Network.get(json.network);
    return {
        bn: bn,
        network: network,
        compressed: json.compressed
    };
};
PrivateKey.fromString = function (str) {
    preconditions_1.default.checkArgument(_.isString(str), 'First argument is expected to be a string.');
    return new PrivateKey(str);
};
PrivateKey.fromWIF = PrivateKey.fromString;
PrivateKey.fromObject = function (obj) {
    preconditions_1.default.checkArgument(_.isObject(obj), 'First argument is expected to be an object.');
    return new PrivateKey(obj);
};
PrivateKey.fromRandom = function (network) {
    var bn = PrivateKey._getRandomBN();
    return new PrivateKey(bn, network);
};
PrivateKey.getValidationError = function (data, network) {
    var error;
    try {
        new PrivateKey(data, network);
    }
    catch (e) {
        error = e;
    }
    return error;
};
//# sourceMappingURL=privatekey.js.map