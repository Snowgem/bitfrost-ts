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
exports.PublicKey = void 0;
const preconditions_1 = __importDefault(require("./util/preconditions"));
const _ = __importStar(require("lodash"));
const bn_1 = require("./crypto/bn");
const point_1 = require("./crypto/point");
const hash_1 = require("./crypto/hash");
const networks_1 = require("./networks");
const privatekey_1 = require("./privatekey");
class PublicKey {
    constructor(data, extra) {
        this._classifyArgs = function (data, extra) {
            let info = {
                compressed: _.isUndefined(extra.compressed) || extra.compressed
            };
            if (data instanceof point_1.Point) {
                info.point = data;
            }
            else if (data.x && data.y) {
                info = PublicKey._transformObject(data);
            }
            else if (typeof (data) === 'string') {
                info = PublicKey._transformDER(new Buffer(data, 'hex'));
            }
            else if (PublicKey._isBuffer(data)) {
                info = PublicKey._transformDER(data);
            }
            else if (PublicKey._isPrivateKey(data)) {
                info = PublicKey._transformPrivateKey(data);
            }
            else {
                throw new TypeError('First argument is an unrecognized data format.');
            }
            if (!info.network) {
                info.network = _.isUndefined(extra.network) ? undefined : networks_1.Network.get(extra.network);
            }
            return info;
        };
        this.toObject = function toObject() {
            return {
                x: this.point.getX().toString('hex', 2),
                y: this.point.getY().toString('hex', 2),
                compressed: this.compressed
            };
        };
        this.toJson = this.toObject;
        this.toBuffer = function () {
            var x = this.point.getX();
            var y = this.point.getY();
            var xbuf = x.toBuffer({
                size: 32
            });
            var ybuf = y.toBuffer({
                size: 32
            });
            var prefix;
            if (!this.compressed) {
                prefix = new Buffer([0x04]);
                return Buffer.concat([prefix, xbuf, ybuf]);
            }
            else {
                var odd = ybuf[ybuf.length - 1] % 2;
                if (odd) {
                    prefix = new Buffer([0x03]);
                }
                else {
                    prefix = new Buffer([0x02]);
                }
                return Buffer.concat([prefix, xbuf]);
            }
        };
        this.toDER = this.toBuffer;
        this._getID = function _getID() {
            return hash_1.Hash.sha256ripemd160(this.toBuffer());
        };
        this.toString = function () {
            return this.toDER().toString('hex');
        };
        this.inspect = function () {
            return '<PublicKey: ' + this.toString() +
                (this.compressed ? '' : ', uncompressed') + '>';
        };
        if (!(this instanceof PublicKey)) {
            return new PublicKey(data, extra);
        }
        preconditions_1.default.checkArgument(data, 'First argument is required, please include public key data.');
        if (data instanceof PublicKey) {
            return data;
        }
        extra = extra || {};
        var info = this._classifyArgs(data, extra);
        info.point.validate();
    }
    ;
    toAddress(network) {
        var Address = require('./address');
        return Address.fromPublicKey(this, network || this.network);
    }
    ;
}
exports.PublicKey = PublicKey;
PublicKey._isPrivateKey = function (param) {
    return param instanceof privatekey_1.PrivateKey;
};
PublicKey._isBuffer = function (param) {
    return (param instanceof Buffer) || (param instanceof Uint8Array);
};
PublicKey._transformPrivateKey = function (privkey) {
    preconditions_1.default.checkArgument(PublicKey._isPrivateKey(privkey), 'Must be an instance of PrivateKey');
    const info = {};
    info.point = point_1.Point.getG().mul(privkey.bn);
    info.compressed = privkey.compressed;
    info.network = privkey.network;
    return info;
};
PublicKey._transformDER = function (buf, strict = true) {
    preconditions_1.default.checkArgument(PublicKey._isBuffer(buf), 'Must be a hex buffer of DER encoded public key');
    let info = {};
    strict = _.isUndefined(strict) ? true : strict;
    var x;
    var y;
    var xbuf;
    var ybuf;
    if (buf[0] === 0x04 || (!strict && (buf[0] === 0x06 || buf[0] === 0x07))) {
        xbuf = buf.slice(1, 33);
        ybuf = buf.slice(33, 65);
        if (xbuf.length !== 32 || ybuf.length !== 32 || buf.length !== 65) {
            throw new TypeError('Length of x and y must be 32 bytes');
        }
        x = new bn_1.BitcoreBN(xbuf);
        y = new bn_1.BitcoreBN(ybuf);
        info.point = new point_1.Point(x, y);
        info.compressed = false;
    }
    else if (buf[0] === 0x03) {
        xbuf = buf.slice(1);
        x = new bn_1.BitcoreBN(xbuf);
        info = PublicKey._transformX(true, x);
        info.compressed = true;
    }
    else if (buf[0] === 0x02) {
        xbuf = buf.slice(1);
        x = new bn_1.BitcoreBN(xbuf);
        info = PublicKey._transformX(false, x);
        info.compressed = true;
    }
    else {
        throw new TypeError('Invalid DER format public key');
    }
    return info;
};
PublicKey._transformX = function (odd, x) {
    preconditions_1.default.checkArgument(typeof odd === 'boolean', 'Must specify whether y is odd or not (true or false)');
    const info = { point: point_1.Point.fromX(odd, x) };
    return info;
};
PublicKey._transformObject = function (json) {
    var x = new bn_1.BitcoreBN(json.x, 'hex');
    var y = new bn_1.BitcoreBN(json.y, 'hex');
    var point = new point_1.Point(x, y);
    return new PublicKey(point, {
        compressed: json.compressed
    });
};
PublicKey.fromPrivateKey = function (privkey) {
    preconditions_1.default.checkArgument(PublicKey._isPrivateKey(privkey), 'Must be an instance of PrivateKey');
    const info = PublicKey._transformPrivateKey(privkey);
    return new PublicKey(info.point, {
        compressed: info.compressed,
        network: info.network
    });
};
PublicKey.fromDER = function (buf, strict) {
    preconditions_1.default.checkArgument(PublicKey._isBuffer(buf), 'Must be a hex buffer of DER encoded public key');
    var info = PublicKey._transformDER(buf, strict);
    return new PublicKey(info.point, {
        compressed: info.compressed
    });
};
PublicKey.fromBuffer = PublicKey.fromDER;
PublicKey.fromPoint = function (point, compressed = false) {
    preconditions_1.default.checkArgument(point instanceof point_1.Point, 'First argument must be an instance of Point.');
    return new PublicKey(point, {
        compressed: compressed
    });
};
PublicKey.fromString = function (str, encoding) {
    var buf = new Buffer(str, encoding || 'hex');
    var info = PublicKey._transformDER(buf);
    return new PublicKey(info.point, {
        compressed: info.compressed
    });
};
PublicKey.fromX = function (odd, x) {
    var info = PublicKey._transformX(odd, x);
    return new PublicKey(info.point, {
        compressed: info.compressed
    });
};
PublicKey.getValidationError = function (data) {
    var error;
    try {
        const key = new PublicKey(data);
    }
    catch (e) {
        error = e;
    }
    return error;
};
PublicKey.isValid = function (data) {
    return !PublicKey.getValidationError(data);
};
//# sourceMappingURL=publickey.js.map