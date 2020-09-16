/// <reference types="node" />
export declare namespace SpendDescription {
    interface SpendDescriptionObj {
        cv: Buffer;
        anchor: Buffer;
        nullifier: Buffer;
        rk: Buffer;
        proof: Buffer;
        spendAuthSig: Buffer;
    }
}
export declare class SpendDescription {
    cv: Buffer;
    anchor: Buffer;
    nullifier: Buffer;
    rk: Buffer;
    proof: Buffer;
    spendAuthSig: Buffer;
    constructor(params?: any);
    static fromObject: (obj: any) => any;
    _fromObject: (params: any) => any;
    toObject: () => {};
    toJSON: () => {};
    static fromBufferReader: (br: any) => SpendDescription;
    toBufferWriter: (writer: any) => any;
}
