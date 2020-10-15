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
        zaddr: string;
        zkey: string;
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
    zaddr: string;
    zkey: string;
    networkMagic: Buffer;
    port: number;
    dnsSeeds: Array<string>;
    static defaultNetwork: Network;
    static livenet: Network;
    static testnet: Network;
    constructor(obj?: Network.NetworkObj);
    toString: () => any;
    static get(arg: string | number | Network, keys?: Array<string> | string): any;
    static addNetwork(data: any): {
        name: any;
        alias: any;
        pubkeyhash: any;
        privatekey: any;
        scripthash: any;
        xpubkey: any;
        xprivkey: any;
        zaddr: any;
        zkey: any;
        networkMagic: any;
        dnsSeeds: any;
        port: any;
    };
    static removeNetwork(network: any): void;
}
