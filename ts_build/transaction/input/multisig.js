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
exports.MultiSigInput = void 0;
const preconditions_1 = __importDefault(require("../../util/preconditions"));
const _ = __importStar(require("lodash"));
const input_1 = require("./input");
const output_1 = require("../output");
const script_1 = require("../../script");
const signature_1 = require("../../crypto/signature");
const sighash_1 = require("../sighash");
const buffer_1 = require("../../util/buffer");
const signature_2 = require("../signature");
const hash_1 = require("../../crypto/hash");
class MultiSigInput extends input_1.Input {
    constructor(input, pubkeys, threshold, signatures) {
        super();
        this.publicKeyIndex = {};
        input_1.Input.apply(this, arguments);
        pubkeys = pubkeys || input.publicKeys;
        threshold = threshold || input.threshold;
        signatures = signatures || input.signatures;
        this.publicKeys = _.sortBy(pubkeys, publicKey => {
            return publicKey.toString();
        });
        preconditions_1.default.checkState(script_1.Script.buildMultisigOut(this.publicKeys, threshold).equals(this.output.script), "Provided public keys don't match to the provided output script");
        this.publicKeyIndex = {};
        _.each(this.publicKeys, (publicKey, index) => {
            this.publicKeyIndex[publicKey.toString()] = index;
        });
        this.threshold = threshold;
        this.signatures = signatures
            ? this._deserializeSignatures(signatures)
            : new Array(this.publicKeys.length);
    }
    toObject() {
        const obj = input_1.Input.prototype.toObject.apply(this, arguments);
        obj.threshold = this.threshold;
        obj.publicKeys = _.map(this.publicKeys, publicKey => {
            return publicKey.toString();
        });
        obj.signatures = this._serializeSignatures();
        return obj;
    }
    _deserializeSignatures(signatures) {
        return _.map(signatures, signature => {
            if (!signature) {
                return undefined;
            }
            return new signature_2.TransactionSignature(signature);
        });
    }
    _serializeSignatures() {
        return _.map(this.signatures, signature => {
            if (!signature) {
                return undefined;
            }
            return signature.toObject();
        });
    }
    getSignatures(transaction, privateKey, index, sigtype = signature_1.Signature.SIGHASH_ALL, hashData = hash_1.Hash.sha256ripemd160(privateKey.publicKey.toBuffer())) {
        preconditions_1.default.checkState(this.output instanceof output_1.Output, 'output property should be an Output');
        const results = [];
        _.each(this.publicKeys, publicKey => {
            if (publicKey.toString() === privateKey.publicKey.toString()) {
                results.push(new signature_2.TransactionSignature({
                    publicKey: privateKey.publicKey,
                    prevTxId: this.prevTxId,
                    outputIndex: this.outputIndex,
                    inputIndex: index,
                    signature: sighash_1.Sighash.sign(transaction, privateKey, sigtype, index, this.output.script),
                    sigtype
                }));
            }
        });
        return results;
    }
    addSignature(transaction, signature) {
        preconditions_1.default.checkState(!this.isFullySigned(), 'All needed signatures have already been added');
        preconditions_1.default.checkArgument(!_.isUndefined(this.publicKeyIndex[signature.publicKey.toString()]), 'Signature has no matching public key');
        preconditions_1.default.checkState(this.isValidSignature(transaction, signature), 'Signature must be valid');
        this.signatures[this.publicKeyIndex[signature.publicKey.toString()]] = signature;
        this._updateScript();
        return this;
    }
    _updateScript() {
        this.setScript(script_1.Script.buildMultisigIn(this.publicKeys, this.threshold, this._createSignatures()));
        return this;
    }
    _createSignatures() {
        return _.map(_.filter(this.signatures, signature => {
            return !_.isUndefined(signature);
        }), signature => {
            return buffer_1.BufferUtil.concat([
                signature.signature.toDER(),
                buffer_1.BufferUtil.integerAsSingleByteBuffer(signature.sigtype)
            ]);
        });
    }
    clearSignatures() {
        this.signatures = new Array(this.publicKeys.length);
        this._updateScript();
    }
    isFullySigned() {
        return this.countSignatures() === this.threshold;
    }
    countMissingSignatures() {
        return this.threshold - this.countSignatures();
    }
    countSignatures() {
        return _.reduce(this.signatures, (sum, signature) => {
            return sum + (!!signature ? 1 : 0);
        }, 0);
    }
    publicKeysWithoutSignature() {
        return _.filter(this.publicKeys, publicKey => {
            return !this.signatures[this.publicKeyIndex[publicKey.toString()]];
        });
    }
    isValidSignature(transaction, signature) {
        signature.signature.nhashtype = signature.sigtype;
        return sighash_1.Sighash.verify(transaction, signature.signature, signature.publicKey, signature.inputIndex, this.output.script);
    }
    static normalizeSignatures(transaction, input, inputIndex, signatures, publicKeys) {
        return publicKeys.map(pubKey => {
            let signatureMatch = null;
            signatures = signatures.filter(signatureBuffer => {
                if (signatureMatch) {
                    return true;
                }
                const signature = new signature_2.TransactionSignature({
                    signature: signature_1.Signature.fromTxFormat(signatureBuffer),
                    publicKey: pubKey,
                    prevTxId: input.prevTxId,
                    outputIndex: input.outputIndex,
                    inputIndex,
                    sigtype: signature_1.Signature.SIGHASH_ALL
                });
                signature.signature.nhashtype = signature.sigtype;
                const isMatch = sighash_1.Sighash.verify(transaction, signature.signature, signature.publicKey, signature.inputIndex, input.output.script);
                if (isMatch) {
                    signatureMatch = signature;
                    return false;
                }
                return true;
            });
            return signatureMatch ? signatureMatch : null;
        });
    }
    _estimateSize() {
        return (MultiSigInput.OPCODES_SIZE + this.threshold * MultiSigInput.SIGNATURE_SIZE);
    }
}
exports.MultiSigInput = MultiSigInput;
MultiSigInput.OPCODES_SIZE = 1;
MultiSigInput.SIGNATURE_SIZE = 73;
//# sourceMappingURL=multisig.js.map