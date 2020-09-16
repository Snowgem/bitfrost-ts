/// <reference types="node" />
import { Network } from './networks';
import { PublicKey } from './publickey';
import { BitcoreError } from './errors';
export declare namespace HDPublicKey {
    type DataType = HDPublicKey.HDPublicKeyObj<string | Buffer | number> | Buffer | string | HDPublicKey;
    interface HDPublicKeyObj<T> {
        network: Network | string;
        depth: number;
        fingerPrint?: T;
        parentFingerPrint: T;
        childIndex: T;
        chainCode: T;
        publicKey: string | PublicKey | Buffer;
        version?: T;
        checksum?: T;
        xpubkey?: T;
    }
}
export declare class HDPublicKey {
    _buffers: HDPublicKey.HDPublicKeyObj<Buffer>;
    network: Network;
    depth: number;
    fingerPrint: Buffer;
    parentFingerPrint: number;
    childIndex: number;
    chainCode: number;
    publicKey: PublicKey;
    checksum: number;
    xpubkey: Buffer;
    constructor(arg: HDPublicKey.DataType);
    isValidPath: (arg: any) => boolean;
    derive: (arg: any, hardened: any) => any;
    deriveChild: (arg: any, hardened: any) => any;
    _deriveWithNumber: (index: any, hardened: any) => any;
    _deriveFromString: (path: any) => any;
    static isValidSerialized: (data: any, network: any) => boolean;
    static getSerializedError: (data: any, network?: any) => any;
    static _validateNetwork: (data: any, networkArg: any) => BitcoreError;
    _buildFromPrivate: (arg: any) => any;
    _buildFromObject: (arg: any) => any;
    _buildFromSerialized: (arg: any) => any;
    _buildFromBuffers: (arg: any) => any;
    static _validateBufferArguments: (arg: any) => void;
    static fromString: (arg: any) => HDPublicKey;
    static fromObject: (arg: any) => HDPublicKey;
    toString: () => any;
    inspect: () => string;
    toObject: () => {
        network: any;
        depth: number;
        fingerPrint: number;
        parentFingerPrint: number;
        childIndex: number;
        chainCode: string;
        publicKey: any;
        checksum: number;
        xpubkey: any;
    };
    toJSON: () => {
        network: any;
        depth: number;
        fingerPrint: number;
        parentFingerPrint: number;
        childIndex: number;
        chainCode: string;
        publicKey: any;
        checksum: number;
        xpubkey: any;
    };
    static fromBuffer: (arg: any) => HDPublicKey;
    toBuffer: () => Buffer;
    static Hardened: number;
    static RootElementAlias: string[];
    static VersionSize: number;
    static DepthSize: number;
    static ParentFingerPrintSize: number;
    static ChildIndexSize: number;
    static ChainCodeSize: number;
    static PublicKeySize: number;
    static CheckSumSize: number;
    static DataSize: number;
    static SerializedByteSize: number;
    static VersionStart: number;
    static VersionEnd: number;
    static DepthStart: number;
    static DepthEnd: number;
    static ParentFingerPrintStart: number;
    static ParentFingerPrintEnd: number;
    static ChildIndexStart: number;
    static ChildIndexEnd: number;
    static ChainCodeStart: number;
    static ChainCodeEnd: number;
    static PublicKeyStart: number;
    static PublicKeyEnd: number;
    static ChecksumStart: number;
    static ChecksumEnd: number;
}
