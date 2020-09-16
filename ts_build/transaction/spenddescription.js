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
exports.SpendDescription = void 0;
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("../util/preconditions"));
const bufferwriter_1 = require("../encoding/bufferwriter");
class SpendDescription {
    constructor(params) {
        this._fromObject = function (params) {
            return this;
        };
        this.toObject = function toObject() {
            var obj = {};
            return obj;
        };
        this.toJSON = this.toObject;
        this.toBufferWriter = function (writer) {
            var i;
            if (!writer) {
                writer = new bufferwriter_1.BufferWriter();
            }
            writer.write(this.cv);
            writer.write(this.anchor);
            writer.write(this.nullifier);
            writer.write(this.rk);
            writer.write(this.proof);
            writer.write(this.spendAuthSig);
            return writer;
        };
        if (!(this instanceof SpendDescription)) {
            return new SpendDescription(params);
        }
        if (params) {
            return this._fromObject(params);
        }
    }
}
exports.SpendDescription = SpendDescription;
SpendDescription.fromObject = function (obj) {
    preconditions_1.default.checkArgument(_.isObject(obj));
    var spenddesc = new SpendDescription();
    return spenddesc._fromObject(obj);
};
SpendDescription.fromBufferReader = function (br) {
    var obj = new SpendDescription();
    obj.cv = br.read(32);
    obj.anchor = br.read(32);
    obj.nullifier = br.read(32);
    obj.rk = br.read(32);
    obj.proof = br.read(48 + 96 + 48);
    obj.spendAuthSig = br.read(64);
    return obj;
};
//# sourceMappingURL=spenddescription.js.map