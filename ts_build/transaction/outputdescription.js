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
exports.OutputDescription = void 0;
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("../util/preconditions"));
const bufferwriter_1 = require("../encoding/bufferwriter");
const NOTEENCRYPTION_AUTH_BYTES = 16;
const ZC_NOTEPLAINTEXT_LEADING = 1;
const ZC_V_SIZE = 8;
const ZC_RHO_SIZE = 32;
const ZC_R_SIZE = 32;
const ZC_MEMO_SIZE = 512;
const ZC_DIVERSIFIER_SIZE = 11;
const ZC_JUBJUB_POINT_SIZE = 32;
const ZC_JUBJUB_SCALAR_SIZE = 32;
const ZC_NOTEPLAINTEXT_SIZE = ZC_NOTEPLAINTEXT_LEADING + ZC_V_SIZE + ZC_RHO_SIZE + ZC_R_SIZE + ZC_MEMO_SIZE;
const ZC_SAPLING_ENCPLAINTEXT_SIZE = ZC_NOTEPLAINTEXT_LEADING + ZC_DIVERSIFIER_SIZE + ZC_V_SIZE + ZC_R_SIZE + ZC_MEMO_SIZE;
const ZC_SAPLING_OUTPLAINTEXT_SIZE = ZC_JUBJUB_POINT_SIZE + ZC_JUBJUB_SCALAR_SIZE;
const ZC_SAPLING_ENCCIPHERTEXT_SIZE = ZC_SAPLING_ENCPLAINTEXT_SIZE + NOTEENCRYPTION_AUTH_BYTES;
const ZC_SAPLING_OUTCIPHERTEXT_SIZE = ZC_SAPLING_OUTPLAINTEXT_SIZE + NOTEENCRYPTION_AUTH_BYTES;
class OutputDescription {
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
            writer.write(this.cmu);
            writer.write(this.ephemeralKey);
            writer.write(this.encCipherText);
            writer.write(this.outCipherText);
            writer.write(this.proof);
            return writer;
        };
        if (!(this instanceof OutputDescription)) {
            return new OutputDescription(params);
        }
        if (params) {
            return this._fromObject(params);
        }
    }
}
exports.OutputDescription = OutputDescription;
OutputDescription.fromObject = function (obj) {
    preconditions_1.default.checkArgument(_.isObject(obj));
    var outputdesc = new OutputDescription();
    return outputdesc._fromObject(obj);
};
OutputDescription.fromBufferReader = function (br) {
    var obj = new OutputDescription();
    obj.cv = br.read(32);
    obj.cmu = br.read(32);
    obj.ephemeralKey = br.read(32);
    obj.encCipherText = br.read(ZC_SAPLING_ENCCIPHERTEXT_SIZE);
    obj.outCipherText = br.read(ZC_SAPLING_OUTCIPHERTEXT_SIZE);
    obj.proof = br.read(48 + 96 + 48);
    return obj;
};
//# sourceMappingURL=outputdescription.js.map