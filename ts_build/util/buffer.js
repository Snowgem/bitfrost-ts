"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferUtil = void 0;
const buffer_1 = require("buffer");
const js_1 = require("./js");
const preconditions_1 = __importDefault(require("./preconditions"));
const assert_1 = __importDefault(require("assert"));
const NULL_HASH_LENGTH = 32;
const MAX_256 = 0xff;
const ONE_BYTE = 8;
const TWO_BYTES = 16;
const THREE_BYTES = 24;
class BufferUtil {
    static fill(buffer, value = 0) {
        preconditions_1.default.checkArgumentType(buffer, 'Buffer', 'buffer');
        preconditions_1.default.checkArgumentType(value, 'number', 'value');
        const length = buffer.length;
        for (let i = 0; i < length; i++) {
            buffer[i] = value;
        }
        return buffer;
    }
    static copy(original) {
        const buffer = buffer_1.Buffer.alloc(original.length);
        original.copy(buffer);
        return buffer;
    }
    static isBuffer(arg) {
        return buffer_1.Buffer.isBuffer(arg) || arg instanceof Uint8Array;
    }
    static emptyBuffer(bytes) {
        preconditions_1.default.checkArgumentType(bytes, 'number', 'bytes');
        const result = new buffer_1.Buffer(bytes);
        for (let i = 0; i < bytes; i++) {
            result.write('\0', i);
        }
        return result;
    }
    static equal(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        const length = a.length;
        for (let i = 0; i < length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    static integerAsSingleByteBuffer(integer) {
        preconditions_1.default.checkArgumentType(integer, 'number', 'integer');
        return new buffer_1.Buffer([integer & MAX_256]);
    }
    static integerAsBuffer(integer) {
        preconditions_1.default.checkArgumentType(integer, 'number', 'integer');
        const bytes = [];
        bytes.push((integer >> THREE_BYTES) & MAX_256);
        bytes.push((integer >> TWO_BYTES) & MAX_256);
        bytes.push((integer >> ONE_BYTE) & MAX_256);
        bytes.push(integer & MAX_256);
        return buffer_1.Buffer.from(bytes);
    }
    static integerFromBuffer(buffer) {
        preconditions_1.default.checkArgumentType(buffer, 'Buffer', 'buffer');
        return ((buffer[0] << THREE_BYTES) |
            (buffer[1] << TWO_BYTES) |
            (buffer[2] << ONE_BYTE) |
            buffer[3]);
    }
    static integerFromSingleByteBuffer(buffer) {
        preconditions_1.default.checkArgumentType(buffer, 'Buffer', 'buffer');
        return buffer[0];
    }
    static bufferToHex(buffer) {
        preconditions_1.default.checkArgumentType(buffer, 'Buffer', 'buffer');
        return buffer.toString('hex');
    }
    static reverse(param) {
        const ret = new buffer_1.Buffer(param.length);
        for (let i = 0; i < param.length; i++) {
            ret[i] = param[param.length - i - 1];
        }
        return ret;
    }
    static hexToBuffer(str) {
        assert_1.default(js_1.JSUtil.isHexa(str));
        return new buffer_1.Buffer(str, 'hex');
    }
    static toBufferIfString(value) {
        return typeof value === 'string'
            ? buffer_1.Buffer.from(value, 'hex')
            : value;
    }
}
exports.BufferUtil = BufferUtil;
BufferUtil.equals = BufferUtil.equal;
BufferUtil.NULL_HASH = BufferUtil.fill(buffer_1.Buffer.alloc(NULL_HASH_LENGTH), 0);
BufferUtil.EMPTY_BUFFER = buffer_1.Buffer.alloc(0);
BufferUtil.concat = buffer_1.Buffer.concat;
//# sourceMappingURL=buffer.js.map