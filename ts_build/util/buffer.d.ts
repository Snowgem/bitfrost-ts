/// <reference types="node" />
export declare class BufferUtil {
    static fill(buffer: Buffer, value?: number): Buffer;
    static copy(original: Buffer): Buffer;
    static isBuffer(arg: any): boolean;
    static emptyBuffer(bytes: number): Buffer;
    static equal(a: any, b: any): boolean;
    static equals: typeof BufferUtil.equal;
    static integerAsSingleByteBuffer(integer: number): Buffer;
    static integerAsBuffer(integer: number): Buffer;
    static integerFromBuffer(buffer: Buffer): number;
    static integerFromSingleByteBuffer(buffer: any): number;
    static bufferToHex(buffer: any): string;
    static reverse(param: any): Buffer;
    static hexToBuffer(str: string): Buffer;
    static NULL_HASH: Buffer;
    static EMPTY_BUFFER: Buffer;
    static concat: (list: Uint8Array[], totalLength?: number) => Buffer;
    static toBufferIfString(value: string | Buffer): Buffer;
}
