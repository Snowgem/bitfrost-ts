import { Address } from './address';
import { Network } from './networks';
export declare namespace URI {
    interface URIObj {
        amount: number;
        address: string;
        message: string;
        label: string;
        r: string;
    }
}
export declare class URI {
    amount: number;
    message: string;
    label: string;
    r: number;
    extras: any;
    knownParams: Array<string>;
    address: Address;
    network: Network;
    constructor(data?: URI | Partial<URI.URIObj> | string | any, knownParams?: any[]);
    static fromString(str: any): URI;
    static fromObject(json: any): URI;
    static fromJSON: typeof URI.fromObject;
    static isValid(arg: any, knownParams?: any[]): boolean;
    static parse(uri: any): URI.URIObj;
    static Members: string[];
    _fromObject(obj: Partial<URI.URIObj>): void;
    _parseAmount(amount: any): any;
    toObject: () => {};
    toJSON: () => {};
    toString(): string;
    inspect(): string;
}
