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
exports.JSDescription = void 0;
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("../util/preconditions"));
const bn_1 = require("../crypto/bn");
const buffer_1 = require("buffer");
const buffer_2 = require("../util/buffer");
const js_1 = require("../util/js");
const bufferwriter_1 = require("../encoding/bufferwriter");
const ZC_NUM_JS_INPUTS = 2;
const ZC_NUM_JS_OUTPUTS = 2;
const ZC_NOTECIPHERTEXT_SIZE = 1 + 8 + 32 + 32 + 512 + 16;
class JSDescription {
    constructor(params) {
        this.toJSON = this.toObject;
        if (!(this instanceof JSDescription)) {
            return new JSDescription(params);
        }
        this.nullifiers = [];
        this.commitments = [];
        this.ciphertexts = [];
        this.macs = [];
        this._vpub_old = null;
        if (params) {
            return this._fromObject(params);
        }
    }
    get vpub_old() {
        return this._vpub_old;
    }
    setVpubOld(num) {
        if (num instanceof bn_1.BitcoreBN) {
            this._vpub_oldBN = num;
            this._vpub_old = num.toNumber();
        }
        else if (_.isString(num)) {
            this._vpub_old = parseInt(num);
            this._vpub_oldBN = bn_1.BitcoreBN.fromNumber(this._vpub_old);
        }
        else {
            preconditions_1.default.checkArgument(js_1.JSUtil.isNaturalNumber(num), 'vpub_old is not a natural number');
            this._vpub_oldBN = bn_1.BitcoreBN.fromNumber(num);
            this._vpub_old = num;
        }
        preconditions_1.default.checkState(js_1.JSUtil.isNaturalNumber(this._vpub_old), 'vpub_old is not a natural number');
    }
    get vpub_new() {
        return this._vpub_new;
    }
    setVpubNew(num) {
        if (num instanceof bn_1.BitcoreBN) {
            this._vpub_newBN = num;
            this._vpub_new = num.toNumber();
        }
        else if (_.isString(num)) {
            this._vpub_new = parseInt(num);
            this._vpub_newBN = bn_1.BitcoreBN.fromNumber(this._vpub_new);
        }
        else {
            preconditions_1.default.checkArgument(js_1.JSUtil.isNaturalNumber(num), 'vpub_new is not a natural number');
            this._vpub_newBN = bn_1.BitcoreBN.fromNumber(num);
            this._vpub_new = num;
        }
        preconditions_1.default.checkState(js_1.JSUtil.isNaturalNumber(this._vpub_new), 'vpub_new is not a natural number');
    }
    static fromObject(obj) {
        preconditions_1.default.checkArgument(_.isObject(obj));
        var jsdesc = new JSDescription();
        return jsdesc._fromObject(obj);
    }
    ;
    _fromObject(params) {
        var nullifiers = [];
        _.each(params.nullifiers, function (nullifier) {
            nullifiers.push(buffer_2.BufferUtil.reverse(new buffer_1.Buffer(nullifier, 'hex')));
        });
        var commitments = [];
        _.each(params.commitments, function (commitment) {
            commitments.push(buffer_2.BufferUtil.reverse(new buffer_1.Buffer(commitment, 'hex')));
        });
        var ciphertexts = [];
        _.each(params.ciphertexts, function (ciphertext) {
            ciphertexts.push(new buffer_1.Buffer(ciphertext, 'hex'));
        });
        var macs = [];
        _.each(params.macs, function (mac) {
            macs.push(buffer_2.BufferUtil.reverse(new buffer_1.Buffer(mac, 'hex')));
        });
        this.setVpubOld(params.vpub_old);
        this.setVpubNew(params.vpub_new);
        this.anchor = buffer_2.BufferUtil.reverse(new buffer_1.Buffer(params.anchor, 'hex'));
        this.nullifiers = nullifiers;
        this.commitments = commitments;
        this.ephemeralKey = buffer_2.BufferUtil.reverse(new buffer_1.Buffer(params.ephemeralKey, 'hex'));
        this.ciphertexts = ciphertexts;
        this.randomSeed = buffer_2.BufferUtil.reverse(new buffer_1.Buffer(params.randomSeed, 'hex'));
        this.macs = macs;
        this.proof = params.proof;
        return this;
    }
    ;
    toObject() {
        var nullifiers = [];
        _.each(this.nullifiers, function (nullifier) {
            nullifiers.push(buffer_2.BufferUtil.reverse(nullifier).toString('hex'));
        });
        var commitments = [];
        _.each(this.commitments, function (commitment) {
            commitments.push(buffer_2.BufferUtil.reverse(commitment).toString('hex'));
        });
        var ciphertexts = [];
        _.each(this.ciphertexts, function (ciphertext) {
            ciphertexts.push(ciphertext.toString('hex'));
        });
        var macs = [];
        _.each(this.macs, function (mac) {
            macs.push(buffer_2.BufferUtil.reverse(mac).toString('hex'));
        });
        var obj = {
            vpub_old: this.vpub_old,
            vpub_new: this.vpub_new,
            anchor: buffer_2.BufferUtil.reverse(this.anchor).toString('hex'),
            nullifiers: nullifiers,
            commitments: commitments,
            ephemeralKey: buffer_2.BufferUtil.reverse(this.ephemeralKey).toString('hex'),
            ciphertexts: ciphertexts,
            randomSeed: buffer_2.BufferUtil.reverse(this.randomSeed).toString('hex'),
            macs: macs,
            proof: this.proof,
        };
        return obj;
    }
    ;
    static fromBufferReader(br, useGrothFlagParam) {
        var i;
        var jsdesc = new JSDescription();
        jsdesc.setVpubOld(br.readUInt64LEBN());
        jsdesc.setVpubNew(br.readUInt64LEBN());
        jsdesc.anchor = br.read(32);
        for (i = 0; i < ZC_NUM_JS_INPUTS; i++) {
            jsdesc.nullifiers.push(br.read(32));
        }
        for (i = 0; i < ZC_NUM_JS_OUTPUTS; i++) {
            jsdesc.commitments.push(br.read(32));
        }
        jsdesc.ephemeralKey = br.read(32);
        jsdesc.randomSeed = br.read(32);
        for (i = 0; i < ZC_NUM_JS_INPUTS; i++) {
            jsdesc.macs.push(br.read(32));
        }
        var useGrothFlag = useGrothFlagParam || false;
        if (!useGrothFlag) {
            jsdesc.proof = br.read(296);
        }
        else {
            jsdesc.proof = br.read(48 + 96 + 48);
        }
        for (i = 0; i < ZC_NUM_JS_OUTPUTS; i++) {
            jsdesc.ciphertexts.push(br.read(ZC_NOTECIPHERTEXT_SIZE));
        }
        return jsdesc;
    }
    ;
    toBufferWriter(writer) {
        var i;
        if (!writer) {
            writer = new bufferwriter_1.BufferWriter();
        }
        writer.writeUInt64LEBN(this._vpub_oldBN);
        writer.writeUInt64LEBN(this._vpub_newBN);
        writer.write(this.anchor);
        for (i = 0; i < ZC_NUM_JS_INPUTS; i++) {
            writer.write(this.nullifiers[i]);
        }
        for (i = 0; i < ZC_NUM_JS_OUTPUTS; i++) {
            writer.write(this.commitments[i]);
        }
        writer.write(this.ephemeralKey);
        writer.write(this.randomSeed);
        for (i = 0; i < ZC_NUM_JS_INPUTS; i++) {
            writer.write(this.macs[i]);
        }
        writer.write(this.proof);
        for (i = 0; i < ZC_NUM_JS_OUTPUTS; i++) {
            writer.write(this.ciphertexts[i]);
        }
        return writer;
    }
    ;
}
exports.JSDescription = JSDescription;
//# sourceMappingURL=jsdescription.js.map