/// <reference types="node" />
export declare namespace Base58Check {
    interface Base58CheckObj {
        buf: Buffer;
    }
}
export declare class Base58Check {
    buf: Buffer;
    constructor(obj?: Base58Check | Buffer | string | Base58Check.Base58CheckObj);
    set(obj: any): this;
    static validChecksum(data: string | Buffer, checksum?: string | Buffer): boolean;
    static decode(s: any): Buffer;
    static checksum(buffer: any): Buffer;
    static encode(buf: any): string;
    fromBuffer(buf: any): this;
    fromString(str: any): this;
    toBuffer(): Buffer;
    toString(): string;
}
