/// <reference types="node" />
import { Transaction } from '../transaction';
import { Input } from './input';
import { Output } from '../output';
import { Script } from '../../script';
import { Signature } from '../../crypto/signature';
import { PublicKey } from '../../publickey';
import { TransactionSignature } from '../signature';
import { PrivateKey } from '../../privatekey';
export declare namespace MultiSigInput {
    interface MultiSigInputObj {
        publicKeys: Array<PublicKey>;
        threshold: number;
        signatures: Array<Signature | Signature.PostSignature>;
    }
}
export declare class MultiSigInput extends Input {
    static OPCODES_SIZE: number;
    static SIGNATURE_SIZE: number;
    nestedWitness: boolean;
    publicKeys: Array<PublicKey>;
    redeemScript: Script;
    output: Output;
    threshold: number;
    signatures: Array<TransactionSignature>;
    publicKeyIndex: {};
    constructor(input: MultiSigInput | MultiSigInput.MultiSigInputObj, pubkeys?: Array<PublicKey>, threshold?: number, signatures?: Array<Signature | Signature.PostSignature>);
    toObject(): any;
    _deserializeSignatures(signatures: any): TransactionSignature[];
    _serializeSignatures(): {
        publicKey: any;
        prevTxId: any;
        outputIndex: any;
        inputIndex: any;
        signature: any;
        sigtype: any;
    }[];
    getSignatures(transaction: Transaction, privateKey: PrivateKey, index: number, sigtype?: number, hashData?: Buffer): Array<TransactionSignature>;
    addSignature(transaction: Transaction, signature: TransactionSignature): this;
    _updateScript(): this;
    _createSignatures(): Buffer[];
    clearSignatures(): void;
    isFullySigned(): boolean;
    countMissingSignatures(): number;
    countSignatures(): number;
    publicKeysWithoutSignature(): PublicKey[];
    isValidSignature(transaction: Transaction, signature: Partial<TransactionSignature>): any;
    static normalizeSignatures(transaction: any, input: any, inputIndex: any, signatures: any, publicKeys: any): any;
    _estimateSize(): number;
}
