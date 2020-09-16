/// <reference types="node" />
import { PublicKey } from '../publickey';
import { Signature } from '../crypto/signature';
export declare namespace TransactionSignature {
    interface TransactionSignatureObj {
        publicKey: string | PublicKey;
        prevTxId: Buffer | string;
        outputIndex: number;
        inputIndex: number;
        signature: string | Signature;
        sigtype: number;
    }
}
export declare class TransactionSignature extends Signature {
    publicKey: PublicKey;
    prevTxId: Buffer;
    outputIndex: number;
    inputIndex: number;
    signature: Signature;
    sigtype: number;
    constructor(arg: TransactionSignature | TransactionSignature.TransactionSignatureObj | string);
    _fromObject: (arg: any) => any;
    _checkObjectArgs: (arg: any) => void;
    toObject: () => {
        publicKey: any;
        prevTxId: any;
        outputIndex: any;
        inputIndex: any;
        signature: any;
        sigtype: any;
    };
    toJSON: () => {
        publicKey: any;
        prevTxId: any;
        outputIndex: any;
        inputIndex: any;
        signature: any;
        sigtype: any;
    };
    static fromObject: (object: any) => TransactionSignature;
}
