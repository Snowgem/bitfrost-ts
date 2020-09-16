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
exports.Script = void 0;
const preconditions_1 = __importDefault(require("../util/preconditions"));
const _ = __importStar(require("lodash"));
const networks_1 = require("../networks");
const address_1 = require("../address");
const encoding_1 = require("../encoding");
const crypto_1 = require("../crypto");
const opcode_1 = require("../opcode");
const publickey_1 = require("../publickey");
const errors_1 = require("../errors");
const buffer_1 = require("buffer");
const util_1 = require("../util");
const signature_1 = require("../crypto/signature");
const interpreter_1 = require("./interpreter");
class Script {
    constructor(from) {
        this._isInput = false;
        this._isOutput = false;
        this.outputIdentifiers = {
            PUBKEY_OUT: this.isPublicKeyOut,
            PUBKEYHASH_OUT: this.isPublicKeyHashOut,
            MULTISIG_OUT: this.isMultisigOut,
            SCRIPTHASH_OUT: this.isScriptHashOut,
            DATA_OUT: this.isDataOut
        };
        this.inputIdentifiers = {
            PUBKEY_IN: this.isPublicKeyIn,
            PUBKEYHASH_IN: this.isPublicKeyHashIn,
            MULTISIG_IN: this.isMultisigIn,
            SCRIPTHASH_IN: this.isScriptHashIn
        };
        if (!(this instanceof Script)) {
            return new Script(from);
        }
        this.chunks = [];
        if (util_1.BufferUtil.isBuffer(from)) {
            return Script.fromBuffer(from);
        }
        else if (from instanceof address_1.Address) {
            return Script.fromAddress(from);
        }
        else if (from instanceof Script) {
            return Script.fromBuffer(from.toBuffer());
        }
        else if (_.isString(from)) {
            return Script.fromString(from);
        }
        else if (_.isObject(from) && _.isArray(from.chunks)) {
            this.set(from);
        }
    }
    set(obj) {
        preconditions_1.default.checkArgument(_.isObject(obj));
        preconditions_1.default.checkArgument(_.isArray(obj.chunks));
        this.chunks = obj.chunks;
        return this;
    }
    static fromBuffer(buffer) {
        const script = new Script();
        script.chunks = [];
        const br = new encoding_1.BufferReader(buffer);
        while (!br.finished()) {
            try {
                const opcodenum = br.readUInt8();
                let len;
                let buf;
                if (opcodenum > 0 && opcodenum < opcode_1.OP_CODES.OP_PUSHDATA1) {
                    len = opcodenum;
                    script.chunks.push({
                        buf: br.read(len),
                        len,
                        opcodenum
                    });
                }
                else if (opcodenum === opcode_1.OP_CODES.OP_PUSHDATA1) {
                    len = br.readUInt8();
                    buf = br.read(len);
                    script.chunks.push({
                        buf,
                        len,
                        opcodenum
                    });
                }
                else if (opcodenum === opcode_1.OP_CODES.OP_PUSHDATA2) {
                    len = br.readUInt16LE();
                    buf = br.read(len);
                    script.chunks.push({
                        buf,
                        len,
                        opcodenum
                    });
                }
                else if (opcodenum === opcode_1.OP_CODES.OP_PUSHDATA4) {
                    len = br.readUInt32LE();
                    buf = br.read(len);
                    script.chunks.push({
                        buf,
                        len,
                        opcodenum
                    });
                }
                else {
                    script.chunks.push({
                        opcodenum
                    });
                }
            }
            catch (e) {
                if (e instanceof RangeError) {
                    throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Script.errors.InvalidBuffer, buffer.toString('hex'));
                }
                throw e;
            }
        }
        return script;
    }
    toBuffer() {
        const bw = new encoding_1.BufferWriter();
        for (const chunk of this.chunks) {
            const opcodenum = chunk.opcodenum;
            bw.writeUInt8(chunk.opcodenum);
            if (chunk.buf) {
                if (opcodenum < opcode_1.OP_CODES.OP_PUSHDATA1) {
                    bw.write(chunk.buf);
                }
                else if (opcodenum === opcode_1.OP_CODES.OP_PUSHDATA1) {
                    bw.writeUInt8(chunk.len);
                    bw.write(chunk.buf);
                }
                else if (opcodenum === opcode_1.OP_CODES.OP_PUSHDATA2) {
                    bw.writeUInt16LE(chunk.len);
                    bw.write(chunk.buf);
                }
                else if (opcodenum === opcode_1.OP_CODES.OP_PUSHDATA4) {
                    bw.writeUInt32LE(chunk.len);
                    bw.write(chunk.buf);
                }
            }
        }
        return bw.concat();
    }
    static fromASM(str) {
        const script = new Script();
        script.chunks = [];
        const tokens = str.split(' ');
        let i = 0;
        while (i < tokens.length) {
            const token = tokens[i];
            const opcode = new opcode_1.Opcode(token);
            const opcodenum = opcode.toNumber();
            if (_.isUndefined(opcodenum)) {
                const buf = buffer_1.Buffer.from(tokens[i], 'hex');
                script.chunks.push({
                    buf,
                    len: buf.length,
                    opcodenum: buf.length
                });
                i = i + 1;
            }
            else if (opcodenum === opcode_1.OP_CODES.OP_PUSHDATA1 ||
                opcodenum === opcode_1.OP_CODES.OP_PUSHDATA2 ||
                opcodenum === opcode_1.OP_CODES.OP_PUSHDATA4) {
                script.chunks.push({
                    buf: buffer_1.Buffer.from(tokens[i + 2], 'hex'),
                    len: parseInt(tokens[i + 1], 10),
                    opcodenum
                });
                i = i + 3;
            }
            else {
                script.chunks.push({
                    opcodenum
                });
                i = i + 1;
            }
        }
        return script;
    }
    static fromHex(str) {
        return new Script(new buffer_1.Buffer(str, 'hex'));
    }
    static fromString(str) {
        if (util_1.JSUtil.isHexa(str) || str.length === 0) {
            return new Script(new buffer_1.Buffer(str, 'hex'));
        }
        const script = new Script();
        script.chunks = [];
        const tokens = str.split(' ');
        let i = 0;
        while (i < tokens.length) {
            const token = tokens[i];
            const opcode = new opcode_1.Opcode(token);
            let opcodenum = opcode.toNumber();
            if (_.isUndefined(opcodenum)) {
                opcodenum = parseInt(token, 10);
                if (opcodenum > 0 && opcodenum < opcode_1.OP_CODES.OP_PUSHDATA1) {
                    script.chunks.push({
                        buf: buffer_1.Buffer.from(tokens[i + 1].slice(2), 'hex'),
                        len: opcodenum,
                        opcodenum
                    });
                    i = i + 2;
                }
                else {
                    throw new Error('Invalid script: ' + JSON.stringify(str));
                }
            }
            else if (opcodenum === opcode_1.OP_CODES.OP_PUSHDATA1 ||
                opcodenum === opcode_1.OP_CODES.OP_PUSHDATA2 ||
                opcodenum === opcode_1.OP_CODES.OP_PUSHDATA4) {
                if (tokens[i + 2].slice(0, 2) !== '0x') {
                    throw new Error('Pushdata data must start with 0x');
                }
                script.chunks.push({
                    buf: buffer_1.Buffer.from(tokens[i + 2].slice(2), 'hex'),
                    len: parseInt(tokens[i + 1], 10),
                    opcodenum
                });
                i = i + 3;
            }
            else {
                script.chunks.push({
                    opcodenum
                });
                i = i + 1;
            }
        }
        return script;
    }
    _chunkToString(chunk, type) {
        const opcodenum = chunk.opcodenum;
        const asm = type === 'asm';
        let str = '';
        if (!chunk.buf) {
            if (typeof opcode_1.Opcode.reverseMap[opcodenum] !== 'undefined') {
                if (asm) {
                    if (opcodenum === 0) {
                        str = str + ' 0';
                    }
                    else if (opcodenum === 79) {
                        str = str + ' -1';
                    }
                    else {
                        str = str + ' ' + new opcode_1.Opcode(opcodenum).toString();
                    }
                }
                else {
                    str = str + ' ' + new opcode_1.Opcode(opcodenum).toString();
                }
            }
            else {
                let numstr = opcodenum.toString(16);
                if (numstr.length % 2 !== 0) {
                    numstr = '0' + numstr;
                }
                str = asm ? str + ' ' + numstr : str + ' ' + '0x' + numstr;
            }
        }
        else {
            if ((!asm && opcodenum === opcode_1.OP_CODES.OP_PUSHDATA1) ||
                opcodenum === opcode_1.OP_CODES.OP_PUSHDATA2 ||
                opcodenum === opcode_1.OP_CODES.OP_PUSHDATA4) {
                str = str + ' ' + new opcode_1.Opcode(opcodenum).toString();
            }
            if (chunk.len > 0) {
                str = asm
                    ? str + ' ' + chunk.buf.toString('hex')
                    : str + ' ' + chunk.len + ' ' + '0x' + chunk.buf.toString('hex');
            }
        }
        return str;
    }
    toASM() {
        let str = '';
        for (const chunk of this.chunks) {
            str += this._chunkToString(chunk, 'asm');
        }
        return str.substr(1);
    }
    toString() {
        let str = '';
        for (const chunk of this.chunks) {
            str += this._chunkToString(chunk);
        }
        return str.substr(1);
    }
    toHex() {
        return this.toBuffer().toString('hex');
    }
    inspect() {
        return '<Script: ' + this.toString() + '>';
    }
    isPublicKeyHashOut() {
        return !!(this.chunks.length === 5 &&
            this.chunks[0].opcodenum === opcode_1.OP_CODES.OP_DUP &&
            this.chunks[1].opcodenum === opcode_1.OP_CODES.OP_HASH160 &&
            this.chunks[2].buf &&
            this.chunks[2].buf.length === 20 &&
            this.chunks[3].opcodenum === opcode_1.OP_CODES.OP_EQUALVERIFY &&
            this.chunks[4].opcodenum === opcode_1.OP_CODES.OP_CHECKSIG);
    }
    isPublicKeyHashIn() {
        if (this.chunks.length === 2) {
            const signatureBuf = this.chunks[0].buf;
            const pubkeyBuf = this.chunks[1].buf;
            if (signatureBuf &&
                signatureBuf.length &&
                signatureBuf[0] === 0x30 &&
                pubkeyBuf &&
                pubkeyBuf.length) {
                const version = pubkeyBuf[0];
                if ((version === 0x04 || version === 0x06 || version === 0x07) &&
                    pubkeyBuf.length === 65) {
                    return true;
                }
                else if ((version === 0x03 || version === 0x02) &&
                    pubkeyBuf.length === 33) {
                    return true;
                }
            }
        }
        return false;
    }
    getPublicKey() {
        preconditions_1.default.checkState(this.isPublicKeyOut(), "Can't retrieve PublicKey from a non-PK output");
        return this.chunks[0].buf;
    }
    getPublicKeyHash() {
        preconditions_1.default.checkState(this.isPublicKeyHashOut(), "Can't retrieve PublicKeyHash from a non-PKH output");
        return this.chunks[2].buf;
    }
    isPublicKeyOut() {
        if (this.chunks.length === 2 &&
            this.chunks[0].buf &&
            this.chunks[0].buf.length &&
            this.chunks[1].opcodenum === opcode_1.OP_CODES.OP_CHECKSIG) {
            const pubkeyBuf = this.chunks[0].buf;
            const version = pubkeyBuf[0];
            let isVersion = false;
            if ((version === 0x04 || version === 0x06 || version === 0x07) &&
                pubkeyBuf.length === 65) {
                isVersion = true;
            }
            else if ((version === 0x03 || version === 0x02) &&
                pubkeyBuf.length === 33) {
                isVersion = true;
            }
            if (isVersion) {
                return publickey_1.PublicKey.isValid(pubkeyBuf);
            }
        }
        return false;
    }
    isPublicKeyIn() {
        if (this.chunks.length === 1) {
            const signatureBuf = this.chunks[0].buf;
            if (signatureBuf && signatureBuf.length && signatureBuf[0] === 0x30) {
                return true;
            }
        }
        return false;
    }
    isScriptHashOut() {
        const buf = this.toBuffer();
        return (buf.length === 23 &&
            buf[0] === opcode_1.OP_CODES.OP_HASH160 &&
            buf[1] === 0x14 &&
            buf[buf.length - 1] === opcode_1.OP_CODES.OP_EQUAL);
    }
    isWitnessScriptHashOut() {
        const buf = this.toBuffer();
        return buf.length === 34 && buf[0] === 0 && buf[1] === 32;
    }
    isWitnessPublicKeyHashOut() {
        const buf = this.toBuffer();
        return buf.length === 22 && buf[0] === 0 && buf[1] === 20;
    }
    isWitnessProgram(values = {}) {
        if (!values) {
            values = {};
        }
        const buf = this.toBuffer();
        if (buf.length < 4 || buf.length > 42) {
            return false;
        }
        if (buf[0] !== opcode_1.OP_CODES.OP_0 &&
            !(buf[0] >= opcode_1.OP_CODES.OP_1 && buf[0] <= opcode_1.OP_CODES.OP_16)) {
            return false;
        }
        if (buf.length === buf[1] + 2) {
            values.version = buf[0];
            values.program = buf.slice(2, buf.length);
            return true;
        }
        return false;
    }
    isScriptHashIn() {
        if (this.chunks.length <= 1) {
            return false;
        }
        const redeemChunk = this.chunks[this.chunks.length - 1];
        const redeemBuf = redeemChunk.buf;
        if (!redeemBuf) {
            return false;
        }
        let redeemScript;
        try {
            redeemScript = Script.fromBuffer(redeemBuf);
        }
        catch (e) {
            if (e instanceof errors_1.BitcoreError) {
                return false;
            }
            throw e;
        }
        const type = redeemScript.classify();
        return type !== Script.types.UNKNOWN;
    }
    isMultisigOut() {
        return (this.chunks.length > 3 &&
            opcode_1.Opcode.isSmallIntOp(this.chunks[0].opcodenum) &&
            this.chunks.slice(1, this.chunks.length - 2).every(obj => {
                return obj.buf && util_1.BufferUtil.isBuffer(obj.buf);
            }) &&
            opcode_1.Opcode.isSmallIntOp(this.chunks[this.chunks.length - 2].opcodenum) &&
            this.chunks[this.chunks.length - 1].opcodenum ===
                opcode_1.OP_CODES.OP_CHECKMULTISIG);
    }
    isMultisigIn() {
        return (this.chunks.length >= 2 &&
            this.chunks[0].opcodenum === 0 &&
            this.chunks.slice(1, this.chunks.length).every(obj => {
                return (obj.buf && util_1.BufferUtil.isBuffer(obj.buf) && signature_1.Signature.isTxDER(obj.buf));
            }));
    }
    isDataOut() {
        return (this.chunks.length >= 1 &&
            this.chunks[0].opcodenum === opcode_1.OP_CODES.OP_RETURN &&
            (this.chunks.length === 1 ||
                (this.chunks.length === 2 &&
                    this.chunks[1].buf &&
                    this.chunks[1].buf.length <= Script.OP_RETURN_STANDARD_SIZE &&
                    this.chunks[1].len === this.chunks.length)));
    }
    getData() {
        if (this.isDataOut() || this.isScriptHashOut()) {
            if (_.isUndefined(this.chunks[1])) {
                return buffer_1.Buffer.alloc(0);
            }
            else {
                return buffer_1.Buffer.from(this.chunks[1].buf);
            }
        }
        if (this.isPublicKeyHashOut()) {
            return buffer_1.Buffer.from(this.chunks[2].buf);
        }
        throw new Error('Unrecognized script type to get data from');
    }
    isPushOnly() {
        return _.every(this.chunks, chunk => {
            return chunk.opcodenum <= opcode_1.OP_CODES.OP_16;
        });
    }
    classify() {
        if (this._isInput) {
            return this.classifyInput();
        }
        else if (this._isOutput) {
            return this.classifyOutput();
        }
        else {
            const outputType = this.classifyOutput();
            return outputType !== Script.types.UNKNOWN
                ? outputType
                : this.classifyInput();
        }
    }
    classifyOutput() {
        for (const type in this.outputIdentifiers) {
            if (this.outputIdentifiers[type].bind(this)()) {
                return Script.types[type];
            }
        }
        return Script.types.UNKNOWN;
    }
    classifyInput() {
        for (const type in this.inputIdentifiers) {
            if (this.inputIdentifiers[type].bind(this)()) {
                return Script.types[type];
            }
        }
        return Script.types.UNKNOWN;
    }
    isStandard() {
        return this.classify() !== Script.types.UNKNOWN;
    }
    prepend(obj) {
        this._addByType(obj, true);
        return this;
    }
    equals(script) {
        preconditions_1.default.checkState(script instanceof Script, 'Must provide another script');
        if (this.chunks.length !== script.chunks.length) {
            return false;
        }
        let i;
        for (i = 0; i < this.chunks.length; i++) {
            if (util_1.BufferUtil.isBuffer(this.chunks[i].buf) &&
                !util_1.BufferUtil.isBuffer(script.chunks[i].buf)) {
                return false;
            }
            if (util_1.BufferUtil.isBuffer(this.chunks[i].buf) &&
                !util_1.BufferUtil.equals(this.chunks[i].buf, script.chunks[i].buf)) {
                return false;
            }
            else if (this.chunks[i].opcodenum !== script.chunks[i].opcodenum) {
                return false;
            }
        }
        return true;
    }
    add(obj) {
        this._addByType(obj, false);
        return this;
    }
    _addByType(obj, prepend) {
        if (typeof obj === 'string') {
            this._addOpcode(obj, prepend);
        }
        else if (typeof obj === 'number') {
            this._addOpcode(obj, prepend);
        }
        else if (obj instanceof opcode_1.Opcode) {
            this._addOpcode(obj, prepend);
        }
        else if (util_1.BufferUtil.isBuffer(obj)) {
            this._addBuffer(obj, prepend);
        }
        else if (obj instanceof Script) {
            this.chunks = this.chunks.concat(obj.chunks);
        }
        else if (typeof obj === 'object') {
            this._insertAtPosition(obj, prepend);
        }
        else {
            throw new Error('Invalid script chunk');
        }
    }
    _insertAtPosition(op, prepend) {
        if (prepend) {
            this.chunks.unshift(op);
        }
        else {
            this.chunks.push(op);
        }
    }
    _addOpcode(opcode, prepend) {
        let op;
        if (typeof opcode === 'number') {
            op = opcode;
        }
        else if (opcode instanceof opcode_1.Opcode) {
            op = opcode.toNumber();
        }
        else {
            op = new opcode_1.Opcode(opcode).toNumber();
        }
        this._insertAtPosition({
            opcodenum: op
        }, prepend);
        return this;
    }
    _addBuffer(buf, prepend) {
        let opcodenum;
        const len = buf.length;
        if (len >= 0 && len < opcode_1.OP_CODES.OP_PUSHDATA1) {
            opcodenum = len;
        }
        else if (len < Math.pow(2, 8)) {
            opcodenum = opcode_1.OP_CODES.OP_PUSHDATA1;
        }
        else if (len < Math.pow(2, 16)) {
            opcodenum = opcode_1.OP_CODES.OP_PUSHDATA2;
        }
        else if (len < Math.pow(2, 32)) {
            opcodenum = opcode_1.OP_CODES.OP_PUSHDATA4;
        }
        else {
            throw new Error("You can't push that much data");
        }
        this._insertAtPosition({
            buf,
            len,
            opcodenum
        }, prepend);
        return this;
    }
    hasCodeseparators() {
        for (const chunk of this.chunks) {
            if (chunk.opcodenum === opcode_1.OP_CODES.OP_CODESEPARATOR) {
                return true;
            }
        }
        return false;
    }
    removeCodeseparators() {
        const chunks = [];
        for (const chunk of this.chunks) {
            if (chunk.opcodenum !== opcode_1.OP_CODES.OP_CODESEPARATOR) {
                chunks.push(chunk);
            }
        }
        this.chunks = chunks;
        return this;
    }
    static buildMultisigOut(publicKeys, threshold, opts) {
        preconditions_1.default.checkArgument(threshold <= publicKeys.length, 'Number of required signatures must be less than or equal to the number of public keys');
        opts = opts || {};
        const script = new Script();
        script.add(opcode_1.Opcode.smallInt(threshold));
        publicKeys = _.map(publicKeys, key => new publickey_1.PublicKey(key));
        let sorted = publicKeys;
        if (!opts.noSorting) {
            sorted = _.sortBy(publicKeys, publicKey => {
                return publicKey.toString();
            });
        }
        for (const sort of sorted) {
            const publicKey = sort;
            script.add(publicKey.toBuffer());
        }
        script.add(opcode_1.Opcode.smallInt(publicKeys.length));
        script.add(opcode_1.OP_CODES.OP_CHECKMULTISIG);
        return script;
    }
    static buildWitnessMultisigOutFromScript(script) {
        if (script instanceof Script) {
            const s = new Script();
            s.add(opcode_1.OP_CODES.OP_0);
            s.add(crypto_1.Hash.sha256(script.toBuffer()));
            return s;
        }
        else {
            throw new TypeError('First argument is expected to be a p2sh script');
        }
    }
    static buildMultisigIn(pubkeys, threshold, signatures, opts) {
        preconditions_1.default.checkArgument(_.isArray(pubkeys));
        preconditions_1.default.checkArgument(_.isNumber(threshold));
        preconditions_1.default.checkArgument(_.isArray(signatures));
        opts = opts || {};
        const s = new Script();
        s.add(opcode_1.OP_CODES.OP_0);
        _.each(signatures, signature => {
            preconditions_1.default.checkArgument(util_1.BufferUtil.isBuffer(signature), 'Signatures must be an array of Buffers');
            s.add(signature);
        });
        return s;
    }
    static buildP2SHMultisigIn(pubkeys, threshold, signatures, opts) {
        preconditions_1.default.checkArgument(_.isArray(pubkeys));
        preconditions_1.default.checkArgument(_.isNumber(threshold));
        preconditions_1.default.checkArgument(_.isArray(signatures));
        opts = opts || {};
        const s = new Script();
        s.add(opcode_1.OP_CODES.OP_0);
        _.each(signatures, signature => {
            preconditions_1.default.checkArgument(util_1.BufferUtil.isBuffer(signature), 'Signatures must be an array of Buffers');
            s.add(signature);
        });
        s.add((opts.cachedMultisig || Script.buildMultisigOut(pubkeys, threshold, opts)).toBuffer());
        return s;
    }
    static buildPublicKeyHashOut(to) {
        preconditions_1.default.checkArgument(!_.isUndefined(to));
        preconditions_1.default.checkArgument(to instanceof publickey_1.PublicKey || to instanceof address_1.Address || _.isString(to));
        if (to instanceof publickey_1.PublicKey) {
            to = to.toAddress();
        }
        else if (_.isString(to)) {
            to = new address_1.Address(to);
        }
        const s = new Script();
        s.add(opcode_1.OP_CODES.OP_DUP)
            .add(opcode_1.OP_CODES.OP_HASH160)
            .add(to.hashBuffer)
            .add(opcode_1.OP_CODES.OP_EQUALVERIFY)
            .add(opcode_1.OP_CODES.OP_CHECKSIG);
        s._network = to.network;
        return s;
    }
    static buildPublicKeyOut(pubkey) {
        preconditions_1.default.checkArgument(pubkey instanceof publickey_1.PublicKey);
        const s = new Script();
        s.add(pubkey.toBuffer()).add(opcode_1.OP_CODES.OP_CHECKSIG);
        return s;
    }
    static buildDataOut(data, encoding) {
        preconditions_1.default.checkArgument(_.isUndefined(data) || _.isString(data) || util_1.BufferUtil.isBuffer(data));
        if (typeof data === 'string') {
            data = buffer_1.Buffer.from(data, encoding);
        }
        const s = new Script();
        s.add(opcode_1.OP_CODES.OP_RETURN);
        if (!_.isUndefined(data)) {
            s.add(data);
        }
        return s;
    }
    static buildScriptHashOut(script) {
        preconditions_1.default.checkArgument(script instanceof Script ||
            (script instanceof address_1.Address && script.isPayToScriptHash()));
        const s = new Script();
        s.add(opcode_1.OP_CODES.OP_HASH160)
            .add(script instanceof address_1.Address
            ? script.hashBuffer
            : crypto_1.Hash.sha256ripemd160(script.toBuffer()))
            .add(opcode_1.OP_CODES.OP_EQUAL);
        s._network = script._network || script.network;
        return s;
    }
    static buildPublicKeyIn(signature, sigtype) {
        preconditions_1.default.checkArgument(signature instanceof signature_1.Signature || util_1.BufferUtil.isBuffer(signature));
        preconditions_1.default.checkArgument(_.isUndefined(sigtype) || _.isNumber(sigtype));
        if (signature instanceof signature_1.Signature) {
            signature = signature.toBuffer();
        }
        const script = new Script();
        script.add(util_1.BufferUtil.concat([
            signature,
            util_1.BufferUtil.integerAsSingleByteBuffer(sigtype || signature_1.Signature.SIGHASH_ALL)
        ]));
        return script;
    }
    static buildPublicKeyHashIn(publicKey, signature, sigtype = signature_1.Signature.SIGHASH_ALL) {
        preconditions_1.default.checkArgument(signature instanceof signature_1.Signature || util_1.BufferUtil.isBuffer(signature));
        preconditions_1.default.checkArgument(_.isUndefined(sigtype) || _.isNumber(sigtype));
        if (signature instanceof signature_1.Signature) {
            signature = signature.toBuffer();
        }
        const script = new Script()
            .add(util_1.BufferUtil.concat([
            signature,
            util_1.BufferUtil.integerAsSingleByteBuffer(sigtype || signature_1.Signature.SIGHASH_ALL)
        ]))
            .add(new publickey_1.PublicKey(publicKey).toBuffer());
        return script;
    }
    static empty() {
        return new Script();
    }
    toScriptHashOut() {
        return Script.buildScriptHashOut(this);
    }
    static fromAddress(address) {
        address = new address_1.Address(address);
        if (address.isPayToScriptHash()) {
            return Script.buildScriptHashOut(address);
        }
        else if (address.isPayToPublicKeyHash()) {
            return Script.buildPublicKeyHashOut(address);
        }
        throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Script.errors.UnrecognizedAddress, address);
    }
    getAddressInfo() {
        if (this._isInput) {
            return this._getInputAddressInfo();
        }
        else if (this._isOutput) {
            return this._getOutputAddressInfo();
        }
        else {
            const info = this._getOutputAddressInfo();
            if (!info) {
                return this._getInputAddressInfo();
            }
            return info;
        }
    }
    _getOutputAddressInfo() {
        if (this.isScriptHashOut()) {
            return {
                hashBuffer: this.getData(),
                type: address_1.Address.PayToScriptHash,
                network: networks_1.Network.defaultNetwork
            };
        }
        else if (this.isPublicKeyHashOut()) {
            return {
                hashBuffer: this.getData(),
                type: address_1.Address.PayToPublicKeyHash,
                network: networks_1.Network.defaultNetwork
            };
        }
        else {
            return false;
        }
    }
    _getInputAddressInfo() {
        const info = {};
        info.network = networks_1.Network.defaultNetwork;
        if (this.isPublicKeyHashIn()) {
            info.hashBuffer = crypto_1.Hash.sha256ripemd160(this.chunks[1].buf);
            info.type = address_1.Address.PayToPublicKeyHash;
        }
        else if (this.isScriptHashIn()) {
            info.hashBuffer = crypto_1.Hash.sha256ripemd160(this.chunks[this.chunks.length - 1].buf);
            info.type = address_1.Address.PayToScriptHash;
        }
        else {
            return false;
        }
        return info;
    }
    toAddress(network) {
        const info = this.getAddressInfo();
        if (!info) {
            throw new errors_1.BitcoreError(errors_1.ERROR_TYPES.Script.errors.UnrecognizedAddress);
        }
        info.network =
            networks_1.Network.get(network) || this._network || networks_1.Network.defaultNetwork;
        return new address_1.Address(info);
    }
    findAndDelete(script) {
        const buf = script.toBuffer();
        const hex = buf.toString('hex');
        for (let i = 0; i < this.chunks.length; i++) {
            const script2 = new Script({
                chunks: [this.chunks[i]]
            });
            const buf2 = script2.toBuffer();
            const hex2 = buf2.toString('hex');
            if (hex === hex2) {
                this.chunks.splice(i, 1);
            }
        }
        return this;
    }
    checkMinimalPush(i) {
        const chunk = this.chunks[i];
        const buf = chunk.buf;
        const opcodenum = chunk.opcodenum;
        if (!buf) {
            return true;
        }
        if (buf.length === 0) {
            return opcodenum === opcode_1.OP_CODES.OP_0;
        }
        else if (buf.length === 1 && buf[0] >= 1 && buf[0] <= 16) {
            return opcodenum === opcode_1.OP_CODES.OP_1 + (buf[0] - 1);
        }
        else if (buf.length === 1 && buf[0] === 0x81) {
            return opcodenum === opcode_1.OP_CODES.OP_1NEGATE;
        }
        else if (buf.length <= 75) {
            return opcodenum === buf.length;
        }
        else if (buf.length <= 255) {
            return opcodenum === opcode_1.OP_CODES.OP_PUSHDATA1;
        }
        else if (buf.length <= 65535) {
            return opcodenum === opcode_1.OP_CODES.OP_PUSHDATA2;
        }
        return true;
    }
    _decodeOP_N(opcode) {
        if (opcode === opcode_1.OP_CODES.OP_0) {
            return 0;
        }
        else if (opcode >= opcode_1.OP_CODES.OP_1 && opcode <= opcode_1.OP_CODES.OP_16) {
            return opcode - (opcode_1.OP_CODES.OP_1 - 1);
        }
        else {
            throw new Error('Invalid opcode: ' + JSON.stringify(opcode));
        }
    }
    getSignatureOperationsCount(accurate = true) {
        accurate = _.isUndefined(accurate) ? true : accurate;
        let n = 0;
        let lastOpcode = opcode_1.OP_CODES.OP_INVALIDOPCODE;
        _.each(this.chunks, chunk => {
            const opcode = chunk.opcodenum;
            if (opcode === opcode_1.OP_CODES.OP_CHECKSIG ||
                opcode === opcode_1.OP_CODES.OP_CHECKSIGVERIFY) {
                n++;
            }
            else if (opcode === opcode_1.OP_CODES.OP_CHECKMULTISIG ||
                opcode === opcode_1.OP_CODES.OP_CHECKMULTISIGVERIFY) {
                if (accurate &&
                    lastOpcode >= opcode_1.OP_CODES.OP_1 &&
                    lastOpcode <= opcode_1.OP_CODES.OP_16) {
                    n += this._decodeOP_N(lastOpcode);
                }
                else {
                    n += 20;
                }
            }
            lastOpcode = opcode;
        });
        return n;
    }
}
exports.Script = Script;
Script.Interpreter = interpreter_1.Interpreter;
Script.types = {
    UNKNOWN: 'Unknown',
    PUBKEY_OUT: 'Pay to public key',
    PUBKEY_IN: 'Spend from public key',
    PUBKEYHASH_OUT: 'Pay to public key hash',
    PUBKEYHASH_IN: 'Spend from public key hash',
    SCRIPTHASH_OUT: 'Pay to script hash',
    SCRIPTHASH_IN: 'Spend from script hash',
    MULTISIG_OUT: 'Pay to multisig',
    MULTISIG_IN: 'Spend from multisig',
    DATA_OUT: 'Data push'
};
Script.OP_RETURN_STANDARD_SIZE = 80;
//# sourceMappingURL=script.js.map