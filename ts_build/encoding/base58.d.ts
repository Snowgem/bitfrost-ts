/// <reference types="node" />
export declare namespace Base58 {
    interface Base58Obj {
        buf: Buffer;
    }
}
export declare class Base58 {
    buf: Buffer;
    constructor(obj?: Base58 | Buffer | string | Base58.Base58Obj);
    static validCharacters(chars: any): boolean;
    set(obj: Base58.Base58Obj): Base58;
    static encode(buf: any): string;
    static decode(str: any): Buffer;
    fromBuffer(buf: any): this;
    fromString(str: any): this;
    toBuffer(): Buffer;
    toString(): string;
}
