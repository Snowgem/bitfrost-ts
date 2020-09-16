/// <reference types="node" />
declare type HashFunctions = 'sha256' | 'sha512' | 'sha1';
export declare class Hash {
    static sha1(buf: any): Buffer;
    static sha256(buf: any): Buffer;
    static sha256sha256(buf: any): Buffer;
    static ripemd160(buf: any): Buffer;
    static sha256ripemd160(buf: any): Buffer;
    static sha512(buf: any): Buffer;
    static hmac(hashFnName: HashFunctions, data: Buffer, key: Buffer): Buffer;
    static sha256hmac(data: any, key: any): Buffer;
    static sha512hmac(data: any, key: any): Buffer;
}
export {};
