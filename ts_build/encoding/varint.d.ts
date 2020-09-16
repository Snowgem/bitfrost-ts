/// <reference types="node" />
import { BitcoreBN } from '../crypto/bn';
export declare class Varint {
    buf: Buffer;
    constructor(buf?: Buffer | BitcoreBN | number);
    set(obj: any): this;
    fromString(str: any): this;
    toString(): string;
    fromBuffer(buf: any): this;
    fromBufferReader(br: any): this;
    fromBN(bn: any): this;
    fromNumber(num: any): this;
    toBuffer(): Buffer;
    toBN(): any;
    toNumber(): any;
}
