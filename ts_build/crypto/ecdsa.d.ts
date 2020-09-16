/// <reference types="node" />
import { PublicKey } from '../publickey';
import { PrivateKey } from '../privatekey';
import { Signature } from './signature';
import { BitcoreBN } from './bn';
export declare namespace ECDSA {
    interface ECDSAObj {
        hashbuf: string | Buffer;
        endian: string;
        privkey: string | PrivateKey;
        pubkey: string;
        sig: string | Signature;
        k: string;
        verified: boolean;
    }
}
export declare class ECDSA {
    hashbuf: Buffer;
    endian: 'big' | 'little';
    privkey: PrivateKey;
    pubkey: PublicKey;
    sig: Signature;
    k: BitcoreBN;
    verified: boolean;
    constructor(obj?: Partial<ECDSA.ECDSAObj> | ECDSA);
    set: (obj: any) => any;
    privkey2pubkey: () => void;
    calci: () => any;
    static fromString: (str: any) => ECDSA;
    randomK: () => any;
    deterministicK: (badrs: any) => any;
    toPublicKey: () => PublicKey;
    sigError: () => false | "hashbuf must be a 32 byte buffer" | "r and s not in range" | "p is infinity" | "Invalid signature";
    static toLowS: (s: any) => any;
    _findSignature: (d: any, e: any) => {
        s: any;
        r: any;
    };
    sign: () => any;
    signRandomK: () => any;
    toString: () => string;
    verify: () => any;
    static sign: (hashbuf: any, privkey: any, endian: any) => any;
    static verify: (hashbuf: any, sig: any, pubkey: any, endian: any) => any;
}
