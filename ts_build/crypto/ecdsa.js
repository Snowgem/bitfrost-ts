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
exports.ECDSA = void 0;
const publickey_1 = require("../publickey");
const util_1 = require("../util");
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("../util/preconditions"));
const signature_1 = require("./signature");
const bn_1 = require("./bn");
const point_1 = require("./point");
const random_1 = require("./random");
const hash_1 = require("./hash");
class ECDSA {
    constructor(obj) {
        this.set = function (obj) {
            this.hashbuf = obj.hashbuf || this.hashbuf;
            this.endian = obj.endian || this.endian;
            this.privkey = obj.privkey || this.privkey;
            this.pubkey = obj.pubkey || (this.privkey ? this.privkey.publicKey : this.pubkey);
            this.sig = obj.sig || this.sig;
            this.k = obj.k || this.k;
            this.verified = obj.verified || this.verified;
            return this;
        };
        this.privkey2pubkey = function () {
            this.pubkey = this.privkey.toPublicKey();
        };
        this.calci = function () {
            for (var i = 0; i < 4; i++) {
                this.sig.i = i;
                var Qprime;
                try {
                    Qprime = this.toPublicKey();
                }
                catch (e) {
                    console.error(e);
                    continue;
                }
                if (Qprime.point.eq(this.pubkey.point)) {
                    this.sig.compressed = this.pubkey.compressed;
                    return this;
                }
            }
            this.sig.i = undefined;
            throw new Error('Unable to find valid recovery factor');
        };
        this.randomK = function () {
            var N = point_1.Point.getN();
            var k;
            do {
                k = bn_1.BitcoreBN.fromBuffer(random_1.Random.getRandomBuffer(32));
            } while (!(k.lt(N) && k.gt(bn_1.BitcoreBN.Zero)));
            this.k = k;
            return this;
        };
        this.deterministicK = function (badrs) {
            if (_.isUndefined(badrs)) {
                badrs = 0;
            }
            var v = new Buffer(32);
            v.fill(0x01);
            var k = new Buffer(32);
            k.fill(0x00);
            var x = this.privkey.bn.toBuffer({
                size: 32
            });
            var hashbuf = this.endian === 'little' ? util_1.BufferUtil.reverse(this.hashbuf) : this.hashbuf;
            k = hash_1.Hash.sha256hmac(Buffer.concat([v, new Buffer([0x00]), x, hashbuf]), k);
            v = hash_1.Hash.sha256hmac(v, k);
            k = hash_1.Hash.sha256hmac(Buffer.concat([v, new Buffer([0x01]), x, hashbuf]), k);
            v = hash_1.Hash.sha256hmac(v, k);
            v = hash_1.Hash.sha256hmac(v, k);
            var T = bn_1.BitcoreBN.fromBuffer(v);
            var N = point_1.Point.getN();
            for (var i = 0; i < badrs || !(T.lt(N) && T.gt(bn_1.BitcoreBN.Zero)); i++) {
                k = hash_1.Hash.sha256hmac(Buffer.concat([v, new Buffer([0x00])]), k);
                v = hash_1.Hash.sha256hmac(v, k);
                v = hash_1.Hash.sha256hmac(v, k);
                T = bn_1.BitcoreBN.fromBuffer(v);
            }
            this.k = T;
            return this;
        };
        this.toPublicKey = function () {
            var i = this.sig.i;
            preconditions_1.default.checkArgument(i === 0 || i === 1 || i === 2 || i === 3, new Error('i must be equal to 0, 1, 2, or 3'));
            var e = bn_1.BitcoreBN.fromBuffer(this.hashbuf);
            var r = this.sig.r;
            var s = this.sig.s;
            var isYOdd = i & 1;
            var isSecondKey = i >> 1;
            var n = point_1.Point.getN();
            var G = point_1.Point.getG();
            var x = isSecondKey ? r.add(n) : r;
            var R = point_1.Point.fromX(isYOdd, x);
            var nR = R.mul(n);
            if (!nR.isInfinity()) {
                throw new Error('nR is not a valid curve point');
            }
            var eNeg = e.neg().umod(n);
            var rInv = r.invm(n);
            var Q = R.mul(s).add(G.mul(eNeg)).mul(rInv);
            var pubkey = publickey_1.PublicKey.fromPoint(Q, this.sig.compressed);
            return pubkey;
        };
        this.sigError = function () {
            if (!util_1.BufferUtil.isBuffer(this.hashbuf) || this.hashbuf.length !== 32) {
                return 'hashbuf must be a 32 byte buffer';
            }
            var r = this.sig.r;
            var s = this.sig.s;
            if (!(r.gt(bn_1.BitcoreBN.Zero) && r.lt(point_1.Point.getN())) || !(s.gt(bn_1.BitcoreBN.Zero) && s.lt(point_1.Point.getN()))) {
                return 'r and s not in range';
            }
            var e = bn_1.BitcoreBN.fromBuffer(this.hashbuf, this.endian ? {
                endian: this.endian
            } : undefined);
            var n = point_1.Point.getN();
            var sinv = s.invm(n);
            var u1 = sinv.mul(e).umod(n);
            var u2 = sinv.mul(r).umod(n);
            var p = point_1.Point.getG().mulAdd(u1, this.pubkey.point, u2);
            if (p.isInfinity()) {
                return 'p is infinity';
            }
            if (p.getX().umod(n).cmp(r) !== 0) {
                return 'Invalid signature';
            }
            else {
                return false;
            }
        };
        this._findSignature = function (d, e) {
            var N = point_1.Point.getN();
            var G = point_1.Point.getG();
            var badrs = 0;
            var k, Q, r, s;
            do {
                if (!this.k || badrs > 0) {
                    this.deterministicK(badrs);
                }
                badrs++;
                k = this.k;
                Q = G.mul(k);
                r = Q.x.umod(N);
                s = k.invm(N).mul(e.add(d.mul(r))).umod(N);
            } while (r.cmp(bn_1.BitcoreBN.Zero) <= 0 || s.cmp(bn_1.BitcoreBN.Zero) <= 0);
            s = ECDSA.toLowS(s);
            return {
                s: s,
                r: r
            };
        };
        this.sign = function () {
            var hashbuf = this.hashbuf;
            var privkey = this.privkey;
            var d = privkey.bn;
            preconditions_1.default.checkState(hashbuf && privkey && d, new Error('invalid parameters'));
            preconditions_1.default.checkState(util_1.BufferUtil.isBuffer(hashbuf) && hashbuf.length === 32, new Error('hashbuf must be a 32 byte buffer'));
            var e = bn_1.BitcoreBN.fromBuffer(hashbuf, this.endian ? {
                endian: this.endian
            } : undefined);
            var obj = this._findSignature(d, e);
            obj.compressed = this.pubkey.compressed;
            this.sig = new signature_1.Signature(obj);
            return this;
        };
        this.signRandomK = function () {
            this.randomK();
            return this.sign();
        };
        this.toString = function () {
            const obj = {};
            if (this.hashbuf) {
                obj.hashbuf = this.hashbuf.toString('hex');
            }
            if (this.privkey) {
                obj.privkey = this.privkey.toString();
            }
            if (this.pubkey) {
                obj.pubkey = this.pubkey.toString();
            }
            if (this.sig) {
                obj.sig = this.sig.toString();
            }
            if (this.k) {
                obj.k = this.k.toString();
            }
            return JSON.stringify(obj);
        };
        this.verify = function () {
            if (!this.sigError()) {
                this.verified = true;
            }
            else {
                this.verified = false;
            }
            return this;
        };
        if (!(this instanceof ECDSA)) {
            return new ECDSA(obj);
        }
        if (obj) {
            this.set(obj);
        }
    }
    ;
}
exports.ECDSA = ECDSA;
ECDSA.fromString = function (str) {
    var obj = JSON.parse(str);
    return new ECDSA(obj);
};
ECDSA.toLowS = function (s) {
    if (s.gt(bn_1.BitcoreBN.fromBuffer(new Buffer('7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', 'hex')))) {
        s = point_1.Point.getN().sub(s);
    }
    return s;
};
ECDSA.sign = function (hashbuf, privkey, endian) {
    return new ECDSA().set({
        hashbuf: hashbuf,
        endian: endian,
        privkey: privkey
    }).sign().sig;
};
ECDSA.verify = function (hashbuf, sig, pubkey, endian) {
    return new ECDSA().set({
        hashbuf: hashbuf,
        endian: endian,
        sig: sig,
        pubkey: pubkey
    }).verify().verified;
};
//# sourceMappingURL=ecdsa.js.map