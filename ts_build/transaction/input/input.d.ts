/// <reference types="node" />
import BN from 'bn.js';
import { PublicKeyHashInput } from './publickeyhash';
import { BufferWriter } from '../../encoding';
import { Script } from '../../script';
import { Output } from '../output';
import { PublicKey } from '../../publickey';
import { Signature } from '../../crypto/signature';
import { MultiSigScriptHashInput } from './multisigscripthash';
import { MultiSigInput } from './multisig';
export declare namespace InputTypes {
    interface InputObj {
        prevTxId?: string | Buffer;
        txidbuf?: Buffer;
        outputIndex?: number;
        sequenceNumber?: number;
        script?: string | Script;
        output?: Output.OutputObj;
        txoutnum?: number;
        seqnum?: number;
        scriptBuffer?: Buffer;
        scriptString?: string;
    }
}
export declare class Input {
    static MAXINT: number;
    static DEFAULT_SEQNUMBER: number;
    static DEFAULT_LOCKTIME_SEQNUMBER: number;
    static DEFAULT_RBF_SEQNUMBER: number;
    static PublicKey: typeof PublicKey;
    static PublicKeyHash: typeof PublicKeyHashInput;
    static MultiSigScriptHash: typeof MultiSigScriptHashInput;
    static MultiSig: typeof MultiSigInput;
    _scriptBuffer: Buffer;
    _script: Script;
    _satoshis: number;
    _satoshisBN: BN;
    witnesses: Array<string>;
    output: Output;
    prevTxId: Buffer;
    outputIndex: number;
    sequenceNumber: number;
    signatures: any[];
    constructor(input?: InputTypes.InputObj, pubkeys?: Array<PublicKey>, threshold?: number, signatures?: Array<Signature>, nestedWitness?: boolean);
    get script(): Script;
    static fromObject(obj: any): Input;
    _fromObject(params: any): this;
    toObject(): InputTypes.InputObj;
    toJSON: () => InputTypes.InputObj;
    static fromBufferReader(br: any): Input;
    toBufferWriter(writer?: BufferWriter): BufferWriter;
    setScript(script: any): this;
    isFullySigned(): void;
    isFinal(): boolean;
    isValidSignature(transaction: any, signature: any): any;
    isNull(): boolean;
    _estimateSize(): number;
}
