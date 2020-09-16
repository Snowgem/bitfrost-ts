import { BufferReader } from './bufferreader';
import { Varint } from './varint';
import { BufferWriter } from './bufferwriter';
import { Base58Check } from './base58check';
import { Base58 } from './base58';
export declare const Encoding: {
    Base58: typeof Base58;
    Base58Check: typeof Base58Check;
    BufferReader: typeof BufferReader;
    BufferWriter: typeof BufferWriter;
    Varint: typeof Varint;
};
export * from './bufferreader';
export * from './varint';
export * from './bufferwriter';
export * from './base58check';
export * from './base58';
