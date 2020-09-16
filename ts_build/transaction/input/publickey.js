"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicKeyInput = void 0;
const hash_1 = require("../../crypto/hash");
const preconditions_1 = __importDefault(require("../../util/preconditions"));
const input_1 = require("./input");
const output_1 = require("../output");
const sighash_1 = require("../sighash");
const script_1 = require("../../script");
const signature_1 = require("../../crypto/signature");
const signature_2 = require("../signature");
class PublicKeyInput extends input_1.Input {
    constructor(args) {
        super(args);
    }
    getSignatures(transaction, privateKey, index, sigtype = signature_1.Signature.SIGHASH_ALL, hashData = hash_1.Hash.sha256ripemd160(privateKey.publicKey.toBuffer())) {
        preconditions_1.default.checkState(this.output instanceof output_1.Output, 'output property should be an Output');
        sigtype = sigtype || signature_1.Signature.SIGHASH_ALL;
        const publicKey = privateKey.toPublicKey();
        if (publicKey.toString() === this.output.script.getPublicKey().toString('hex')) {
            return [
                new signature_2.TransactionSignature({
                    publicKey,
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
        this.setScript(script_1.Script.buildPublicKeyIn(signature.signature.toDER(), signature.sigtype));
        return this;
    }
    clearSignatures() {
        this.setScript(script_1.Script.empty());
        return this;
    }
    isFullySigned() {
        return this.script.isPublicKeyIn();
    }
    _estimateSize() {
        return PublicKeyInput.SCRIPT_MAX_SIZE;
    }
}
exports.PublicKeyInput = PublicKeyInput;
PublicKeyInput.SCRIPT_MAX_SIZE = 73;
//# sourceMappingURL=publickey.js.map