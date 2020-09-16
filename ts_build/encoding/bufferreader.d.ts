/// <reference types="node" />
import { BitcoreBN } from '../crypto';
export declare class BufferReader {
    buf: Buffer;
    pos: number;
    constructor(buf?: BufferReader | Buffer | string | object);
    set(obj: {
        buf?: Buffer;
        pos?: number;
    }): this;
    eof(): boolean;
    finished: () => boolean;
    read(len: any): Buffer;
    readAll(): Buffer;
    readUInt8(): number;
    readUInt16BE(): number;
    readUInt16LE(): number;
    readUInt32BE(): number;
    readUInt32LE(): number;
    readInt32LE(): number;
    readUInt64BEBN(): BitcoreBN;
    readUInt64LEBN(): any;
    readVarintNum(): any;
    readVarLengthBuffer(): Buffer;
    readVarintBuf(): Buffer;
    readVarintBN(): any;
    reverse(): this;
    readReverse(len?: number): Buffer;
}
