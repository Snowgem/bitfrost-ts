/// <reference types="node" />
import { BufferWriter } from '../encoding/bufferwriter';
import BN from 'bn.js';
export declare namespace BlockHeader {
    interface GenericBlockHeaderObj<T> {
        version: number;
        hash: string;
        prevHash: T;
        merkleRoot: T;
        time: number;
        timestamp: number;
        bits: number;
        nonce: Buffer;
        reserved: any;
        solution: any;
    }
    interface SerializedBlockHeaderObj extends GenericBlockHeaderObj<string> {
    }
    interface DeserializedBlockHeaderObj extends GenericBlockHeaderObj<Buffer> {
    }
    interface BlockHeaderObj extends GenericBlockHeaderObj<string | Buffer> {
    }
}
export declare class BlockHeader {
    _id: string;
    version: number;
    prevHash: Buffer;
    merkleRoot: Buffer;
    time: number;
    timestamp: number;
    bits: number;
    nonce: Buffer;
    reserved: any;
    solution: any;
    constructor(arg: any);
    static _from(arg: Buffer | BlockHeader.DeserializedBlockHeaderObj): Partial<BlockHeader.DeserializedBlockHeaderObj>;
    static _fromObject(data: any): {
        hash: any;
        version: any;
        prevHash: any;
        merkleRoot: any;
        reserved: any;
        time: any;
        timestamp: any;
        bits: any;
        nonce: any;
        solution: any;
    };
    static fromObject(obj: any): BlockHeader;
    static fromRawBlock(data: any): BlockHeader;
    static fromBuffer(buf: any): BlockHeader;
    static fromString(str: any): BlockHeader;
    static _fromBufferReader(br: any): Partial<BlockHeader.DeserializedBlockHeaderObj>;
    static fromBufferReader(br: any): BlockHeader;
    toObject(): {
        hash: string;
        version: number;
        prevHash: string;
        merkleRoot: string;
        reserved: string;
        time: number;
        bits: number;
        nonce: string;
        solution: any;
    };
    toJSON: () => {
        hash: string;
        version: number;
        prevHash: string;
        merkleRoot: string;
        reserved: string;
        time: number;
        bits: number;
        nonce: string;
        solution: any;
    };
    toBuffer(): Buffer;
    toString(): string;
    toBufferWriter(bw?: BufferWriter): BufferWriter;
    getTargetDifficulty(bits?: number): BN;
    getDifficulty(): number;
    _getHash(): Buffer;
    private _getId;
    get id(): string;
    get hash(): string;
    validTimestamp: () => boolean;
    validProofOfWork: () => boolean;
    inspect(): string;
    static Constants: {
        START_OF_HEADER: number;
        MAX_TIME_OFFSET: number;
        LARGEST_HASH: BN;
    };
}
