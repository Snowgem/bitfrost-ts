'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferWriter = void 0;
const buffer_1 = require("../util/buffer");
const assert_1 = __importDefault(require("assert"));
class BufferWriter {
    constructor(obj) {
        if (!(this instanceof BufferWriter)) {
            return new BufferWriter(obj);
        }
        this.bufLen = 0;
        if (obj) {
            this.set(obj);
        }
        else {
            this.bufs = [];
        }
    }
    set(obj) {
        this.bufs = obj.bufs || this.bufs || [];
        this.bufLen = this.bufs.reduce((prev, buf) => {
            return prev + buf.length;
        }, 0);
        return this;
    }
    toBuffer() {
        return this.concat();
    }
    concat() {
        return Buffer.concat(this.bufs, this.bufLen);
    }
    write(buf) {
        assert_1.default(buffer_1.BufferUtil.isBuffer(buf));
        this.bufs.push(buf);
        this.bufLen += buf.length;
        return this;
    }
    writeReverse(buf) {
        assert_1.default(buffer_1.BufferUtil.isBuffer(buf));
        this.bufs.push(buffer_1.BufferUtil.reverse(buf));
        this.bufLen += buf.length;
        return this;
    }
    writeUInt8(n) {
        const buf = Buffer.alloc(1);
        buf.writeUInt8(n, 0);
        this.write(buf);
        return this;
    }
    writeUInt16BE(n) {
        const buf = Buffer.alloc(2);
        buf.writeUInt16BE(n, 0);
        this.write(buf);
        return this;
    }
    writeUInt16LE(n) {
        const buf = Buffer.alloc(2);
        buf.writeUInt16LE(n, 0);
        this.write(buf);
        return this;
    }
    writeUInt32BE(n) {
        const buf = Buffer.alloc(4);
        buf.writeUInt32BE(n, 0);
        this.write(buf);
        return this;
    }
    writeInt32LE(n) {
        const buf = Buffer.alloc(4);
        buf.writeInt32LE(n, 0);
        this.write(buf);
        return this;
    }
    writeUInt32LE(n) {
        const buf = Buffer.alloc(4);
        buf.writeUInt32LE(n, 0);
        this.write(buf);
        return this;
    }
    writeUInt64BEBN(bn) {
        const buf = bn.toBuffer({ size: 8 });
        this.write(buf);
        return this;
    }
    writeUInt64LEBN(bn) {
        const buf = bn.toBuffer({ size: 8 });
        this.writeReverse(buf);
        return this;
    }
    writeVarintNum(n) {
        const buf = BufferWriter.varintBufNum(n);
        this.write(buf);
        return this;
    }
    writeVarintBN(bn) {
        const buf = BufferWriter.varintBufBN(bn);
        this.write(buf);
        return this;
    }
    static varintBufNum(n) {
        let buf;
        if (n < 253) {
            buf = Buffer.alloc(1);
            buf.writeUInt8(n, 0);
        }
        else if (n < 0x10000) {
            buf = Buffer.alloc(1 + 2);
            buf.writeUInt8(253, 0);
            buf.writeUInt16LE(n, 1);
        }
        else if (n < 0x100000000) {
            buf = Buffer.alloc(1 + 4);
            buf.writeUInt8(254, 0);
            buf.writeUInt32LE(n, 1);
        }
        else {
            buf = Buffer.alloc(1 + 8);
            buf.writeUInt8(255, 0);
            buf.writeInt32LE(n & -1, 1);
            buf.writeUInt32LE(Math.floor(n / 0x100000000), 5);
        }
        return buf;
    }
    static varintBufBN(bn) {
        let buf;
        const n = bn.toNumber();
        if (n < 253) {
            buf = Buffer.alloc(1);
            buf.writeUInt8(n, 0);
        }
        else if (n < 0x10000) {
            buf = Buffer.alloc(1 + 2);
            buf.writeUInt8(253, 0);
            buf.writeUInt16LE(n, 1);
        }
        else if (n < 0x100000000) {
            buf = Buffer.alloc(1 + 4);
            buf.writeUInt8(254, 0);
            buf.writeUInt32LE(n, 1);
        }
        else {
            const bw = new BufferWriter();
            bw.writeUInt8(255);
            bw.writeUInt64LEBN(bn);
            buf = bw.concat();
        }
        return buf;
    }
}
exports.BufferWriter = BufferWriter;
//# sourceMappingURL=bufferwriter.js.map