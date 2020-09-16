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
exports.UnspentOutput = void 0;
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("../util/preconditions"));
const js_1 = require("../util/js");
const script_1 = require("../script");
const address_1 = require("../address");
const unit_1 = require("../unit");
const errors_1 = require("../errors");
class UnspentOutput {
    constructor(data) {
        this.inspect = function () {
            return '<UnspentOutput: ' + this.txId + ':' + this.outputIndex +
                ', satoshis: ' + this.satoshis + ', address: ' + this.address + '>';
        };
        this.toString = function () {
            return this.txId + ':' + this.outputIndex;
        };
        this.toObject = function toObject() {
            return {
                address: this.address ? this.address.toString() : undefined,
                txid: this.txId,
                vout: this.outputIndex,
                scriptPubKey: this.script.toBuffer().toString('hex'),
                amount: unit_1.Unit.fromSatoshis(this.satoshis).toBTC()
            };
        };
        this.toJSON = this.toObject;
        if (!(this instanceof UnspentOutput)) {
            return new UnspentOutput(data);
        }
        data = data;
        preconditions_1.default.checkArgument(_.isObject(data), 'Must provide an object from where to extract data');
        var address = data.address ? new address_1.Address(data.address) : undefined;
        var txId = data.txId ? data.txId : data.txId;
        if (!txId || !js_1.JSUtil.isHexaString(txId) || txId.length > 64) {
            throw new errors_1.BitcoreError('InvalidArgument', data);
        }
        var outputIndex = _.isUndefined(data.vout) ? data.outputIndex : data.vout;
        if (!_.isNumber(outputIndex)) {
            throw new Error('Invalid outputIndex, received ' + outputIndex);
        }
        preconditions_1.default.checkArgument(!_.isUndefined(data.scriptPubKey) || !_.isUndefined(data.script), 'Must provide the scriptPubKey for that output!');
        var script = new script_1.Script(data.scriptPubKey || data.script);
        preconditions_1.default.checkArgument(!_.isUndefined(data.amount) || !_.isUndefined(data.satoshis), 'Must provide an amount for the output');
        var amount = !_.isUndefined(data.amount) ? unit_1.Unit.fromBTC(data.amount).toSatoshis() : data.satoshis;
        preconditions_1.default.checkArgument(_.isNumber(amount), 'Amount must be a number');
        js_1.JSUtil.defineImmutable(this, {
            address: address,
            txId: txId,
            outputIndex: outputIndex,
            script: script,
            satoshis: amount
        });
    }
}
exports.UnspentOutput = UnspentOutput;
UnspentOutput.fromObject = function (data) {
    return new UnspentOutput(data);
};
//# sourceMappingURL=unspentoutput.js.map