import { Script } from '../script';
import { Address } from '../address';
export declare namespace UnspentOutput {
    interface UnspentOutputObj {
        address?: string | Address;
        txId?: string;
        vout?: number;
        value?: number;
        scriptPubKey?: string;
        outputIndex?: number;
        amount?: number;
        satoshis?: number;
        script?: string | Script;
    }
}
export declare class UnspentOutput {
    address?: Address | string;
    txId: string;
    vout?: number;
    scriptPubKey?: string;
    amount?: number;
    satoshis: number;
    script?: Script;
    outputIndex: number;
    constructor(data: UnspentOutput | UnspentOutput.UnspentOutputObj);
    inspect: () => string;
    toString: () => string;
    static fromObject: (data: any) => UnspentOutput;
    toObject: () => {
        address: any;
        txid: any;
        vout: any;
        scriptPubKey: any;
        amount: any;
    };
    toJSON: () => {
        address: any;
        txid: any;
        vout: any;
        scriptPubKey: any;
        amount: any;
    };
}
