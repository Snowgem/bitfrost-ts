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
exports.verify = exports.sign = exports.sighash = exports.Sighash = void 0;
const preconditions_1 = __importDefault(require("../util/preconditions"));
const _ = __importStar(require("lodash"));
const buffer_1 = require("buffer");
const script_1 = require("../script");
const _1 = require(".");
const encoding_1 = require("../encoding");
const crypto_1 = require("../crypto");
const signature_1 = require("../crypto/signature");
const blake2bts_1 = require("blake2bts");
var SIGHASH_SINGLE_BUG = '0000000000000000000000000000000000000000000000000000000000000001';
var BITS_64_ON = 'ffffffffffffffff';
var ZERO = buffer_1.Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
exports.Sighash = {
    sighash,
    verify,
    sign
};
var sighashSapling = function sighash(transaction, sighashType, inputNumber, subscript) {
    var input = transaction.inputs[inputNumber];
    function getBlake2bHash(bufferToHash, personalization) {
        var out = buffer_1.Buffer.allocUnsafe(32);
        return blake2bts_1.blake2b(out.length, null, null, buffer_1.Buffer.from(personalization)).update(bufferToHash).digest(out);
    }
    function GetPrevoutHash(tx) {
        var writer = new encoding_1.BufferWriter();
        _.each(tx.inputs, function (input) {
            writer.writeReverse(input.prevTxId);
            writer.writeUInt32LE(input.outputIndex);
        });
        return getBlake2bHash(writer.toBuffer(), 'ZcashPrevoutHash');
    }
    function GetSequenceHash(tx) {
        var writer = new encoding_1.BufferWriter();
        _.each(tx.inputs, function (input) {
            writer.writeUInt32LE(input.sequenceNumber);
        });
        return getBlake2bHash(writer.toBuffer(), 'ZcashSequencHash');
    }
    function GetOutputsHash(tx, n) {
        var writer = new encoding_1.BufferWriter();
        if (_.isUndefined(n)) {
            _.each(tx.outputs, function (output) {
                output.toBufferWriter(writer);
            });
        }
        else {
            tx.outputs[n].toBufferWriter(writer);
        }
        return getBlake2bHash(writer.toBuffer(), 'ZcashOutputsHash');
    }
    var hashPrevouts = ZERO;
    var hashSequence = ZERO;
    var hashOutputs = ZERO;
    var hashJoinSplits = ZERO;
    var hashShieldedSpends = ZERO;
    var hashShieldedOutputs = ZERO;
    var writer = new encoding_1.BufferWriter();
    var header = transaction.version | (1 << 31);
    writer.writeInt32LE(header);
    writer.writeUInt32LE(transaction.nVersionGroupId);
    if (!(sighashType & signature_1.Signature.SIGHASH_ANYONECANPAY)) {
        hashPrevouts = GetPrevoutHash(transaction);
    }
    writer.write(hashPrevouts);
    if (!(sighashType & signature_1.Signature.SIGHASH_ANYONECANPAY) &&
        (sighashType & 31) != signature_1.Signature.SIGHASH_SINGLE &&
        (sighashType & 31) != signature_1.Signature.SIGHASH_NONE) {
        hashSequence = GetSequenceHash(transaction);
    }
    writer.write(hashSequence);
    if ((sighashType & 31) != signature_1.Signature.SIGHASH_SINGLE && (sighashType & 31) != signature_1.Signature.SIGHASH_NONE) {
        hashOutputs = GetOutputsHash(transaction);
    }
    else if ((sighashType & 31) == signature_1.Signature.SIGHASH_SINGLE && inputNumber < transaction.outputs.length) {
        hashOutputs = GetOutputsHash(transaction, inputNumber);
    }
    writer.write(hashOutputs);
    writer.write(hashJoinSplits);
    writer.write(hashShieldedSpends);
    writer.write(hashShieldedOutputs);
    writer.writeUInt32LE(transaction.nLockTime);
    writer.writeUInt32LE(transaction.nExpiryHeight);
    writer.writeUInt64LEBN(new crypto_1.BitcoreBN(transaction.valueBalance));
    writer.writeUInt32LE(sighashType >>> 0);
    writer.writeReverse(input.prevTxId);
    writer.writeUInt32LE(input.outputIndex);
    writer.writeVarintNum(subscript.toBuffer().length);
    writer.write(subscript.toBuffer());
    writer.writeUInt64LEBN(new crypto_1.BitcoreBN(input.output.satoshis));
    var sequenceNumber = input.sequenceNumber;
    writer.writeUInt32LE(sequenceNumber);
    var personalization = buffer_1.Buffer.alloc(16);
    var prefix = 'ZcashSigHash';
    var consensusBranchId = _1.Transaction.DEFAULT_BRANCH_ID;
    if (transaction.branchId) {
        consensusBranchId = transaction.branchId;
    }
    personalization.write(prefix);
    personalization.writeUInt32LE(consensusBranchId, prefix.length);
    var ret = getBlake2bHash(writer.toBuffer(), personalization);
    ret = new encoding_1.BufferReader(ret).readReverse();
    return ret;
};
function sighash(transaction, sighashType, inputNumber, subscript) {
    var Transaction = require('./transaction');
    var Input = require('./input');
    if (transaction.version >= 4) {
        return sighashSapling(transaction, sighashType, inputNumber, subscript);
    }
    var i;
    var txcopy = Transaction.shallowCopy(transaction);
    subscript = new script_1.Script(subscript);
    subscript.removeCodeseparators();
    for (i = 0; i < txcopy.inputs.length; i++) {
        txcopy.inputs[i] = new Input(txcopy.inputs[i]).setScript(script_1.Script.empty());
    }
    txcopy.inputs[inputNumber] = new Input(txcopy.inputs[inputNumber]).setScript(subscript);
    if ((sighashType & 31) === signature_1.Signature.SIGHASH_NONE ||
        (sighashType & 31) === signature_1.Signature.SIGHASH_SINGLE) {
        for (i = 0; i < txcopy.inputs.length; i++) {
            if (i !== inputNumber) {
                txcopy.inputs[i].sequenceNumber = 0;
            }
        }
    }
    if ((sighashType & 31) === signature_1.Signature.SIGHASH_NONE) {
        txcopy.outputs = [];
    }
    else if ((sighashType & 31) === signature_1.Signature.SIGHASH_SINGLE) {
        if (inputNumber >= txcopy.outputs.length) {
            return new buffer_1.Buffer(SIGHASH_SINGLE_BUG, 'hex');
        }
        txcopy.outputs.length = inputNumber + 1;
        for (i = 0; i < inputNumber; i++) {
            txcopy.outputs[i] = new _1.Output({
                satoshis: crypto_1.BitcoreBN.fromBuffer(new buffer_1.Buffer(BITS_64_ON, 'hex')),
                script: script_1.Script.empty()
            });
        }
    }
    if (sighashType & signature_1.Signature.SIGHASH_ANYONECANPAY) {
        txcopy.inputs = [txcopy.inputs[inputNumber]];
    }
    var buf = new encoding_1.BufferWriter()
        .write(txcopy.toBuffer())
        .writeInt32LE(sighashType)
        .toBuffer();
    var ret = crypto_1.Hash.sha256sha256(buf);
    ret = new encoding_1.BufferReader(ret).readReverse();
    return ret;
}
exports.sighash = sighash;
;
function sign(transaction, privateKey, sighashType, inputIndex, subscript) {
    var hashbuf = sighash(transaction, sighashType, inputIndex, subscript);
    var sig = crypto_1.ECDSA.sign(hashbuf, privateKey, 'little').set({
        nhashtype: sighashType
    });
    return sig;
}
exports.sign = sign;
function verify(transaction, signature, publicKey, inputIndex, subscript) {
    preconditions_1.default.checkArgument(!_.isUndefined(transaction));
    preconditions_1.default.checkArgument(!_.isUndefined(signature) && !_.isUndefined(signature.nhashtype));
    var hashbuf = sighash(transaction, signature.nhashtype, inputIndex, subscript);
    return crypto_1.ECDSA.verify(hashbuf, signature, publicKey, 'little');
}
exports.verify = verify;
//# sourceMappingURL=sighash.js.map