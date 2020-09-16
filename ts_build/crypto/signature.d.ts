/// <reference types="node" />
import BN from 'bn.js';
import { BitcoreBN } from '.';
export declare type BigOrSmallNumber = BitcoreBN | BN | number;
export declare namespace Signature {
    interface SignatureObj {
        r?: BigOrSmallNumber;
        s?: BigOrSmallNumber;
        i?: number;
        compressed?: boolean;
        nhashtype?: number;
    }
    interface PostSignature {
        publicKey: string;
        prevTxId: string;
        outputIndex: number;
        inputIndex: number;
        signature: string;
        sigtype: number;
    }
}
export declare class Signature {
    r: BitcoreBN;
    s: BitcoreBN;
    i: number;
    compressed: boolean;
    nhashtype: number;
    constructor(r?: BigOrSmallNumber | Signature.SignatureObj, s?: BigOrSmallNumber);
    set(obj: Signature.SignatureObj): this;
    static fromCompact(buf: any): Signature;
    static fromDER: typeof Signature.fromBuffer;
    static fromBuffer(buf: any, strict?: boolean): Signature;
    static fromTxFormat(buf: Buffer): Signature;
    static fromString(str: any): Signature;
    static parseDER(buf: Buffer, strict?: boolean): {
        header: number;
        length: number;
        rheader: number;
        rlength: number;
        rneg: boolean;
        rbuf: Buffer;
        r: BitcoreBN;
        sheader: number;
        slength: number;
        sneg: boolean;
        sbuf: Buffer;
        s: BitcoreBN;
    };
    toCompact(i: any, compressed: any): Buffer;
    toDER: () => Buffer;
    toBuffer(): Buffer;
    toString(): string;
    static isTxDER(buf: any): boolean;
    hasLowS(): boolean;
    hasDefinedHashtype(): boolean;
    toTxFormat(): Buffer;
    static SIGHASH_ALL: number;
    static SIGHASH_NONE: number;
    static SIGHASH_SINGLE: number;
    static SIGHASH_ANYONECANPAY: number;
}
