'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Varint = void 0;
const bufferwriter_1 = require("./bufferwriter");
const bufferreader_1 = require("./bufferreader");
const bn_1 = require("../crypto/bn");
class Varint {
    constructor(buf) {
        if (!(this instanceof Varint)) {
            return new Varint(buf);
        }
        if (Buffer.isBuffer(buf)) {
            this.buf = buf;
        }
        else if (typeof buf === 'number') {
            const num = buf;
            this.fromNumber(num);
        }
        else if (buf instanceof bn_1.BitcoreBN) {
            const bn = buf;
            this.fromBN(bn);
        }
        else if (buf) {
            const obj = buf;
            this.set(obj);
        }
    }
    set(obj) {
        this.buf = obj.buf || this.buf;
        return this;
    }
    fromString(str) {
        this.set({
            buf: Buffer.from(str, 'hex')
        });
        return this;
    }
    toString() {
        return this.buf.toString('hex');
    }
    fromBuffer(buf) {
        this.buf = buf;
        return this;
    }
    fromBufferReader(br) {
        this.buf = br.readVarintBuf();
        return this;
    }
    fromBN(bn) {
        this.buf = new bufferwriter_1.BufferWriter().writeVarintBN(bn).concat();
        return this;
    }
    fromNumber(num) {
        this.buf = new bufferwriter_1.BufferWriter().writeVarintNum(num).concat();
        return this;
    }
    toBuffer() {
        return this.buf;
    }
    toBN() {
        return new bufferreader_1.BufferReader(this.buf).readVarintBN();
    }
    toNumber() {
        return new bufferreader_1.BufferReader(this.buf).readVarintNum();
    }
}
exports.Varint = Varint;
//# sourceMappingURL=varint.js.map