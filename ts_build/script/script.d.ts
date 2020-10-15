/// <reference types="node" />
import { Network } from '../networks';
import { Address } from '../address';
import { PublicKey } from '../publickey';
import { Interpreter } from './interpreter';
export interface InfoType {
    hashBuffer: Buffer;
    type: 'scripthash' | 'pubkeyhash';
    network: Network;
}
export declare namespace Script {
    interface Chunk {
        buf?: Buffer;
        len?: number;
        opcodenum: number;
    }
    interface WitnessProgram {
        version: number;
        program: Buffer;
    }
}
export declare class Script {
    static Interpreter: typeof Interpreter;
    chunks: Array<Script.Chunk>;
    _isInput: boolean;
    _isOutput: boolean;
    _network: Network;
    constructor(from?: any);
    set(obj: any): this;
    static fromBuffer(buffer: any): Script;
    toBuffer(): Buffer;
    static fromASM(str: any): Script;
    static fromHex(str: any): Script;
    static fromString(str: any): Script;
    _chunkToString(chunk: Script.Chunk, type?: string): string;
    toASM(): string;
    toString(): string;
    toHex(): string;
    inspect(): string;
    isPublicKeyHashOut(): boolean;
    isPublicKeyHashIn(): boolean;
    getPublicKey(): Buffer;
    getPublicKeyHash(): Buffer;
    isPublicKeyOut(): boolean;
    isPublicKeyIn(): boolean;
    isScriptHashOut(): boolean;
    isWitnessScriptHashOut(): boolean;
    isWitnessPublicKeyHashOut(): boolean;
    isWitnessProgram(values?: Partial<Script.WitnessProgram>): boolean;
    isScriptHashIn(): boolean;
    isMultisigOut(): boolean;
    isMultisigIn(): boolean;
    isDataOut(): boolean;
    getData(): Buffer;
    isPushOnly(): boolean;
    static types: {
        UNKNOWN: string;
        PUBKEY_OUT: string;
        PUBKEY_IN: string;
        PUBKEYHASH_OUT: string;
        PUBKEYHASH_IN: string;
        SCRIPTHASH_OUT: string;
        SCRIPTHASH_IN: string;
        MULTISIG_OUT: string;
        MULTISIG_IN: string;
        DATA_OUT: string;
    };
    static OP_RETURN_STANDARD_SIZE: number;
    classify(): any;
    outputIdentifiers: {
        PUBKEY_OUT: () => boolean;
        PUBKEYHASH_OUT: () => boolean;
        MULTISIG_OUT: () => boolean;
        SCRIPTHASH_OUT: () => boolean;
        DATA_OUT: () => boolean;
    };
    classifyOutput(): any;
    inputIdentifiers: {
        PUBKEY_IN: () => boolean;
        PUBKEYHASH_IN: () => boolean;
        MULTISIG_IN: () => boolean;
        SCRIPTHASH_IN: () => boolean;
    };
    classifyInput(): any;
    isStandard(): boolean;
    prepend(obj: any): this;
    equals(script: any): boolean;
    add(obj: any): this;
    _addByType(obj: any, prepend: any): void;
    _insertAtPosition(op: any, prepend: any): void;
    _addOpcode(opcode: any, prepend: any): this;
    _addBuffer(buf: any, prepend: any): this;
    hasCodeseparators(): boolean;
    removeCodeseparators(): this;
    static buildMultisigOut(publicKeys: Array<PublicKey>, threshold: number, opts?: {
        noSorting?: boolean;
    }): Script;
    static buildWitnessMultisigOutFromScript(script: any): Script;
    static buildMultisigIn(pubkeys: Array<PublicKey>, threshold: number, signatures: Array<Buffer>, opts?: any): Script;
    static buildP2SHMultisigIn(pubkeys: any, threshold: any, signatures: any, opts: any): Script;
    static buildPublicKeyHashOut(to: any): Script;
    static buildPublicKeyOut(pubkey: any): Script;
    static buildDataOut(data?: string | Buffer, encoding?: string): Script;
    static buildScriptHashOut(script: any): Script;
    static buildPublicKeyIn(signature: any, sigtype: any): Script;
    static buildPublicKeyHashIn(publicKey: any, signature: any, sigtype?: number): Script;
    static empty(): Script;
    toScriptHashOut(): Script;
    static fromAddress(address: Address | string): Script;
    getAddressInfo(): false | Address.AddressObj;
    _getOutputAddressInfo(): false | {
        hashBuffer: Buffer;
        type: "scripthash";
        network: Network;
    } | {
        hashBuffer: Buffer;
        type: "pubkeyhash";
        network: Network;
    };
    _getInputAddressInfo(): false | Address.AddressObj;
    toAddress(network?: Network): Address;
    findAndDelete(script: any): this;
    checkMinimalPush(i: any): boolean;
    _decodeOP_N(opcode: any): number;
    getSignatureOperationsCount(accurate?: boolean): number;
}
