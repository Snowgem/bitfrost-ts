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
exports.MultiSigScriptHashInput = void 0;
const _ = __importStar(require("lodash"));
const input_1 = require("./input");
const output_1 = require("../output");
const preconditions_1 = __importDefault(require("../../util/preconditions"));
const script_1 = require("../../script");
const signature_1 = require("../../crypto/signature");
const sighash_1 = require("../sighash");
const bufferwriter_1 = require("../../encoding/bufferwriter");
const buffer_1 = require("../../util/buffer");
const signature_2 = require("../signature");
const js_1 = require("../../util/js");
class MultiSigScriptHashInput extends input_1.Input {
    constructor(input, pubkeys, threshold, signatures, nestedWitness) {
        super();
        this.publicKeyIndex = {};
        pubkeys = pubkeys || input.publicKeys;
        threshold = threshold || input.threshold;
        const inputSignatures = signatures || input.signatures;
        this.nestedWitness = nestedWitness ? true : false;
        this.publicKeys = _.sortBy(pubkeys, publicKey => {
            return publicKey.toString();
        });
        this.redeemScript = script_1.Script.buildMultisigOut(this.publicKeys, threshold);
        if (this.nestedWitness) {
            const nested = script_1.Script.buildWitnessMultisigOutFromScript(this.redeemScript);
            preconditions_1.default.checkState(script_1.Script.buildScriptHashOut(nested).equals(this.output.script), "Provided public keys don't hash to the provided output (nested witness)");
            const scriptSig = new script_1.Script();
            scriptSig.add(nested.toBuffer());
            this.setScript(scriptSig);
        }
        else {
            preconditions_1.default.checkState(script_1.Script.buildScriptHashOut(this.redeemScript).equals(this.output.script), "Provided public keys don't hash to the provided output");
        }
        _.each(this.publicKeys, (publicKey, index) => {
            this.publicKeyIndex[publicKey.toString()] = index;
        });
        this.threshold = threshold;
        this.signatures = inputSignatures
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
    getScriptCode() {
        const writer = new bufferwriter_1.BufferWriter();
        if (!this.redeemScript.hasCodeseparators()) {
            const redeemScriptBuffer = this.redeemScript.toBuffer();
            writer.writeVarintNum(redeemScriptBuffer.length);
            writer.write(redeemScriptBuffer);
        }
        else {
            throw new Error('@TODO');
        }
        return writer.toBuffer();
    }
    getSignatures(transaction, privateKey, index, sigtype = signature_1.Signature.SIGHASH_ALL) {
        preconditions_1.default.checkState(this.output instanceof output_1.Output, 'output property should be an Output');
        sigtype = sigtype || signature_1.Signature.SIGHASH_ALL;
        var self = this;
        var results = [];
        _.each(this.publicKeys, function (publicKey) {
            if (publicKey.toString() === privateKey.publicKey.toString()) {
                results.push(new signature_2.TransactionSignature({
                    publicKey: privateKey.publicKey,
                    prevTxId: self.prevTxId,
                    outputIndex: self.outputIndex,
                    inputIndex: index,
                    signature: sighash_1.Sighash.sign(transaction, privateKey, sigtype, index, self.redeemScript),
                    sigtype: sigtype
                }));
            }
        });
        return results;
    }
    ;
    addSignature(transaction, signature) {
        preconditions_1.default.checkState(!this.isFullySigned(), 'All needed signatures have already been added');
        preconditions_1.default.checkArgument(!_.isUndefined(this.publicKeyIndex[signature.publicKey.toString()]), 'Signature has no matching public key');
        preconditions_1.default.checkState(this.isValidSignature(transaction, signature), 'Signature must be valid');
        this.signatures[this.publicKeyIndex[signature.publicKey.toString()]] = signature;
        this._updateScript();
        return this;
    }
    _updateScript() {
        this.setScript(script_1.Script.buildP2SHMultisigIn(this.publicKeys, this.threshold, this._createSignatures(), { cachedMultisig: this.redeemScript }));
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
            return sum + js_1.JSUtil.booleanToNumber(!!signature);
        }, 0);
    }
    publicKeysWithoutSignature() {
        return _.filter(this.publicKeys, publicKey => {
            return !this.signatures[this.publicKeyIndex[publicKey.toString()]];
        });
    }
    isValidSignature(transaction, signature) {
        signature.signature.nhashtype = signature.sigtype;
        return sighash_1.Sighash.verify(transaction, signature.signature, signature.publicKey, signature.inputIndex, this.redeemScript);
    }
    _estimateSize() {
        return (MultiSigScriptHashInput.OPCODES_SIZE +
            this.threshold * MultiSigScriptHashInput.SIGNATURE_SIZE +
            this.publicKeys.length * MultiSigScriptHashInput.PUBKEY_SIZE);
    }
}
exports.MultiSigScriptHashInput = MultiSigScriptHashInput;
MultiSigScriptHashInput.OPCODES_SIZE = 7;
MultiSigScriptHashInput.SIGNATURE_SIZE = 74;
MultiSigScriptHashInput.PUBKEY_SIZE = 34;
//# sourceMappingURL=multisigscripthash.js.map