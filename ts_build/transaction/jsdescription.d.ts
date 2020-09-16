/// <reference types="node" />
import { BufferReader } from '../encoding/bufferreader';
export declare namespace JSDescription {
    interface JSDescriptionObj {
        nullifiers: Array<Buffer>;
        commitments: Array<Buffer>;
        ciphertexts: Array<Buffer>;
        macs: Array<Buffer>;
    }
}
export declare class JSDescription {
    nullifiers: Array<Buffer>;
    commitments: Array<Buffer>;
    ciphertexts: Array<Buffer>;
    macs: Array<Buffer>;
    _vpub_old: any;
    _vpub_oldBN: any;
    _vpub_new: any;
    _vpub_newBN: any;
    anchor: Buffer;
    ephemeralKey: Buffer;
    randomSeed: Buffer;
    proof: Buffer;
    constructor(params?: JSDescription.JSDescriptionObj);
    get vpub_old(): any;
    setVpubOld(num: any): void;
    get vpub_new(): any;
    setVpubNew(num: any): void;
    static fromObject(obj: any): JSDescription;
    _fromObject(params: any): this;
    toObject(): {
        vpub_old: any;
        vpub_new: any;
        anchor: string;
        nullifiers: any[];
        commitments: any[];
        ephemeralKey: string;
        ciphertexts: any[];
        randomSeed: string;
        macs: any[];
        proof: Buffer;
    };
    toJSON: () => {
        vpub_old: any;
        vpub_new: any;
        anchor: string;
        nullifiers: any[];
        commitments: any[];
        ephemeralKey: string;
        ciphertexts: any[];
        randomSeed: string;
        macs: any[];
        proof: Buffer;
    };
    static fromBufferReader(br: BufferReader, useGrothFlagParam: any): JSDescription;
    toBufferWriter(writer: any): any;
}
