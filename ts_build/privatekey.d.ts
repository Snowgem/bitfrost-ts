/// <reference types="node" />
import { Address, Network, PublicKey } from '.';
import { BitcoreBN } from './crypto';
declare namespace PrivateKey {
    interface PrivateKeyObj {
        compressed: boolean;
        network: Network;
        bn: BitcoreBN;
    }
    type DataType = PrivateKey | PrivateKey.PrivateKeyObj | BitcoreBN | Buffer | string;
}
export declare class PrivateKey {
    compressed: boolean;
    network: Network;
    bn: BitcoreBN;
    _pubkey: PublicKey;
    constructor(data?: PrivateKey.DataType, network?: Network | string);
    get publicKey(): any;
    _classifyArguments: (data: any, network: any) => Partial<PrivateKey.PrivateKeyObj>;
    static _getRandomBN: () => any;
    static _transformBuffer: (buf: any, network: any) => Partial<PrivateKey.PrivateKeyObj>;
    static _transformBNBuffer: (buf: any, network: any) => Partial<PrivateKey.PrivateKeyObj>;
    static _transformWIF: (str: any, network: any) => Partial<PrivateKey.PrivateKeyObj>;
    static fromBuffer: (arg: any, network: any) => PrivateKey;
    static _transformObject: (json: any) => {
        bn: BitcoreBN;
        network: any;
        compressed: any;
    };
    static fromString: (str: any) => PrivateKey;
    static fromWIF: (str: any) => PrivateKey;
    static fromObject: (obj: any) => PrivateKey;
    static fromRandom: (network: any) => PrivateKey;
    static getValidationError: (data: any, network: any) => any;
    static isValid(data?: PrivateKey.DataType, network?: Network): boolean;
    toString: () => any;
    toWIF: () => any;
    toBigNumber: () => any;
    toBuffer: () => any;
    toBufferNoPadding: () => any;
    toPublicKey: () => any;
    toAddress: (network: any) => Address;
    toObject: () => {
        bn: any;
        compressed: any;
        network: any;
    };
    toJSON: () => {
        bn: any;
        compressed: any;
        network: any;
    };
    inspect: () => string;
}
export {};
