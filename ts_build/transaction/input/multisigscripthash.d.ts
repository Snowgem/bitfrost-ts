/// <reference types="node" />
import { Input, InputTypes } from './input';
import { Output } from '../output';
import { Script } from '../../script';
import { Signature } from '../../crypto/signature';
import { TransactionSignature } from '../signature';
import { PublicKey } from '../../publickey';
import { Transaction } from '../transaction';
import { PrivateKey } from '../../privatekey';
export declare class MultiSigScriptHashInput extends Input {
    static OPCODES_SIZE: number;
    static SIGNATURE_SIZE: number;
    static PUBKEY_SIZE: number;
    nestedWitness: boolean;
    publicKeys: Array<PublicKey>;
    redeemScript: Script;
    output: Output;
    threshold: number;
    signatures: Array<TransactionSignature>;
    publicKeyIndex: {};
    constructor(input: MultiSigScriptHashInput | InputTypes.InputObj, pubkeys?: Array<PublicKey>, threshold?: number, signatures?: Array<Signature | Signature.PostSignature>, nestedWitness?: boolean);
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
    getScriptCode(): Buffer;
    getSignatures(transaction: Transaction, privateKey: PrivateKey, index: number, sigtype?: number): Array<TransactionSignature>;
    addSignature(transaction: Transaction, signature: TransactionSignature): this;
    _updateScript(): this;
    _createSignatures(): Buffer[];
    clearSignatures(): void;
    isFullySigned(): boolean;
    countMissingSignatures(): number;
    countSignatures(): number;
    publicKeysWithoutSignature(): PublicKey[];
    isValidSignature(transaction: Transaction, signature: Partial<TransactionSignature>): any;
    _estimateSize(): number;
}
