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
exports.Opcode = exports.OP_CODES = void 0;
const _ = __importStar(require("lodash"));
const preconditions_1 = __importDefault(require("./util/preconditions"));
const buffer_1 = require("./util/buffer");
exports.OP_CODES = {
    OP_FALSE: 0,
    OP_0: 0,
    OP_PUSHDATA1: 76,
    OP_PUSHDATA2: 77,
    OP_PUSHDATA4: 78,
    OP_1NEGATE: 79,
    OP_RESERVED: 80,
    OP_TRUE: 81,
    OP_1: 81,
    OP_2: 82,
    OP_3: 83,
    OP_4: 84,
    OP_5: 85,
    OP_6: 86,
    OP_7: 87,
    OP_8: 88,
    OP_9: 89,
    OP_10: 90,
    OP_11: 91,
    OP_12: 92,
    OP_13: 93,
    OP_14: 94,
    OP_15: 95,
    OP_16: 96,
    OP_NOP: 97,
    OP_VER: 98,
    OP_IF: 99,
    OP_NOTIF: 100,
    OP_VERIF: 101,
    OP_VERNOTIF: 102,
    OP_ELSE: 103,
    OP_ENDIF: 104,
    OP_VERIFY: 105,
    OP_RETURN: 106,
    OP_TOALTSTACK: 107,
    OP_FROMALTSTACK: 108,
    OP_2DROP: 109,
    OP_2DUP: 110,
    OP_3DUP: 111,
    OP_2OVER: 112,
    OP_2ROT: 113,
    OP_2SWAP: 114,
    OP_IFDUP: 115,
    OP_DEPTH: 116,
    OP_DROP: 117,
    OP_DUP: 118,
    OP_NIP: 119,
    OP_OVER: 120,
    OP_PICK: 121,
    OP_ROLL: 122,
    OP_ROT: 123,
    OP_SWAP: 124,
    OP_TUCK: 125,
    OP_CAT: 126,
    OP_SUBSTR: 127,
    OP_LEFT: 128,
    OP_RIGHT: 129,
    OP_SIZE: 130,
    OP_INVERT: 131,
    OP_AND: 132,
    OP_OR: 133,
    OP_XOR: 134,
    OP_EQUAL: 135,
    OP_EQUALVERIFY: 136,
    OP_RESERVED1: 137,
    OP_RESERVED2: 138,
    OP_1ADD: 139,
    OP_1SUB: 140,
    OP_2MUL: 141,
    OP_2DIV: 142,
    OP_NEGATE: 143,
    OP_ABS: 144,
    OP_NOT: 145,
    OP_0NOTEQUAL: 146,
    OP_ADD: 147,
    OP_SUB: 148,
    OP_MUL: 149,
    OP_DIV: 150,
    OP_MOD: 151,
    OP_LSHIFT: 152,
    OP_RSHIFT: 153,
    OP_BOOLAND: 154,
    OP_BOOLOR: 155,
    OP_NUMEQUAL: 156,
    OP_NUMEQUALVERIFY: 157,
    OP_NUMNOTEQUAL: 158,
    OP_LESSTHAN: 159,
    OP_GREATERTHAN: 160,
    OP_LESSTHANOREQUAL: 161,
    OP_GREATERTHANOREQUAL: 162,
    OP_MIN: 163,
    OP_MAX: 164,
    OP_WITHIN: 165,
    OP_RIPEMD160: 166,
    OP_SHA1: 167,
    OP_SHA256: 168,
    OP_HASH160: 169,
    OP_HASH256: 170,
    OP_CODESEPARATOR: 171,
    OP_CHECKSIG: 172,
    OP_CHECKSIGVERIFY: 173,
    OP_CHECKMULTISIG: 174,
    OP_CHECKMULTISIGVERIFY: 175,
    OP_CHECKLOCKTIMEVERIFY: 177,
    OP_NOP1: 176,
    OP_NOP2: 177,
    OP_NOP3: 178,
    OP_NOP4: 179,
    OP_NOP5: 180,
    OP_NOP6: 181,
    OP_NOP7: 182,
    OP_NOP8: 183,
    OP_NOP9: 184,
    OP_NOP10: 185,
    OP_PUBKEYHASH: 253,
    OP_PUBKEY: 254,
    OP_INVALIDOPCODE: 255
};
class Opcode {
    constructor(num) {
        if (!(this instanceof Opcode)) {
            return new Opcode(num);
        }
        let value;
        if (_.isNumber(num)) {
            value = num;
        }
        else if (_.isString(num)) {
            value = Opcode.map[num];
        }
        else {
            throw new TypeError('Unrecognized num type: "' + typeof num + '" for Opcode');
        }
        this.num = value;
        return this;
    }
    static fromBuffer(buf) {
        preconditions_1.default.checkArgument(buffer_1.BufferUtil.isBuffer(buf));
        return new Opcode(Number('0x' + buf.toString('hex')));
    }
    static fromNumber(num) {
        preconditions_1.default.checkArgument(_.isNumber(num));
        return new Opcode(num);
    }
    static fromString(str) {
        preconditions_1.default.checkArgument(_.isString(str));
        const value = Opcode.map[str];
        if (typeof value === 'undefined') {
            throw new TypeError('Invalid opcodestr');
        }
        return new Opcode(value);
    }
    toHex() {
        return this.num.toString(16);
    }
    toBuffer() {
        return Buffer.from(this.toHex(), 'hex');
    }
    toNumber() {
        return this.num;
    }
    toString() {
        const str = Opcode.reverseMap[this.num];
        if (typeof str === 'undefined') {
            throw new Error('Opcode does not have a string representation');
        }
        return str;
    }
    static smallInt(n) {
        preconditions_1.default.checkArgument(_.isNumber(n), 'Invalid Argument: n should be number');
        preconditions_1.default.checkArgument(n >= 0 && n <= 16, 'Invalid Argument: n must be between 0 and 16');
        if (n === 0) {
            return new Opcode('OP_0');
        }
        return new Opcode(Opcode.map.OP_1 + n - 1);
    }
    static isSmallIntOp(opcode) {
        if (opcode instanceof Opcode) {
            opcode = opcode.toNumber();
        }
        return (opcode === Opcode.map.OP_0 ||
            (opcode >= Opcode.map.OP_1 && opcode <= Opcode.map.OP_16));
    }
    inspect() {
        return ('<Opcode: ' +
            this.toString() +
            ', hex: ' +
            this.toHex() +
            ', decimal: ' +
            this.num +
            '>');
    }
}
exports.Opcode = Opcode;
Opcode.map = exports.OP_CODES;
Opcode.reverseMap = [];
for (const k of Object.keys(Opcode.map)) {
    Opcode.reverseMap[Opcode.map[k]] = k;
}
//# sourceMappingURL=opcode.js.map