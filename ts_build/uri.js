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
Object.defineProperty(exports, "__esModule", { value: true });
exports.URI = void 0;
const _ = __importStar(require("lodash"));
const url_1 = require("url");
const address_1 = require("./address");
const unit_1 = require("./unit");
class URI {
    constructor(data, knownParams = []) {
        this.extras = {};
        this.toObject = function toObject() {
            const json = {};
            for (const m of URI.Members) {
                if (this.hasOwnProperty(m) && typeof this[m] !== 'undefined') {
                    json[m] = this[m].toString();
                }
            }
            _.extend(json, this.extras);
            return json;
        };
        this.toJSON = this.toObject;
        if (!(this instanceof URI)) {
            return new URI(data, knownParams);
        }
        this.extras = {};
        this.knownParams = knownParams || [];
        this.address = this.network = this.amount = this.message = null;
        if (typeof data === 'string') {
            const params = URI.parse(data);
            if (params.amount) {
                params.amount = this._parseAmount(params.amount);
            }
            this._fromObject(params);
        }
        else if (typeof data === 'object' && !(data instanceof URI)) {
            this._fromObject(data);
        }
        else {
            throw new TypeError('Unrecognized data format.');
        }
    }
    static fromString(str) {
        if (typeof str !== 'string') {
            throw new TypeError('Expected a string');
        }
        return new URI(str);
    }
    static fromObject(json) {
        return new URI(json);
    }
    static isValid(arg, knownParams = []) {
        try {
            const uri = new URI(arg, knownParams);
        }
        catch (err) {
            return false;
        }
        return true;
    }
    static parse(uri) {
        const info = url_1.parse(uri, true);
        if (info.protocol !== 'bitcoin:') {
            throw new TypeError('Invalid bitcoin URI');
        }
        const group = /[^:]*:\/?\/?([^?]*)/.exec(uri);
        info.query.address = (group && group[1]) || undefined;
        return info.query;
    }
    _fromObject(obj) {
        if (!address_1.Address.isValid(obj.address)) {
            throw new TypeError('Invalid bitcoin address');
        }
        this.address = new address_1.Address(obj.address);
        this.network = this.address.network;
        this.amount = Number(obj.amount);
        for (const key in obj) {
            if (key === 'address' || key === 'amount') {
                continue;
            }
            if (/^req-/.exec(key) && this.knownParams.indexOf(key) === -1) {
                throw Error('Unknown required argument ' + key);
            }
            const destination = URI.Members.indexOf(key) > -1 ? this : this.extras;
            destination[key] = obj[key];
        }
    }
    _parseAmount(amount) {
        amount = Number(amount);
        if (isNaN(amount)) {
            throw new TypeError('Invalid amount');
        }
        return unit_1.Unit.fromBTC(amount).toSatoshis();
    }
    toString() {
        const query = {};
        if (this.amount) {
            query.amount = unit_1.Unit.fromSatoshis(this.amount).toBTC();
        }
        if (this.message) {
            query.message = this.message;
        }
        if (this.label) {
            query.label = this.label;
        }
        if (this.r) {
            query.r = this.r.toString();
        }
        _.extend(query, this.extras);
        return url_1.format({
            protocol: 'bitcoin:',
            host: this.address.toString(),
            query
        });
    }
    inspect() {
        return '<URI: ' + this.toString() + '>';
    }
}
exports.URI = URI;
URI.fromJSON = URI.fromObject;
URI.Members = ['address', 'amount', 'message', 'label', 'r'];
//# sourceMappingURL=uri.js.map