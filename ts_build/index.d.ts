import { UnspentOutput } from './transaction/unspentoutput';
import { URI } from './uri';
import { Block } from './block/block';
import { BitcoreError } from './errors';
import { Network } from './networks';
import { MerkleBlock } from './block/merkleblock';
import { Script } from './script/script';
import { Transaction } from './transaction/transaction';
import { HDPrivateKey } from './hdprivatekey';
import { HDPublicKey } from './hdpublickey';
import { Address } from './address';
import { Opcode } from './opcode';
import { PrivateKey } from './privatekey';
import { PublicKey } from './publickey';
import { Unit } from './unit';
import { BlockHeader } from './block/blockheader';
export declare const BitFrostLib: {
    Address: typeof Address;
    Block: typeof Block;
    BlockHeader: typeof BlockHeader;
    crypto: {
        BN: typeof import("./crypto").BitcoreBN;
        ECDSA: typeof import("./crypto").ECDSA;
        Hash: typeof import("./crypto").Hash;
        Point: typeof import("./crypto").Point;
        Random: typeof import("./crypto").Random;
        Signature: typeof import("./crypto").Signature;
    };
    encoding: {
        Base58: typeof import("./encoding").Base58;
        Base58Check: typeof import("./encoding").Base58Check;
        BufferReader: typeof import("./encoding").BufferReader;
        BufferWriter: typeof import("./encoding").BufferWriter;
        Varint: typeof import("./encoding").Varint;
    };
    errors: typeof BitcoreError;
    Script: typeof Script;
    UnspentOutput: typeof UnspentOutput;
    Transaction: typeof Transaction;
    HDPrivateKey: typeof HDPrivateKey;
    HDPublicKey: typeof HDPublicKey;
    Network: typeof Network;
    Opcode: typeof Opcode;
    PrivateKey: typeof PrivateKey;
    MerkleBlock: typeof MerkleBlock;
    PublicKey: typeof PublicKey;
    Unit: typeof Unit;
    util: {
        buffer: typeof import("./util").BufferUtil;
        js: typeof import("./util").JSUtil;
        preconditions: {
            checkState: (condition: any, message: any) => void;
            checkArgument(condition: any, argumentName?: any, message?: any, docsPath?: any): void;
            checkArgumentType(argument: any, type: any, argumentName?: string): void;
        };
    };
    URI: typeof URI;
    version: string;
    versionGuard(version: any): void;
};
export * from './address';
export * from './hdprivatekey';
export * from './hdpublickey';
export * from './networks';
export * from './opcode';
export * from './privatekey';
export * from './publickey';
export * from './unit';
export * from './uri';
export * from './transaction';
export * from './crypto';
export * from './networks';
export * from './encoding';
export * from './script';
