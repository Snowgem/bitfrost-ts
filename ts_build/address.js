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
exports.Address = void 0;
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("./util/preconditions"));
const errors_1 = require("./errors");
const encoding_1 = require("./encoding");
const _1 = require(".");
const crypto_1 = require("./crypto");
const util_1 = require("./util");
const script_1 = require("./script");
class Address {
    constructor(data, network, type) {
        this._classifyArguments = function (data, network, type) {
            if ((data instanceof Buffer || data instanceof Uint8Array) && data.length === 20) {
                return Address._transformHash(data);
            }
            else if ((data instanceof Buffer || data instanceof Uint8Array) && data.length === 21) {
                return Address._transformBuffer(data, network, type);
            }
            else if (data instanceof _1.PublicKey) {
                return Address._transformPublicKey(data);
            }
            else if (data instanceof script_1.Script) {
                return Address._transformScript(data, network);
            }
            else if (typeof (data) === 'string') {
                return Address._transformString(data, network, type);
            }
            else if (_.isObject(data)) {
                return Address._transformObject(data);
            }
            else {
                throw new TypeError('First argument is an unrecognized data format.');
            }
        };
        this.isPayToPublicKeyHash = function () {
            return this.type === Address.PayToPublicKeyHash;
        };
        this.isPayToScriptHash = function () {
            return this.type === Address.PayToScriptHash;
        };
        this.toBuffer = function () {
            var version = new Buffer(2);
            version.writeUInt16BE(this.network[this.type], 0);
            var buf = Buffer.concat([version, this.hashBuffer]);
            return buf;
        };
        this.toObject = function toObject() {
            return {
                hash: this.hashBuffer.toString('hex'),
                type: this.type,
                network: this.network.toString()
            };
        };
        this.toJSON = this.toObject;
        this.toString = function () {
            return encoding_1.Base58Check.encode(this.toBuffer());
        };
        this.inspect = function () {
            return '<Address: ' + this.toString() + ', type: ' + this.type + ', network: ' + this.network + '>';
        };
        if (!(this instanceof Address)) {
            return new Address(data, network, type);
        }
        if (_.isArray(data) && _.isNumber(network)) {
            return Address.createMultisig(data, network, type);
        }
        if (data instanceof Address) {
            return data;
        }
        preconditions_1.default.checkArgument(data, 'First argument is required, please include address data.', 'guide/address.html');
        if (network && !_1.Network.get(network)) {
            throw new TypeError('Second argument must be "livenet" or "testnet".');
        }
        if (type && (type !== Address.PayToPublicKeyHash && type !== Address.PayToScriptHash)) {
            throw new TypeError('Third argument must be "pubkeyhash" or "scripthash".');
        }
        var info = this._classifyArguments(data, network, type);
        info.network = info.network || _1.Network.get(network) || _1.Network.defaultNetwork;
        info.type = info.type || type || Address.PayToPublicKeyHash;
        util_1.JSUtil.defineImmutable(this, {
            hashBuffer: info.hashBuffer,
            network: info.network,
            type: info.type
        });
        return this;
    }
    static _transformBuffer(buffer, network, type) {
        if (!(buffer instanceof Buffer) && !(buffer instanceof Uint8Array)) {
            throw new TypeError('Address supplied is not a buffer.');
        }
        if (buffer.length !== 2 + 20) {
            throw new TypeError('Address buffers must be exactly 22 bytes.');
        }
        var networkObj = _1.Network.get(network);
        var bufferVersion = Address._classifyFromVersion(buffer, _.isObject(network) ? network.name : undefined);
        if (network && !networkObj) {
            throw new TypeError('Unknown network');
        }
        if (!bufferVersion.network || (networkObj && networkObj !== bufferVersion.network)) {
            throw new TypeError('Address has mismatched network type.');
        }
        if (!bufferVersion.type || (type && type !== bufferVersion.type)) {
            throw new TypeError('Address has mismatched type.');
        }
        const info = {
            hashBuffer: buffer.slice(1),
            network: bufferVersion.network,
            type: bufferVersion.type
        };
        return info;
    }
    ;
    static _transformString(data, network, type) {
        if (typeof (data) !== 'string') {
            throw new TypeError('data parameter supplied is not a string.');
        }
        data = data.trim();
        var addressBuffer = encoding_1.Base58Check.decode(data);
        const info = Address._transformBuffer(addressBuffer, network, type);
        return info;
    }
    ;
    static fromString(str, network, type) {
        var info = Address._transformString(str, network, type);
        return new Address(info.hashBuffer, info.network, info.type);
    }
    ;
    static isValid(data, network, type) {
        return !Address.getValidationError(data, network, type);
    }
    ;
}
exports.Address = Address;
Address.PayToPublicKeyHash = 'pubkeyhash';
Address.PayToScriptHash = 'scripthash';
Address._transformHash = (hash, type = Address.PayToPublicKeyHash) => {
    if (!(hash instanceof Buffer) && !(hash instanceof Uint8Array)) {
        throw new TypeError('Address supplied is not a buffer.');
    }
    if (hash.length !== 20) {
        throw new TypeError('Address hashbuffers must be exactly 20 bytes.');
    }
    return { hashBuffer: hash, network: _1.Network.defaultNetwork, type };
};
Address._transformObject = function (data) {
    preconditions_1.default.checkArgument(data.hash || data.hashBuffer, 'Must provide a `hash` or `hashBuffer` property');
    preconditions_1.default.checkArgument(data.type, 'Must provide a `type` property');
    return {
        hashBuffer: data.hash ? new Buffer(data.hash, 'hex') : data.hashBuffer,
        network: _1.Network.get(data.network) || _1.Network.defaultNetwork,
        type: data.type
    };
};
Address._classifyFromVersion = function (buffer, name) {
    var prefix = buffer[0] * 256 + buffer[1];
    var pubkeyhashNetwork = _1.Network.get(prefix, ['pubkeyhash', name]);
    var scripthashNetwork = _1.Network.get(prefix, ['scripthash', name]);
    if (pubkeyhashNetwork) {
        return {
            network: pubkeyhashNetwork,
            type: Address.PayToPublicKeyHash
        };
    }
    else if (scripthashNetwork) {
        return {
            network: scripthashNetwork,
            type: Address.PayToScriptHash
        };
    }
    return {};
};
Address._transformPublicKey = function (pubkey) {
    if (!(pubkey instanceof _1.PublicKey)) {
        throw new TypeError('Address must be an instance of PublicKey.');
    }
    const info = {
        hashBuffer: crypto_1.Hash.sha256ripemd160(pubkey.toBuffer()),
        type: Address.PayToPublicKeyHash,
        network: _1.Network.defaultNetwork
    };
    return info;
};
Address._transformScript = function (script, network) {
    preconditions_1.default.checkArgument(script instanceof script_1.Script, 'script must be a Script instance');
    var info = script.getAddressInfo(network);
    if (!info) {
        throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Script.errors.CantDeriveAddress, script);
    }
    return info;
};
Address.createMultisig = function (publicKeys, threshold, network) {
    network = network || publicKeys[0].network || _1.Network.defaultNetwork;
    return Address.payingTo(script_1.Script.buildMultisigOut(publicKeys, threshold), network);
};
Address.fromPublicKey = function (data, network) {
    var info = Address._transformPublicKey(data);
    network = network || _1.Network.defaultNetwork;
    return new Address(info.hashBuffer, network, info.type);
};
Address.fromPublicKeyHash = function (hash, network) {
    var info = Address._transformHash(hash);
    return new Address(info.hashBuffer, network, Address.PayToPublicKeyHash);
};
Address.fromScriptHash = function (hash, network) {
    preconditions_1.default.checkArgument(hash, 'hash parameter is required');
    var info = Address._transformHash(hash);
    return new Address(info.hashBuffer, network, Address.PayToScriptHash);
};
Address.payingTo = function (script, network) {
    preconditions_1.default.checkArgument(script, 'script is required');
    preconditions_1.default.checkArgument(script instanceof script_1.Script, 'script must be instance of Script');
    return Address.fromScriptHash(crypto_1.Hash.sha256ripemd160(script.toBuffer()), network);
};
Address.fromScript = function (script, network) {
    preconditions_1.default.checkArgument(script instanceof script_1.Script, 'script must be a Script instance');
    var info = Address._transformScript(script, network);
    return new Address(info.hashBuffer, network, info.type);
};
Address.fromBuffer = function (buffer, network, type) {
    var info = Address._transformBuffer(buffer, network, type);
    return new Address(info.hashBuffer, info.network, info.type);
};
Address.fromObject = function fromObject(obj) {
    preconditions_1.default.checkState(util_1.JSUtil.isHexa(obj.hash), 'Unexpected hash property, "' + obj.hash + '", expected to be hex.');
    var hashBuffer = new Buffer(obj.hash, 'hex');
    return new Address(hashBuffer, obj.network, obj.type);
};
Address.getValidationError = function (data, network, type) {
    var error;
    try {
        new Address(data, network, type);
    }
    catch (e) {
        error = e;
    }
    return error;
};
//# sourceMappingURL=address.js.map