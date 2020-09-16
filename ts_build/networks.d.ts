/// <reference types="node" />
export declare namespace Network {
    interface NetworkObj {
        name: string;
        alias?: string;
        pubkeyhash: number;
        privatekey: number;
        scripthash: number;
        xpubkey: number;
        xprivkey: number;
        networkMagic: Buffer | number;
        port: number;
        dnsSeeds?: Array<string>;
    }
}
export declare class Network {
    name: string;
    alias: string;
    pubkeyhash: number;
    privatekey: number;
    scripthash: number;
    xpubkey: number;
    xprivkey: number;
    networkMagic: Buffer;
    port: number;
    dnsSeeds: Array<string>;
    static defaultNetwork: any;
    static livenet: any;
    static testnet: any;
    constructor(obj?: Network.NetworkObj);
    toString: () => any;
    static get(arg: string | number | Network, keys?: Array<string> | string): any;
    static addNetwork(data: any): Network;
    static removeNetwork(network: any): void;
}
