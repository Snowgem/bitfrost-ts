/// <reference types="node" />
import { BlockHeader } from './blockheader';
import { BufferWriter } from '../encoding/bufferwriter';
declare namespace MerkleBlock {
    interface MerkleBlockObj {
        header: BlockHeader.BlockHeaderObj;
        hashes: Array<string>;
        flags: Array<number>;
        numTransactions: number;
    }
}
export declare class MerkleBlock {
    _flagBitsUsed: number;
    _hashesUsed: number;
    header: BlockHeader;
    hashes: Array<string>;
    flags: Array<number>;
    numTransactions: number;
    constructor(arg?: MerkleBlock | Buffer | Partial<MerkleBlock.MerkleBlockObj>);
    static fromBuffer(buf: any): MerkleBlock;
    static fromBufferReader(br: any): MerkleBlock;
    toBuffer(): Buffer;
    toBufferWriter(bw?: BufferWriter): BufferWriter;
    toObject(): {
        header: {
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
        numTransactions: number;
        hashes: string[];
        flags: number[];
    };
    toJSON: () => {
        header: {
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
        numTransactions: number;
        hashes: string[];
        flags: number[];
    };
    validMerkleTree(): boolean;
    filterdTxsHash(): any;
    _traverseMerkleTree(depth: any, pos: any, opts: any, checkForTxs?: boolean): any;
    _calcTreeWidth(height: any): number;
    _calcTreeHeight(): number;
    hasTransaction(tx: any): boolean;
    static _fromBufferReader(br: any): Partial<MerkleBlock.MerkleBlockObj>;
    static fromObject: (obj: any) => MerkleBlock;
}
export {};
