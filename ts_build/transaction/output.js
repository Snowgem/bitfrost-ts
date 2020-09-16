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
exports.Output = void 0;
const _ = __importStar(require("lodash"));
const bn_js_1 = __importDefault(require("bn.js"));
const bn_1 = require("../crypto/bn");
const buffer_1 = require("buffer");
const buffer_2 = require("../util/buffer");
const js_1 = require("../util/js");
const bufferwriter_1 = require("../encoding/bufferwriter");
const script_1 = require("../script");
const preconditions_1 = __importDefault(require("../util/preconditions"));
const errors_1 = require("../errors");
var MAX_SAFE_INTEGER = 0x1fffffffffffff;
class Output {
    constructor(args) {
        this.invalidSatoshis = function () {
            if (this._satoshis > MAX_SAFE_INTEGER) {
                return 'transaction txout satoshis greater than max safe integer';
            }
            if (this._satoshis !== this._satoshisBN.toNumber()) {
                return 'transaction txout satoshis has corrupted value';
            }
            if (this._satoshis < 0) {
                return 'transaction txout negative';
            }
            return false;
        };
        this.toObject = function toObject() {
            const obj = {
                satoshis: this.satoshis,
                script: this._scriptBuffer.toString('hex')
            };
            return obj;
        };
        this.toJSON = this.toObject;
        this.setScriptFromBuffer = function (buffer) {
            this._scriptBuffer = buffer;
            try {
                this._script = script_1.Script.fromBuffer(this._scriptBuffer);
                this._script._isOutput = true;
            }
            catch (e) {
                if (e instanceof errors_1.BitcoreError) {
                    this._script = null;
                }
                else {
                    throw e;
                }
            }
        };
        this.setScript = function (script) {
            if (script instanceof script_1.Script) {
                this._scriptBuffer = script.toBuffer();
                this._script = script;
                this._script._isOutput = true;
            }
            else if (_.isString(script)) {
                this._script = script_1.Script.fromString(script);
                this._scriptBuffer = this._script.toBuffer();
                this._script._isOutput = true;
            }
            else if (buffer_2.BufferUtil.isBuffer(script)) {
                this.setScriptFromBuffer(script);
            }
            else {
                throw new TypeError('Invalid argument type: script');
            }
            return this;
        };
        this.inspect = function () {
            var scriptStr;
            if (this.script) {
                scriptStr = this.script.inspect();
            }
            else {
                scriptStr = this._scriptBuffer.toString('hex');
            }
            return '<Output (' + this.satoshis + ' sats) ' + scriptStr + '>';
        };
        this.toBufferWriter = function (writer) {
            if (!writer) {
                writer = new bufferwriter_1.BufferWriter();
            }
            writer.writeUInt64LEBN(this._satoshisBN);
            var script = this._scriptBuffer;
            writer.writeVarintNum(script.length);
            writer.write(script);
            return writer;
        };
        if (!(this instanceof Output)) {
            return new Output(args);
        }
        if (_.isObject(args)) {
            this.setSatoshis(args.satoshis);
            if (buffer_2.BufferUtil.isBuffer(args.script)) {
                this._scriptBuffer = args.script;
            }
            else {
                var script;
                if (_.isString(args.script) && js_1.JSUtil.isHexa(args.script)) {
                    script = new buffer_1.Buffer(args.script, 'hex');
                }
                else {
                    script = args.script;
                }
                this.setScript(script);
            }
        }
        else {
            throw new TypeError('Unrecognized argument for Output');
        }
    }
    get script() {
        if (this._script) {
            return this._script;
        }
        else {
            this.setScriptFromBuffer(this._scriptBuffer);
            return this._script;
        }
    }
    get satoshis() {
        return this._satoshis;
    }
    setSatoshis(num) {
        if (num instanceof bn_js_1.default) {
            this._satoshisBN = num;
            this._satoshis = num.toNumber();
        }
        else if (typeof num === 'string') {
            this._satoshis = parseInt(num, 10);
            this._satoshisBN = bn_1.BitcoreBN.fromNumber(this._satoshis);
        }
        else {
            preconditions_1.default.checkArgument(js_1.JSUtil.isNaturalNumber(num), 'Output satoshis is not a natural number');
            this._satoshisBN = bn_1.BitcoreBN.fromNumber(num);
            this._satoshis = num;
        }
        preconditions_1.default.checkState(js_1.JSUtil.isNaturalNumber(this._satoshis), 'Output satoshis is not a natural number');
    }
}
exports.Output = Output;
Output.fromObject = function (data) {
    return new Output(data);
};
Output.fromBufferReader = function (br) {
    const size = br.readVarintNum();
    const obj = {
        satoshis: br.readUInt64LEBN(),
        script: size !== 0 ? br.read(size) : new buffer_1.Buffer([])
    };
    return new Output(obj);
};
//# sourceMappingURL=output.js.map