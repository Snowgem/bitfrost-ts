/// <reference types="node" />
import { BlockHeader } from './blockheader';
import { Transaction } from '../transaction';
export declare namespace Block {
    interface BlockObj {
        transactions: Array<Transaction>;
        header: BlockHeader;
    }
}
export declare class Block {
    transactions: Array<Transaction>;
    _id: string;
    header: BlockHeader;
    constructor(arg?: Partial<Block.BlockObj> | Buffer);
    static MAX_BLOCK_SIZE: number;
    static _from: (arg: any) => {};
    static _fromObject: (data: any) => {
        header: BlockHeader;
        transactions: any[];
    };
    static fromObject: (obj: any) => Block;
    static _fromBufferReader: (br: any) => Partial<Block.BlockObj>;
    static fromBufferReader: (br: any) => Block;
    static fromBuffer: (buf: any) => Block;
    static fromString: (str: any) => Block;
    static fromRawBlock: (data: any) => Block;
    toObject: () => {
        header: any;
        transactions: any[];
    };
    toJSON: () => {
        header: any;
        transactions: any[];
    };
    toBuffer: () => any;
    toString: () => any;
    toBufferWriter: (bw: any) => any;
    getTransactionHashes: () => any[];
    getMerkleTree: () => any;
    getMerkleRoot: () => any;
    validMerkleRoot: () => boolean;
    _getHash: () => any;
    get hash(): string;
    get id(): string;
    inspect: () => string;
    static Values: {
        START_OF_BLOCK: number;
        NULL_HASH: Buffer;
    };
}
