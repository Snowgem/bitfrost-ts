/// <reference types="node" />
import { Input } from './input';
import { TransactionSignature } from '../signature';
import { Transaction } from '../transaction';
import { PrivateKey } from '../../privatekey';
export declare class PublicKeyInput extends Input {
    constructor(args: any);
    getSignatures(transaction: Transaction, privateKey: PrivateKey, index: number, sigtype?: number, hashData?: Buffer): Array<TransactionSignature>;
    addSignature(transaction: Transaction, signature: TransactionSignature): this;
    clearSignatures(): this;
    isFullySigned(): boolean;
    static SCRIPT_MAX_SIZE: number;
    _estimateSize(): number;
}
