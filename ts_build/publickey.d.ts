/// <reference types="node" />
import { Point } from './crypto/point';
import { Network } from './networks';
export declare namespace PublicKey {
    interface PubKeyObj {
        point: Point;
        compressed: boolean;
        network: Network;
    }
}
export declare class PublicKey {
    point: Point;
    compressed: boolean;
    network: Network;
    constructor(data: any, extra?: {
        network?: Network;
        compressed?: boolean;
    });
    _classifyArgs: (data: any, extra: any) => Partial<PublicKey.PubKeyObj>;
    static _isPrivateKey: (param: any) => boolean;
    static _isBuffer: (param: any) => boolean;
    static _transformPrivateKey: (privkey: any) => Partial<PublicKey.PubKeyObj>;
    static _transformDER: (buf: any, strict?: boolean) => Partial<PublicKey.PubKeyObj>;
    static _transformX: (odd: any, x: any) => Partial<PublicKey.PubKeyObj>;
    static _transformObject: (json: any) => PublicKey;
    static fromPrivateKey: (privkey: any) => PublicKey;
    static fromDER: (buf: any, strict: any) => PublicKey;
    static fromBuffer: (buf: any, strict: any) => PublicKey;
    static fromPoint: (point: any, compressed?: boolean) => PublicKey;
    static fromString: (str: any, encoding: any) => PublicKey;
    static fromX: (odd: any, x: any) => PublicKey;
    static getValidationError: (data: any) => any;
    static isValid: (data: any) => boolean;
    toObject: () => {
        x: any;
        y: any;
        compressed: any;
    };
    toJson: () => {
        x: any;
        y: any;
        compressed: any;
    };
    toBuffer: () => Buffer;
    toDER: () => Buffer;
    _getID: () => Buffer;
    toAddress(network?: Network | string): any;
    toString: () => any;
    inspect: () => string;
}
