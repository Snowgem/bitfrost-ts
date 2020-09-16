/// <reference types="node" />
export declare namespace OutputDescription {
    interface OutputDescriptionObj {
        cv: Buffer;
        cmu: Buffer;
        ephemeralKey: Buffer;
        encCipherText: Buffer;
        outCipherText: Buffer;
        proof: Buffer;
    }
}
export declare class OutputDescription {
    cv: Buffer;
    cmu: Buffer;
    ephemeralKey: Buffer;
    encCipherText: Buffer;
    outCipherText: Buffer;
    proof: Buffer;
    constructor(params?: any);
    static fromObject: (obj: any) => any;
    _fromObject: (params: any) => any;
    toObject: () => {};
    toJSON: () => {};
    static fromBufferReader: (br: any) => OutputDescription;
    toBufferWriter: (writer: any) => any;
}
