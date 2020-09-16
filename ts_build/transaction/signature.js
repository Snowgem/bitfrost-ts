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
exports.TransactionSignature = void 0;
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("../util/preconditions"));
const util_1 = require("../util");
const publickey_1 = require("../publickey");
const errors_1 = require("../errors");
const signature_1 = require("../crypto/signature");
class TransactionSignature extends signature_1.Signature {
    constructor(arg) {
        super();
        this._fromObject = function (arg) {
            this._checkObjectArgs(arg);
            this.publicKey = new publickey_1.PublicKey(arg.publicKey);
            this.prevTxId = util_1.BufferUtil.isBuffer(arg.prevTxId) ? arg.prevTxId : new Buffer(arg.prevTxId, 'hex');
            this.outputIndex = arg.outputIndex;
            this.inputIndex = arg.inputIndex;
            this.signature = (arg.signature instanceof signature_1.Signature) ? arg.signature :
                util_1.BufferUtil.isBuffer(arg.signature) ? signature_1.Signature.fromBuffer(arg.signature) :
                    signature_1.Signature.fromString(arg.signature);
            this.sigtype = arg.sigtype;
            return this;
        };
        this._checkObjectArgs = function (arg) {
            preconditions_1.default.checkArgument(new publickey_1.PublicKey(arg.publicKey), 'publicKey');
            preconditions_1.default.checkArgument(!_.isUndefined(arg.inputIndex), 'inputIndex');
            preconditions_1.default.checkArgument(!_.isUndefined(arg.outputIndex), 'outputIndex');
            preconditions_1.default.checkState(_.isNumber(arg.inputIndex), 'inputIndex must be a number');
            preconditions_1.default.checkState(_.isNumber(arg.outputIndex), 'outputIndex must be a number');
            preconditions_1.default.checkArgument(arg.signature, 'signature');
            preconditions_1.default.checkArgument(arg.prevTxId, 'prevTxId');
            preconditions_1.default.checkState(arg.signature instanceof signature_1.Signature ||
                util_1.BufferUtil.isBuffer(arg.signature) ||
                util_1.JSUtil.isHexa(arg.signature), 'signature must be a buffer or hexa value');
            preconditions_1.default.checkState(util_1.BufferUtil.isBuffer(arg.prevTxId) ||
                util_1.JSUtil.isHexa(arg.prevTxId), 'prevTxId must be a buffer or hexa value');
            preconditions_1.default.checkArgument(arg.sigtype, 'sigtype');
            preconditions_1.default.checkState(_.isNumber(arg.sigtype), 'sigtype must be a number');
        };
        this.toObject = function toObject() {
            return {
                publicKey: this.publicKey.toString(),
                prevTxId: this.prevTxId.toString('hex'),
                outputIndex: this.outputIndex,
                inputIndex: this.inputIndex,
                signature: this.signature.toString(),
                sigtype: this.sigtype
            };
        };
        this.toJSON = this.toObject;
        if (!(this instanceof TransactionSignature)) {
            return new TransactionSignature(arg);
        }
        if (arg instanceof TransactionSignature) {
            return arg;
        }
        if (_.isObject(arg)) {
            return this._fromObject(arg);
        }
        throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.InvalidArgument, 'TransactionSignatures must be instantiated from an object');
    }
}
exports.TransactionSignature = TransactionSignature;
TransactionSignature.fromObject = function (object) {
    preconditions_1.default.checkArgument(object);
    return new TransactionSignature(object);
};
//# sourceMappingURL=signature.js.map