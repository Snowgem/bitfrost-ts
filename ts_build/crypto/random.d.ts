/// <reference types="node" />
interface CryptoLib {
    getRandomValues: (bbuf: Uint8Array) => void;
}
declare global {
    interface Window {
        browser: boolean;
        msCrypto: CryptoLib;
        crypto: CryptoLib;
    }
}
export declare class Random {
    static getRandomBuffer(size: any): any;
    static getRandomBufferNode(size: any): any;
    static getRandomBufferBrowser(size: any): Buffer;
    static getPseudoRandomBuffer(size: any): Buffer;
}
export {};
