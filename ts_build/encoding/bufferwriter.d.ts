/// <reference types="node" />
import { BitcoreBN } from '../crypto/bn';
export declare class BufferWriter {
    bufs: Array<Uint8Array>;
    bufLen: number;
    constructor(obj?: {
        bufs: Array<Uint8Array>;
    });
    set(obj: {
        bufs: Array<Uint8Array>;
    }): this;
    toBuffer(): Buffer;
    concat(): Buffer;
    write(buf: Buffer): this;
    writeReverse(buf: Buffer): this;
    writeUInt8(n: number): this;
    writeUInt16BE(n: number): this;
    writeUInt16LE(n: number): this;
    writeUInt32BE(n: number): this;
    writeInt32LE(n: number): this;
    writeUInt32LE(n: number): this;
    writeUInt64BEBN(bn: BitcoreBN): this;
    writeUInt64LEBN(bn: any): this;
    writeVarintNum(n: number): this;
    writeVarintBN(bn: BitcoreBN): this;
    static varintBufNum(n: number): any;
    static varintBufBN(bn: BitcoreBN): any;
}
