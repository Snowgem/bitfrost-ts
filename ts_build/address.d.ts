/// <reference types="node" />
import { PublicKey, Network } from '.';
import { Script } from './script';
export declare namespace Address {
    type AddressData = string | Array<string> | Buffer | Uint8Array | PublicKey | Array<PublicKey> | Script | AddressObj;
    interface AddressObj {
        hashBuffer?: Buffer;
        network?: Network | string;
        type?: 'pubkeyhash' | 'scripthash';
    }
}
export declare class Address {
    static PayToPublicKeyHash: "pubkeyhash";
    static PayToScriptHash: "scripthash";
    type: 'pubkeyhash' | 'scripthash';
    network: Network;
    hashBuffer: Buffer;
    constructor(data: Address.AddressData | Address, network?: Network | number | string, type?: 'scripthash' | 'pubkeyhash');
    _classifyArguments: (data: any, network: any, type: any) => any;
    static _transformHash: (hash: Buffer | Uint8Array, type?: "pubkeyhash") => {
        hashBuffer: Uint8Array | Buffer;
        network: any;
        type: "pubkeyhash";
    };
    static _transformObject: (data: any) => {
        hashBuffer: any;
        network: any;
        type: any;
    };
    static _classifyFromVersion: (buffer: any, name: any) => {
        network: any;
        type: "pubkeyhash";
    } | {
        network: any;
        type: "scripthash";
    } | {
        network?: undefined;
        type?: undefined;
    };
    static _transformBuffer(buffer: any, network?: Network | string, type?: 'pubkeyhash' | 'scripthash'): {
        hashBuffer: Uint8Array | Buffer;
        network: any;
        type: "pubkeyhash" | "scripthash";
    };
    static _transformPublicKey: (pubkey: any) => {
        hashBuffer: Buffer;
        type: "pubkeyhash";
        network: any;
    };
    static _transformScript: (script: any, network: any) => any;
    static createMultisig: (publicKeys: any, threshold: any, network: any) => Address;
    static _transformString(data: any, network: Network | string, type: 'pubkeyhash' | 'scripthash'): {
        hashBuffer: Uint8Array | Buffer;
        network: any;
        type: "pubkeyhash" | "scripthash";
    };
    static fromPublicKey: (data: any, network: any) => Address;
    static fromPublicKeyHash: (hash: any, network: any) => Address;
    static fromScriptHash: (hash: any, network: any) => Address;
    static payingTo: (script: any, network: any) => Address;
    static fromScript: (script: any, network: any) => Address;
    static fromBuffer: (buffer: any, network: any, type: any) => Address;
    static fromString(str: string, network?: Network | string, type?: 'scripthash' | 'pubkeyhash'): Address;
    static fromObject: (obj: any) => Address;
    static getValidationError: (data: any, network: any, type: any) => any;
    static isValid(data: any, network?: Network | string, type?: 'scripthash' | 'pubkeyhash'): boolean;
    isPayToPublicKeyHash: () => boolean;
    isPayToScriptHash: () => boolean;
    toBuffer: () => Buffer;
    toObject: () => {
        hash: any;
        type: any;
        network: any;
    };
    toJSON: () => {
        hash: any;
        type: any;
        network: any;
    };
    toString: () => any;
    inspect: () => string;
}
