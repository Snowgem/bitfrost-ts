"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicKeyHashInput = void 0;
const preconditions_1 = __importDefault(require("../../util/preconditions"));
const buffer_1 = require("../../util/buffer");
const hash_1 = require("../../crypto/hash");
const input_1 = require("./input");
const output_1 = require("../output");
const sighash_1 = require("../sighash");
const script_1 = require("../../script");
const signature_1 = require("../../crypto/signature");
const signature_2 = require("../signature");
class PublicKeyHashInput extends input_1.Input {
    constructor(args) {
        super(args);
    }
    getSignatures(transaction, privateKey, index, sigtype = signature_1.Signature.SIGHASH_ALL, hashData = hash_1.Hash.sha256ripemd160(privateKey.publicKey.toBuffer())) {
        preconditions_1.default.checkState(this.output instanceof output_1.Output, 'Output property must be an Output');
        if (buffer_1.BufferUtil.equals(hashData, this.output.script.getPublicKeyHash())) {
            return [
                new signature_2.TransactionSignature({
                    publicKey: privateKey.publicKey,
                    prevTxId: this.prevTxId,
                    outputIndex: this.outputIndex,
                    inputIndex: index,
                    signature: sighash_1.Sighash.sign(transaction, privateKey, sigtype, index, this.output.script),
                    sigtype
                })
            ];
        }
        return [];
    }
    addSignature(transaction, signature) {
        preconditions_1.default.checkState(this.isValidSignature(transaction, signature), 'Signature is invalid');
        this.setScript(script_1.Script.buildPublicKeyHashIn(signature.publicKey, signature.signature.toDER(), signature.sigtype));
        return this;
    }
    clearSignatures() {
        this.setScript(script_1.Script.empty());
        return this;
    }
    isFullySigned() {
        return this.script.isPublicKeyHashIn();
    }
    _estimateSize() {
        return PublicKeyHashInput.SCRIPT_MAX_SIZE;
    }
}
exports.PublicKeyHashInput = PublicKeyHashInput;
PublicKeyHashInput.SCRIPT_MAX_SIZE = 73 + 34;
//# sourceMappingURL=publickeyhash.js.map