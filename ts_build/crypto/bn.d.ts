/// <reference types="node" />
import BN from 'bn.js';
declare type Endianness = 'le' | 'be';
interface IBufferEncodingOptions {
    size?: number;
    endian?: 'little' | 'big';
}
export declare class BitcoreBN extends BN {
    static Zero: BitcoreBN;
    static One: BitcoreBN;
    static Minus1: BitcoreBN;
    static fromNumber(n: number): BitcoreBN;
    static fromString(str: string, base?: number): BitcoreBN;
    static fromBuffer(buf: Buffer, opts?: IBufferEncodingOptions): BitcoreBN;
    static fromSM(buf: Buffer, opts: IBufferEncodingOptions): any;
    toNumber(): number;
    toBuffer(opts?: IBufferEncodingOptions): Buffer;
    toBuffer(endian?: Endianness, length?: number): Buffer;
    toSMBigEndian: () => any;
    toSM(opts: IBufferEncodingOptions): any;
    static fromScriptNumBuffer(buf: any, fRequireMinimal?: boolean, size?: number): any;
    toScriptNumBuffer(): any;
    gt(b: BitcoreBN): boolean;
    gte(b: BitcoreBN): boolean;
    lt(b: BitcoreBN): boolean;
    static trim(buf: Buffer, natlen: number): Buffer;
    static pad(buf: Buffer, natlen: number, size: number): Buffer;
}
export {};
