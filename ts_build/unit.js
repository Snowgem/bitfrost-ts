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
exports.Unit = void 0;
const _ = __importStar(require("lodash"));
const errors_1 = require("./errors");
const preconditions_1 = __importDefault(require("./util/preconditions"));
const spec_1 = require("./errors/spec");
const UNITS = {
    BTC: [1e8, 8],
    mBTC: [1e5, 5],
    uBTC: [1e2, 2],
    bits: [1e2, 2],
    satoshis: [1, 0]
};
const UNIT_ERRORS = spec_1.ERROR_TYPES.Unit.errors;
class Unit {
    constructor(amount, code) {
        this.toMilis = this.toMillis;
        this.toBits = this.toMicros;
        this.toJSON = this.toObject;
        if (!(this instanceof Unit)) {
            return new Unit(amount, code);
        }
        if (_.isNumber(code)) {
            if (code <= 0) {
                throw new errors_1.BitcoreError(UNIT_ERRORS.InvalidRate, code);
            }
            amount = amount / code;
            code = this.BTC;
        }
        this._value = this._from(amount, code);
    }
    get BTC() {
        return this.to([1e8, 8]);
    }
    get mBTC() {
        return this.to([1e5, 5]);
    }
    get uBTC() {
        return this.to([1e2, 2]);
    }
    get bits() {
        return this.to([1e2, 2]);
    }
    get satoshis() {
        return this.to([1, 0]);
    }
    static fromObject(data) {
        preconditions_1.default.checkArgument(_.isObject(data), 'Argument is expected to be an object');
        return new Unit(data.amount, data.code);
    }
    static fromBTC(amount) {
        return new Unit(amount, UNITS.BTC);
    }
    static fromMilis(amount) {
        return new Unit(amount, UNITS.mBTC);
    }
    static fromMicros(amount) {
        return new Unit(amount, UNITS.bits);
    }
    static fromSatoshis(amount) {
        return new Unit(amount, UNITS.satoshis);
    }
    static fromFiat(amount, rate) {
        return new Unit(amount, rate);
    }
    _from(amount, code) {
        if (!UNITS[code]) {
            throw new errors_1.BitcoreError(UNIT_ERRORS.UnknownCode, code);
        }
        return parseInt((amount * UNITS[code][0]).toFixed(), 10);
    }
    to(code) {
        if (_.isNumber(code)) {
            if (code <= 0) {
                throw new errors_1.BitcoreError(UNIT_ERRORS.InvalidRate, code);
            }
            return parseFloat((this.BTC * code).toFixed(2));
        }
        if (!UNITS[code]) {
            throw new errors_1.BitcoreError(UNIT_ERRORS.UnknownCode, code);
        }
        const value = this._value / UNITS[code][0];
        return parseFloat(value.toFixed(UNITS[code][1]));
    }
    toBTC() {
        return this.to(this.BTC);
    }
    toMillis() {
        return this.to(this.mBTC);
    }
    toMicros() {
        return this.to(this.bits);
    }
    toSatoshis() {
        return this.to(this.satoshis);
    }
    atRate(rate) {
        return this.to(rate);
    }
    toString() {
        return this.satoshis + ' satoshis';
    }
    toObject() {
        return {
            amount: this.BTC,
            code: this.BTC
        };
    }
    inspect() {
        return '<Unit: ' + this.toString() + '>';
    }
}
exports.Unit = Unit;
Unit.BTC = UNITS.BTC;
Unit.mBTC = UNITS.mBTC;
Unit.uBTC = UNITS.uBTC;
Unit.bits = UNITS.bits;
Unit.satoshis = UNITS.satoshis;
Unit.fromJSON = Unit.fromObject;
Unit.fromBits = Unit.fromMicros;
//# sourceMappingURL=unit.js.map