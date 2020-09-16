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
exports.Input = void 0;
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("../../util/preconditions"));
const publickeyhash_1 = require("./publickeyhash");
const spec_1 = require("../../errors/spec");
const errors_1 = require("../../errors");
const encoding_1 = require("../../encoding");
const buffer_1 = require("buffer");
const util_1 = require("../../util");
const script_1 = require("../../script");
const sighash_1 = require("../sighash");
const output_1 = require("../output");
const publickey_1 = require("../../publickey");
const multisigscripthash_1 = require("./multisigscripthash");
const multisig_1 = require("./multisig");
const MAXINT = 0xffffffff;
const DEFAULT_RBF_SEQNUMBER = MAXINT - 2;
const DEFAULT_SEQNUMBER = MAXINT;
const DEFAULT_LOCKTIME_SEQNUMBER = MAXINT - 1;
class Input {
    constructor(input, pubkeys, threshold, signatures, nestedWitness) {
        this.signatures = [];
        this.toJSON = this.toObject;
        if (!(this instanceof Input)) {
            return new Input(input, pubkeys, threshold, signatures, nestedWitness);
        }
        if (input) {
            return this._fromObject(input);
        }
    }
    get script() {
        if (this.isNull()) {
            return null;
        }
        if (!this._script) {
            this._script = new script_1.Script(this._scriptBuffer);
            this._script._isInput = true;
        }
        return this._script;
    }
    static fromObject(obj) {
        preconditions_1.default.checkArgument(_.isObject(obj));
        var input = new Input();
        return input._fromObject(obj);
    }
    ;
    _fromObject(params) {
        var prevTxId;
        if (_.isString(params.prevTxId) && util_1.JSUtil.isHexa(params.prevTxId)) {
            prevTxId = new buffer_1.Buffer(params.prevTxId, 'hex');
        }
        else {
            prevTxId = params.prevTxId;
        }
        this.output = params.output ?
            (params.output instanceof output_1.Output ? params.output : new output_1.Output(params.output)) : undefined;
        this.prevTxId = prevTxId || params.txidbuf;
        this.outputIndex = _.isUndefined(params.outputIndex) ? params.txoutnum : params.outputIndex;
        this.sequenceNumber = _.isUndefined(params.sequenceNumber) ?
            (_.isUndefined(params.seqnum) ? DEFAULT_SEQNUMBER : params.seqnum) : params.sequenceNumber;
        if (_.isUndefined(params.script) && _.isUndefined(params.scriptBuffer)) {
            throw new errors_1.BitcoreError(spec_1.ERROR_TYPES.Transaction.errors.Input.errors.MissingScript);
        }
        this.setScript(params.scriptBuffer || params.script);
        return this;
    }
    ;
    toObject() {
        var obj = {
            prevTxId: this.prevTxId.toString('hex'),
            outputIndex: this.outputIndex,
            sequenceNumber: this.sequenceNumber,
            script: this._scriptBuffer.toString('hex'),
        };
        if (this.script) {
            obj.scriptString = this.script.toString();
        }
        if (this.output) {
            obj.output = this.output.toObject();
        }
        return obj;
    }
    ;
    static fromBufferReader(br) {
        var input = new Input();
        input.prevTxId = br.readReverse(32);
        input.outputIndex = br.readUInt32LE();
        input._scriptBuffer = br.readVarLengthBuffer();
        input.sequenceNumber = br.readUInt32LE();
        return input;
    }
    ;
    toBufferWriter(writer) {
        if (!writer) {
            writer = new encoding_1.BufferWriter();
        }
        writer.writeReverse(this.prevTxId);
        writer.writeUInt32LE(this.outputIndex);
        var script = this._scriptBuffer;
        writer.writeVarintNum(script.length);
        writer.write(script);
        writer.writeUInt32LE(this.sequenceNumber);
        return writer;
    }
    ;
    setScript(script) {
        this._script = null;
        if (script instanceof script_1.Script) {
            this._script = script;
            this._script._isInput = true;
            this._scriptBuffer = script.toBuffer();
        }
        else if (util_1.JSUtil.isHexa(script)) {
            this._scriptBuffer = new buffer_1.Buffer(script, 'hex');
        }
        else if (_.isString(script)) {
            this._script = new script_1.Script(script);
            this._script._isInput = true;
            this._scriptBuffer = this._script.toBuffer();
        }
        else if (util_1.BufferUtil.isBuffer(script)) {
            this._scriptBuffer = new buffer_1.Buffer(script);
        }
        else {
            throw new TypeError('Invalid argument type: script');
        }
        return this;
    }
    ;
    isFullySigned() {
        throw new errors_1.BitcoreError(spec_1.ERROR_TYPES.AbstractMethodInvoked, 'Input#isFullySigned');
    }
    isFinal() {
        return this.sequenceNumber !== 4294967295;
    }
    ;
    isValidSignature(transaction, signature) {
        signature.signature.nhashtype = signature.sigtype;
        return sighash_1.Sighash.verify(transaction, signature.signature, signature.publicKey, signature.inputIndex, this.output.script);
    }
    ;
    isNull() {
        return this.prevTxId.toString('hex') === '0000000000000000000000000000000000000000000000000000000000000000' &&
            this.outputIndex === 0xffffffff;
    }
    ;
    _estimateSize() {
        return this.toBufferWriter().toBuffer().length;
    }
    ;
}
exports.Input = Input;
Input.MAXINT = MAXINT;
Input.DEFAULT_SEQNUMBER = DEFAULT_SEQNUMBER;
Input.DEFAULT_LOCKTIME_SEQNUMBER = DEFAULT_LOCKTIME_SEQNUMBER;
Input.DEFAULT_RBF_SEQNUMBER = DEFAULT_RBF_SEQNUMBER;
Input.PublicKey = publickey_1.PublicKey;
Input.PublicKeyHash = publickeyhash_1.PublicKeyHashInput;
Input.MultiSigScriptHash = multisigscripthash_1.MultiSigScriptHashInput;
Input.MultiSig = multisig_1.MultiSigInput;
//# sourceMappingURL=input.js.map