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
exports.Transaction = void 0;
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("../util/preconditions"));
var compare = Buffer.compare || require('buffer-compare');
const errors_1 = require("../errors");
const util_1 = require("../util");
const encoding_1 = require("../encoding");
const crypto_1 = require("../crypto");
const address_1 = require("../address");
const signature_1 = require("../crypto/signature");
const sighash_1 = require("./sighash");
const unspentoutput_1 = require("./unspentoutput");
const input_1 = require("./input/input");
const _1 = require(".");
const script_1 = require("../script");
const privatekey_1 = require("../privatekey");
const jsdescription_1 = require("./jsdescription");
const spenddescription_1 = require("./spenddescription");
const outputdescription_1 = require("./outputdescription");
const CURRENT_VERSION = 4;
const DEFAULT_NLOCKTIME = 0;
const DEFAULT_VALUEBALANCE = new crypto_1.BitcoreBN(0);
const MAX_BLOCK_SIZE = 2000000;
const DEFAULT_EXPIRY_HEIGHT = 0;
const DEFAULT_VERSION_GROUP_ID = 0x892f2085;
let branchId;
class Transaction {
    constructor(serialized) {
        this.toString = this.uncheckedSerialize;
        this.toJSON = this.toObject;
        if (!(this instanceof Transaction)) {
            return new Transaction(serialized);
        }
        this.inputs = [];
        this.outputs = [];
        this.joinSplits = [];
        this.spendDescs = [];
        this.outputDescs = [];
        this._inputAmount = undefined;
        this._outputAmount = undefined;
        this.fOverwintered = true;
        this.nVersionGroupId = DEFAULT_VERSION_GROUP_ID;
        this.nExpiryHeight = DEFAULT_EXPIRY_HEIGHT;
        if (serialized) {
            if (serialized instanceof Transaction) {
                return Transaction.shallowCopy(serialized);
            }
            else if (util_1.JSUtil.isHexa(serialized)) {
                this.fromString(serialized);
            }
            else if (util_1.BufferUtil.isBuffer(serialized)) {
                this.fromBuffer(serialized);
            }
            else if (_.isObject(serialized)) {
                this.fromObject(serialized);
            }
            else {
                throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.InvalidArgument, 'Must provide an object or string to deserialize a transaction');
            }
        }
        else {
            this._newTransaction();
        }
    }
    static shallowCopy(transaction) {
        var copy = new Transaction(transaction.toBuffer());
        return copy;
    }
    ;
    get hash() {
        this._hash = new encoding_1.BufferReader(this._getHash())
            .readReverse()
            .toString('hex');
        return this._hash;
    }
    get id() {
        return this.id;
    }
    get inputAmount() {
        return this._getInputAmount();
    }
    get outputAmount() {
        return this._getOutputAmount();
    }
    setBranchId(id) {
        this.branchId = id;
    }
    ;
    _getHash() {
        return crypto_1.Hash.sha256sha256(this.toBuffer());
    }
    ;
    serialize(unsafe) {
        if (true === unsafe || unsafe && unsafe.disableAll) {
            return this.uncheckedSerialize();
        }
        else {
            return this.checkedSerialize(unsafe);
        }
    }
    ;
    uncheckedSerialize() {
        return this.toBuffer().toString('hex');
    }
    ;
    checkedSerialize(opts) {
        var serializationError = this.getSerializationError(opts);
        if (serializationError) {
            serializationError.message += ' - For more information please see: ' +
                'https://bitcore.io/api/lib/transaction#serialization-checks';
            throw serializationError;
        }
        return this.uncheckedSerialize();
    }
    ;
    invalidSatoshis() {
        var invalid = false;
        for (var i = 0; i < this.outputs.length; i++) {
            if (this.outputs[i].invalidSatoshis()) {
                invalid = true;
            }
        }
        return invalid;
    }
    ;
    getSerializationError(opts) {
        opts = opts || {};
        if (this.invalidSatoshis()) {
            return new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.InvalidSatoshis);
        }
        var unspent = this._getUnspentValue();
        var unspentError;
        if (unspent < 0) {
            if (!opts.disableMoreOutputThanInput) {
                unspentError = new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.InvalidOutputAmountSum);
            }
        }
        else {
            unspentError = this._hasFeeError(opts, unspent);
        }
        return unspentError ||
            this._hasDustOutputs(opts) ||
            this._isMissingSignatures(opts);
    }
    ;
    _hasFeeError(opts, unspent) {
        if (!_.isUndefined(this._fee) && this._fee !== unspent) {
            return new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.FeeError.errors.Different, 'Unspent value is ' + unspent + ' but specified fee is ' + this._fee);
        }
        if (!opts.disableLargeFees) {
            var maximumFee = Math.floor(Transaction.FEE_SECURITY_MARGIN * this._estimateFee());
            if (unspent > maximumFee) {
                if (this._missingChange()) {
                    return new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.ChangeAddressMissing, 'Fee is too large and no change address was provided');
                }
                return new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.FeeError.errors.TooLarge, 'expected less than ' + maximumFee + ' but got ' + unspent);
            }
        }
        if (!opts.disableSmallFees) {
            var minimumFee = Math.ceil(this._estimateFee() / Transaction.FEE_SECURITY_MARGIN);
            if (unspent < minimumFee) {
                return new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.FeeError.errors.TooSmall, 'expected more than ' + minimumFee + ' but got ' + unspent);
            }
        }
    }
    ;
    _missingChange() {
        return !this._changeScript;
    }
    ;
    _hasDustOutputs(opts) {
        if (opts.disableDustOutputs) {
            return;
        }
        var index, output;
        for (index in this.outputs) {
            output = this.outputs[index];
            if (output.satoshis < Transaction.DUST_AMOUNT && !output.script.isDataOut()) {
                return new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.DustOutputs);
            }
        }
    }
    ;
    _isMissingSignatures(opts) {
        if (opts.disableIsFullySigned) {
            return;
        }
        if (!this.isFullySigned()) {
            return new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.MissingSignatures);
        }
    }
    ;
    inspect() {
        return '<Transaction: ' + this.uncheckedSerialize() + '>';
    }
    ;
    toBuffer() {
        var writer = new encoding_1.BufferWriter();
        return this.toBufferWriter(writer).toBuffer();
    }
    ;
    toBufferWriter(writer) {
        if (!this.fOverwintered) {
            writer.writeUInt32LE(this.version);
        }
        else {
            var header = 0x80000000 + this.version;
            writer.writeUInt32LE(header);
        }
        if (this.fOverwintered) {
            writer.writeUInt32LE(this.nVersionGroupId);
        }
        writer.writeVarintNum(this.inputs.length);
        _.each(this.inputs, function (input) {
            input.toBufferWriter(writer);
        });
        writer.writeVarintNum(this.outputs.length);
        _.each(this.outputs, function (output) {
            output.toBufferWriter(writer);
        });
        writer.writeUInt32LE(this.nLockTime);
        if (this.fOverwintered) {
            writer.writeUInt32LE(this.nExpiryHeight);
        }
        if (this.version >= 4) {
            writer.writeUInt64LEBN(this.valueBalance);
            writer.writeVarintNum(this.spendDescs.length);
            _.each(this.spendDescs, function (desc) {
                desc.toBufferWriter(writer);
            });
            writer.writeVarintNum(this.outputDescs.length);
            _.each(this.outputDescs, function (desc) {
                desc.toBufferWriter(writer);
            });
        }
        if (this.version >= 2) {
            writer.writeVarintNum(this.joinSplits.length);
            _.each(this.joinSplits, function (jsdesc) {
                jsdesc.toBufferWriter(writer);
            });
            if (this.joinSplits.length > 0) {
                writer.write(this.joinSplitPubKey);
                writer.write(this.joinSplitSig);
            }
        }
        if (this.version >= 4 && !(this.spendDescs.length == 0 && this.outputDescs.length == 0)) {
            writer.write(this.bindingSig);
        }
        return writer;
    }
    ;
    fromBuffer(buffer) {
        var reader = new encoding_1.BufferReader(buffer);
        return this.fromBufferReader(reader);
    }
    ;
    fromBufferReader(reader) {
        preconditions_1.default.checkArgument(!reader.finished(), 'No transaction data received');
        var i, sizeTxIns, sizeTxOuts, sizeJSDescs, sizeSpendDescs, sizeOutputDescs;
        var header = reader.readUInt32LE();
        this.fOverwintered = ((header >>> 31) == 1);
        if (this.fOverwintered == true) {
            this.version = header & 0x7fffffff;
        }
        else {
            this.version = header;
        }
        if (this.version >= 3) {
            this.nVersionGroupId = reader.readUInt32LE();
        }
        sizeTxIns = reader.readVarintNum();
        for (i = 0; i < sizeTxIns; i++) {
            var input = input_1.Input.fromBufferReader(reader);
            this.inputs.push(input);
        }
        sizeTxOuts = reader.readVarintNum();
        for (i = 0; i < sizeTxOuts; i++) {
            this.outputs.push(_1.Output.fromBufferReader(reader));
        }
        this.nLockTime = reader.readUInt32LE();
        if (this.version >= 3) {
            this.nExpiryHeight = reader.readUInt32LE();
        }
        if (this.version >= 4) {
            this.valueBalance = reader.readUInt64LEBN();
            sizeSpendDescs = reader.readVarintNum();
            for (i = 0; i < sizeSpendDescs; i++) {
                var spend = spenddescription_1.SpendDescription.fromBufferReader(reader);
                this.spendDescs.push(spend);
            }
            sizeOutputDescs = reader.readVarintNum();
            for (i = 0; i < sizeOutputDescs; i++) {
                var output = outputdescription_1.OutputDescription.fromBufferReader(reader);
                this.outputDescs.push(output);
            }
        }
        var useGrothFlag = (this.version >= 4);
        if (this.version >= 2) {
            sizeJSDescs = reader.readVarintNum();
            for (i = 0; i < sizeJSDescs; i++) {
                this.joinSplits.push(jsdescription_1.JSDescription.fromBufferReader(reader, useGrothFlag));
            }
            if (sizeJSDescs > 0) {
                this.joinSplitPubKey = reader.read(32);
                this.joinSplitSig = reader.read(64);
            }
        }
        if (this.version >= 4 && !(sizeSpendDescs == 0 && sizeOutputDescs == 0)) {
            this.bindingSig = reader.read(64);
        }
        return this;
    }
    ;
    toObject() {
        var inputs = [];
        this.inputs.forEach(function (input) {
            inputs.push(input.toObject());
        });
        var outputs = [];
        this.outputs.forEach(function (output) {
            outputs.push(output.toObject());
        });
        var obj = {
            hash: this.hash,
            fOverwintered: this.fOverwintered,
            version: this.version,
            inputs: inputs,
            outputs: outputs,
            nLockTime: this.nLockTime
        };
        if (this.fOverwintered) {
            obj.nVersionGroupId = this.nVersionGroupId;
            obj.nExpiryHeight = this.nExpiryHeight;
        }
        if (this.version >= 4) {
            obj.valueBalance = this.valueBalance;
            var spendDescs = [];
            this.spendDescs.forEach(function (desc) {
                spendDescs.push(desc.toObject());
            });
            obj.spendDescs = spendDescs;
            var outputDescs = [];
            this.outputDescs.forEach(function (desc) {
                outputDescs.push(desc.toObject());
            });
            obj.outputDescs = outputDescs;
        }
        if (this.version >= 2) {
            var joinSplits = [];
            this.joinSplits.forEach(function (joinSplit) {
                joinSplits.push(joinSplit.toObject());
            });
            obj.joinSplits = joinSplits;
            if (this.joinSplits.length > 0) {
                obj.joinSplitPubKey = util_1.BufferUtil.reverse(this.joinSplitPubKey).toString('hex');
                obj.joinSplitSig = this.joinSplitSig.toString('hex');
            }
        }
        if (this.version >= 4 && !(this.spendDescs.length == 0 && this.outputDescs.length == 0)) {
            obj.bindingSig = this.bindingSig.toString('hex');
        }
        if (this._changeScript) {
            obj.changeScript = this._changeScript.toString();
        }
        if (!_.isUndefined(this._changeIndex)) {
            obj.changeIndex = this._changeIndex;
        }
        if (!_.isUndefined(this._fee)) {
            obj.fee = this._fee;
        }
        return obj;
    }
    ;
    fromObject(arg) {
        preconditions_1.default.checkArgument(_.isObject(arg) || arg instanceof Transaction);
        var transaction;
        if (arg instanceof Transaction) {
            transaction = transaction.toObject();
        }
        else {
            transaction = arg;
        }
        _.each(transaction.inputs, function (input) {
            if (!input.output || !input.output.script) {
                this.uncheckedAddInput(new input_1.Input(input));
                return;
            }
            var script = new script_1.Script(input.output.script);
            var txin;
            if (script.isPublicKeyHashOut()) {
                txin = new input_1.Input.PublicKeyHash(input);
            }
            else if (script.isScriptHashOut() && input.publicKeys && input.threshold) {
                txin = new input_1.Input.MultiSigScriptHash(input, input.publicKeys, input.threshold, input.signatures);
            }
            else if (script.isPublicKeyOut()) {
                txin = new input_1.Input.PublicKey(input);
            }
            else {
                throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.Input.errors.UnsupportedScript, input.output.script);
            }
            this.addInput(txin);
        });
        _.each(transaction.outputs, function (output) {
            this.addOutput(new _1.Output(output));
        });
        if (transaction.changeIndex) {
            this._changeIndex = transaction.changeIndex;
        }
        if (transaction.changeScript) {
            this._changeScript = new script_1.Script(transaction.changeScript);
        }
        if (transaction.fee) {
            this._fee = transaction.fee;
        }
        this.nLockTime = transaction.nLockTime;
        this.version = transaction.version;
        this.fOverwintered = transaction.fOverwintered;
        if (this.fOverwintered) {
            this.nExpiryHeight = transaction.nExpiryHeight;
            this.nVersionGroupId = transaction.nVersionGroupId;
        }
        if (this.version >= 4) {
            this.valueBalance = transaction.valueBalance;
            _.each(transaction.spendDescs, function (desc) {
                this.spendDescs.push(new spenddescription_1.SpendDescription(desc));
            });
            _.each(transaction.outputDescs, function (desc) {
                this.outputDescs.push(new outputdescription_1.OutputDescription(desc));
            });
        }
        if (this.version >= 2) {
            _.each(transaction.joinSplits, function (joinSplit) {
                this.joinSplits.push(new jsdescription_1.JSDescription(joinSplit));
            });
            if (this.joinSplits.length > 0) {
                this.joinSplitPubKey = util_1.BufferUtil.reverse(new Buffer(transaction.joinSplitPubKey, 'hex'));
                this.joinSplitSig = new Buffer(transaction.joinSplitSig, 'hex');
            }
        }
        if (this.version >= 4 && !(transaction.spendDescs.length == 0 && transaction.outputDescs.length == 0)) {
            this.bindingSig = transaction.bindingSig;
        }
        this._checkConsistency(arg);
        return this;
    }
    ;
    _checkConsistency(arg) {
        if (!_.isUndefined(this._changeIndex)) {
            preconditions_1.default.checkState(this._changeScript, 'Change script is expected.');
            preconditions_1.default.checkState(this.outputs[this._changeIndex], 'Change index points to undefined output.');
            preconditions_1.default.checkState(this.outputs[this._changeIndex].script.toString() ===
                this._changeScript.toString(), 'Change output has an unexpected script.');
        }
        if (arg && arg.hash) {
            preconditions_1.default.checkState(arg.hash === this.hash, 'Hash in object does not match transaction hash.');
        }
    }
    ;
    lockUntilDate(time) {
        preconditions_1.default.checkArgument(time);
        if (_.isNumber(time) && time < Transaction.NLOCKTIME_BLOCKHEIGHT_LIMIT) {
            throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.LockTimeTooEarly);
        }
        if (_.isDate(time)) {
            time = time.getTime() / 1000;
        }
        for (var i = 0; i < this.inputs.length; i++) {
            if (this.inputs[i].sequenceNumber === input_1.Input.DEFAULT_SEQNUMBER) {
                this.inputs[i].sequenceNumber = input_1.Input.DEFAULT_LOCKTIME_SEQNUMBER;
            }
        }
        this.nLockTime = time;
        return this;
    }
    ;
    lockUntilBlockHeight(height) {
        preconditions_1.default.checkArgument(_.isNumber(height));
        if (height >= Transaction.NLOCKTIME_BLOCKHEIGHT_LIMIT) {
            throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.BlockHeightTooHigh);
        }
        if (height < 0) {
            throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.NLockTimeOutOfRange);
        }
        for (var i = 0; i < this.inputs.length; i++) {
            if (this.inputs[i].sequenceNumber === input_1.Input.DEFAULT_SEQNUMBER) {
                this.inputs[i].sequenceNumber = input_1.Input.DEFAULT_LOCKTIME_SEQNUMBER;
            }
        }
        this.nLockTime = height;
        return this;
    }
    ;
    getLockTime() {
        if (!this.nLockTime) {
            return null;
        }
        if (this.nLockTime < Transaction.NLOCKTIME_BLOCKHEIGHT_LIMIT) {
            return this.nLockTime;
        }
        return new Date(1000 * this.nLockTime);
    }
    ;
    fromString(string) {
        this.fromBuffer(new Buffer(string, 'hex'));
    }
    ;
    _newTransaction() {
        this.version = CURRENT_VERSION;
        this.nLockTime = DEFAULT_NLOCKTIME;
        this.fOverwintered = true;
        this.nVersionGroupId = DEFAULT_VERSION_GROUP_ID || branchId;
        this.nExpiryHeight = DEFAULT_EXPIRY_HEIGHT;
        this.valueBalance = DEFAULT_VALUEBALANCE;
    }
    ;
    from(utxo, pubkeys, threshold) {
        if (_.isArray(utxo)) {
            var self = this;
            _.each(utxo, function (utxo) {
                self.from(utxo, pubkeys, threshold);
            });
            return this;
        }
        var exists = _.some(this.inputs, function (input) {
            return input.prevTxId.toString('hex') === utxo.txId && input.outputIndex === utxo.outputIndex;
        });
        if (exists) {
            return this;
        }
        if (pubkeys && threshold) {
            this._fromMultisigUtxo(utxo, pubkeys, threshold);
        }
        else {
            this._fromNonP2SH(utxo);
        }
        return this;
    }
    ;
    _fromNonP2SH(utxo) {
        var clazz;
        utxo = new unspentoutput_1.UnspentOutput(utxo);
        if (utxo.script.isPublicKeyHashOut()) {
            clazz = _1.PublicKeyHashInput;
        }
        else if (utxo.script.isPublicKeyOut()) {
            clazz = _1.PublicKeyInput;
        }
        else {
            clazz = input_1.Input;
        }
        this.addInput(new clazz({
            output: new _1.Output({
                script: utxo.script,
                satoshis: utxo.satoshis
            }),
            prevTxId: utxo.txId,
            outputIndex: utxo.outputIndex,
            script: script_1.Script.empty()
        }));
    }
    ;
    _fromMultisigUtxo(utxo, pubkeys, threshold) {
        preconditions_1.default.checkArgument(threshold <= pubkeys.length, 'Number of required signatures must be greater than the number of public keys');
        var clazz;
        utxo = new unspentoutput_1.UnspentOutput(utxo);
        if (utxo.script.isMultisigOut()) {
            clazz = _1.MultiSigInput;
        }
        else if (utxo.script.isScriptHashOut()) {
            clazz = _1.MultiSigScriptHashInput;
        }
        else {
            throw new Error("@TODO");
        }
        this.addInput(new clazz({
            output: new _1.Output({
                script: utxo.script,
                satoshis: utxo.satoshis
            }),
            prevTxId: utxo.txId,
            outputIndex: utxo.outputIndex,
            script: script_1.Script.empty()
        }, pubkeys, threshold));
    }
    ;
    addInput(input, outputScript, satoshis) {
        preconditions_1.default.checkArgumentType(input, input_1.Input, 'input');
        if (!input.output && (_.isUndefined(outputScript) || _.isUndefined(satoshis))) {
            throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.NeedMoreInfo, 'Need information about the UTXO script and satoshis');
        }
        if (!input.output && outputScript && !_.isUndefined(satoshis)) {
            outputScript = outputScript instanceof script_1.Script ? outputScript : new script_1.Script(outputScript);
            preconditions_1.default.checkArgumentType(satoshis, 'number', 'satoshis');
            input.output = new _1.Output({
                script: outputScript,
                satoshis: satoshis
            });
        }
        return this.uncheckedAddInput(input);
    }
    ;
    uncheckedAddInput(input) {
        preconditions_1.default.checkArgumentType(input, input_1.Input, 'input');
        this.inputs.push(input);
        this._inputAmount = undefined;
        this._updateChangeOutput();
        return this;
    }
    ;
    hasAllUtxoInfo() {
        return _.every(this.inputs.map(function (input) {
            return !!input.output;
        }));
    }
    ;
    fee(amount) {
        preconditions_1.default.checkArgument(_.isNumber(amount), 'amount must be a number');
        this._fee = amount;
        this._updateChangeOutput();
        return this;
    }
    ;
    feePerKb(amount) {
        preconditions_1.default.checkArgument(_.isNumber(amount), 'amount must be a number');
        this._feePerKb = amount;
        this._updateChangeOutput();
        return this;
    }
    ;
    change(address) {
        preconditions_1.default.checkArgument(address, 'address is required');
        this._changeScript = script_1.Script.fromAddress(address);
        this._updateChangeOutput();
        return this;
    }
    ;
    getChangeOutput() {
        if (!_.isUndefined(this._changeIndex)) {
            return this.outputs[this._changeIndex];
        }
        return null;
    }
    ;
    to(address, amount) {
        if (_.isArray(address)) {
            var self = this;
            _.each(address, function (to) {
                self.to(to.address, to.satoshis);
            });
            return this;
        }
        preconditions_1.default.checkArgument(util_1.JSUtil.isNaturalNumber(amount), 'Amount is expected to be a positive integer');
        this.addOutput(new _1.Output({
            script: new script_1.Script(new address_1.Address(address)),
            satoshis: amount
        }));
        return this;
    }
    ;
    addData(value) {
        this.addOutput(new _1.Output({
            script: script_1.Script.buildDataOut(value),
            satoshis: 0
        }));
        return this;
    }
    ;
    addOutput(output) {
        preconditions_1.default.checkArgumentType(output, _1.Output, 'output');
        this._addOutput(output);
        this._updateChangeOutput();
        return this;
    }
    ;
    clearOutputs() {
        this.outputs = [];
        this._clearSignatures();
        this._outputAmount = undefined;
        this._changeIndex = undefined;
        this._updateChangeOutput();
        return this;
    }
    ;
    _addOutput(output) {
        this.outputs.push(output);
        this._outputAmount = undefined;
    }
    ;
    _getOutputAmount() {
        if (_.isUndefined(this._outputAmount)) {
            var self = this;
            this._outputAmount = 0;
            _.each(this.outputs, function (output) {
                self._outputAmount += output.satoshis;
            });
        }
        return this._outputAmount;
    }
    ;
    _getInputAmount() {
        if (_.isUndefined(this._inputAmount)) {
            var self = this;
            this._inputAmount = 0;
            _.each(this.inputs, function (input) {
                if (_.isUndefined(input.output)) {
                    throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.Input.errors.MissingPreviousOutput);
                }
                self._inputAmount += input.output.satoshis;
            });
        }
        return this._inputAmount;
    }
    ;
    _updateChangeOutput() {
        if (!this._changeScript) {
            return;
        }
        this._clearSignatures();
        if (!_.isUndefined(this._changeIndex)) {
            this._removeOutput(this._changeIndex);
        }
        var available = this._getUnspentValue();
        var fee = this.getFee();
        var changeAmount = available - fee;
        if (changeAmount > 0) {
            this._changeIndex = this.outputs.length;
            this._addOutput(new _1.Output({
                script: this._changeScript,
                satoshis: changeAmount
            }));
        }
        else {
            this._changeIndex = undefined;
        }
    }
    ;
    getFee() {
        if (this.isCoinbase()) {
            return 0;
        }
        if (!_.isUndefined(this._fee)) {
            return this._fee;
        }
        if (!this._changeScript) {
            return this._getUnspentValue();
        }
        return this._estimateFee();
    }
    ;
    _estimateFee() {
        var estimatedSize = this._estimateSize();
        var available = this._getUnspentValue();
        return Transaction._estimateFee(estimatedSize, available, this._feePerKb);
    }
    ;
    _getUnspentValue() {
        return this._getInputAmount() - this._getOutputAmount();
    }
    ;
    _clearSignatures() {
        _.each(this.inputs, function (input) {
            input.clearSignatures();
        });
    }
    ;
    static _estimateFee(size, amountAvailable, feePerKb) {
        var fee = Math.ceil(size / 1000) * (feePerKb || Transaction.FEE_PER_KB);
        if (amountAvailable > fee) {
            size += Transaction.CHANGE_OUTPUT_MAX_SIZE;
        }
        return Math.ceil(size / 1000) * (feePerKb || Transaction.FEE_PER_KB);
    }
    ;
    _estimateSize() {
        var result = Transaction.MAXIMUM_EXTRA_SIZE;
        _.each(this.inputs, function (input) {
            result += input._estimateSize();
        });
        _.each(this.outputs, function (output) {
            result += output.script.toBuffer().length + 9;
        });
        return result;
    }
    ;
    _removeOutput(index) {
        var output = this.outputs[index];
        this.outputs = _.without(this.outputs, output);
        this._outputAmount = undefined;
    }
    ;
    removeOutput(index) {
        this._removeOutput(index);
        this._updateChangeOutput();
    }
    ;
    sort() {
        this.sortInputs(function (inputs) {
            var copy = Array.prototype.concat.apply([], inputs);
            copy.sort(function (first, second) {
                return compare(first.prevTxId, second.prevTxId)
                    || first.outputIndex - second.outputIndex;
            });
            return copy;
        });
        this.sortOutputs(function (outputs) {
            var copy = Array.prototype.concat.apply([], outputs);
            copy.sort(function (first, second) {
                return first.satoshis - second.satoshis
                    || compare(first.script.toBuffer(), second.script.toBuffer());
            });
            return copy;
        });
        return this;
    }
    ;
    shuffleOutputs() {
        return this.sortOutputs(_.shuffle);
    }
    ;
    sortOutputs(sortingFunction) {
        var outs = sortingFunction(this.outputs);
        return this._newOutputOrder(outs);
    }
    ;
    sortInputs(sortingFunction) {
        this.inputs = sortingFunction(this.inputs);
        this._clearSignatures();
        return this;
    }
    ;
    _newOutputOrder(newOutputs) {
        var isInvalidSorting = (this.outputs.length !== newOutputs.length ||
            _.difference(this.outputs, newOutputs).length !== 0);
        if (isInvalidSorting) {
            throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.InvalidSorting);
        }
        if (!_.isUndefined(this._changeIndex)) {
            var changeOutput = this.outputs[this._changeIndex];
            this._changeIndex = _.findIndex(newOutputs, changeOutput);
        }
        this.outputs = newOutputs;
        return this;
    }
    ;
    removeInput(txId, outputIndex) {
        var index;
        if (!outputIndex && _.isNumber(txId)) {
            index = txId;
        }
        else {
            index = _.findIndex(this.inputs, function (input) {
                return input.prevTxId.toString('hex') === txId && input.outputIndex === outputIndex;
            });
        }
        if (index < 0 || index >= this.inputs.length) {
            throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.InvalidIndex, index, this.inputs.length);
        }
        var input = this.inputs[index];
        this.inputs = _.without(this.inputs, input);
        this._inputAmount = undefined;
        this._updateChangeOutput();
    }
    ;
    sign(privateKey, sigtype) {
        preconditions_1.default.checkState(this.hasAllUtxoInfo(), 'Not all utxo information is available to sign the transaction.');
        var self = this;
        if (_.isArray(privateKey)) {
            _.each(privateKey, function (privateKey) {
                self.sign(privateKey, sigtype);
            });
            return this;
        }
        _.each(this.getSignatures(privateKey, sigtype), function (signature) {
            self.applySignature(signature);
        });
        return this;
    }
    ;
    getSignatures(privKey, sigtype) {
        privKey = new privatekey_1.PrivateKey(privKey);
        sigtype = sigtype || signature_1.Signature.SIGHASH_ALL;
        var transaction = this;
        var results = [];
        var hashData = crypto_1.Hash.sha256ripemd160(privKey.publicKey.toBuffer());
        _.each(this.inputs, function forEachInput(input, index) {
            _.each(input.getSignatures(transaction, privKey, index, sigtype, hashData), function (signature) {
                results.push(signature);
            });
        });
        return results;
    }
    ;
    applySignature(signature) {
        this.inputs[signature.inputIndex].addSignature(this, signature);
        return this;
    }
    ;
    isFullySigned() {
        _.each(this.inputs, function (input) {
            if (input.isFullySigned === input_1.Input.prototype.isFullySigned) {
                throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.UnableToVerifySignature, 'Unrecognized script kind, or not enough information to execute script.' +
                    'This usually happens when creating a transaction from a serialized transaction');
            }
        });
        return _.every(_.map(this.inputs, function (input) {
            return input.isFullySigned();
        }));
    }
    ;
    isValidSignature(signature) {
        var self = this;
        if (this.inputs[signature.inputIndex].isValidSignature === input_1.Input.prototype.isValidSignature) {
            throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Transaction.errors.UnableToVerifySignature, 'Unrecognized script kind, or not enough information to execute script.' +
                'This usually happens when creating a transaction from a serialized transaction');
        }
        return this.inputs[signature.inputIndex].isValidSignature(self, signature);
    }
    ;
    verifySignature(sig, pubkey, nin, subscript) {
        return sighash_1.Sighash.verify(this, sig, pubkey, nin, subscript);
    }
    ;
    verify() {
        if (this.inputs.length === 0) {
            return 'transaction txins empty';
        }
        if (this.outputs.length === 0) {
            return 'transaction txouts empty';
        }
        var valueoutbn = new crypto_1.BitcoreBN(0);
        for (var i = 0; i < this.outputs.length; i++) {
            var txout = this.outputs[i];
            if (txout.invalidSatoshis()) {
                return 'transaction txout ' + i + ' satoshis is invalid';
            }
            if (txout._satoshisBN.gt(new crypto_1.BitcoreBN(Transaction.MAX_MONEY, 10))) {
                return 'transaction txout ' + i + ' greater than MAX_MONEY';
            }
            valueoutbn = new crypto_1.BitcoreBN(valueoutbn.add(txout._satoshisBN));
            if (valueoutbn.gt(new crypto_1.BitcoreBN(Transaction.MAX_MONEY))) {
                return 'transaction txout ' + i + ' total output greater than MAX_MONEY';
            }
        }
        if (this.toBuffer().length > MAX_BLOCK_SIZE) {
            return 'transaction over the maximum block size';
        }
        var txinmap = {};
        for (i = 0; i < this.inputs.length; i++) {
            var txin = this.inputs[i];
            var inputid = txin.prevTxId + ':' + txin.outputIndex;
            if (!_.isUndefined(txinmap[inputid])) {
                return 'transaction input ' + i + ' duplicate input';
            }
            txinmap[inputid] = true;
        }
        var isCoinbase = this.isCoinbase();
        if (isCoinbase) {
            var buf = this.inputs[0]._scriptBuffer;
            if (buf.length < 2 || buf.length > 100) {
                return 'coinbase transaction script size invalid';
            }
        }
        else {
            for (i = 0; i < this.inputs.length; i++) {
                if (this.inputs[i].isNull()) {
                    return 'transaction input ' + i + ' has null input';
                }
            }
        }
        return true;
    }
    ;
    isCoinbase() {
        return (this.inputs.length === 1 && this.inputs[0].isNull());
    }
    ;
    isRBF() {
        for (var i = 0; i < this.inputs.length; i++) {
            var input = this.inputs[i];
            if (input.sequenceNumber < input_1.Input.MAXINT - 1) {
                return true;
            }
        }
        return false;
    }
    ;
    enableRBF() {
        for (var i = 0; i < this.inputs.length; i++) {
            var input = this.inputs[i];
            if (input.sequenceNumber >= input_1.Input.MAXINT - 1) {
                input.sequenceNumber = input_1.Input.DEFAULT_RBF_SEQNUMBER;
            }
        }
        return this;
    }
    ;
}
exports.Transaction = Transaction;
Transaction.Input = input_1.Input;
Transaction.Output = _1.Output;
Transaction.Signature = _1.TransactionSignature;
Transaction.Sighash = sighash_1.Sighash;
Transaction.DUST_AMOUNT = 546;
Transaction.FEE_SECURITY_MARGIN = 15;
Transaction.MAX_MONEY = 84096000 * 1e8;
Transaction.NLOCKTIME_BLOCKHEIGHT_LIMIT = 5e8;
Transaction.NLOCKTIME_MAX_VALUE = 4294967295;
Transaction.FEE_PER_KB = 10000;
Transaction.CHANGE_OUTPUT_MAX_SIZE = 20 + 4 + 34 + 4;
Transaction.MAXIMUM_EXTRA_SIZE = 4 + 9 + 9 + 4;
Transaction.DEFAULT_BRANCH_ID = 0x76b809bb;
//# sourceMappingURL=transaction.js.map