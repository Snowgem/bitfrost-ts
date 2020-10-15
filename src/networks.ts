import * as _ from 'lodash';
import { BufferUtil } from './util/buffer';
import { JSUtil } from './util/js';
import { isString, isNumber, isObject } from 'lodash';
import { ERROR_TYPES } from './errors/spec';
import { BitcoreError } from './errors';

const networks = [];
const networkMaps = {};

export namespace Network {
    export interface NetworkObj {
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

/**
 * A network is merely a map containing values that correspond to version
 * numbers for each bitcoin network. Currently only supporting "livenet"
 * (a.k.a. "mainnet") and "testnet".
 * @constructor
 */
export class Network {
    public name: string;
    public alias: string;
    public pubkeyhash: number;
    public privatekey: number;
    public scripthash: number;
    public xpubkey: number;
    public xprivkey: number;
    public zaddr: string;
    public zkey: string;
    public networkMagic: Buffer;
    public port: number;
    public dnsSeeds: Array<string>;
    public static defaultNetwork: Network;
    public static livenet: Network;
    public static testnet: Network;

    constructor(obj?: Network.NetworkObj) {
        const {
            name,
            alias,
            pubkeyhash,
            privatekey,
            scripthash,
            xpubkey,
            xprivkey,
            networkMagic,
            port,
            dnsSeeds,
            zaddr,
            zkey
        } = obj;
        Object.assign(this, {
            name,
            alias,
            pubkeyhash,
            privatekey,
            scripthash,
            xpubkey,
            xprivkey,
            zaddr,
            zkey,
            networkMagic,
            port,
            dnsSeeds
        });
    }
    public toString = function toString() {
        return this.name;
    };
    /**
     * @function
     * @member Networks#get
     * Retrieves the network associated with a magic number or string.
     * @param {string|number|Network} arg
     * @param {string|Array} keys - if set, only check if the magic number associated with this name matches
     * @return Network
     */
    public static get(
        arg: string | number | Network,
        keys?: Array<string> | string
    ) {
        if (~networks.indexOf(arg)) {
            return arg;
        }
        if (keys) {
            if (!_.isArray(keys)) {
                keys = [keys];
            }
            var containsArg = function (key) {
                return networks[index][key] === arg && (keys.length > 1 && keys[1] ? networks[index].name == keys[1] : true);
            };
            for (var index in networks) {
                if (_.some(keys, containsArg)) {
                    return networks[index];
                }
            }
            return undefined;
        }
        if (isString(arg) || isNumber(arg)) {
            return networkMaps[arg.toString()];
        }
        else if (isObject(arg)) {
            return networkMaps[arg.name];
        }
        else {
            throw new BitcoreError(
                ERROR_TYPES.InvalidArgument,
                arg
            );
        }
    }
    /**
     * @function
     * @member Networks#add
     * Will add a custom Network
     * @param {Object} data
     * @param {string} data.name - The name of the network
     * @param {string} data.alias - The aliased name of the network
     * @param {Number} data.pubkeyhash - The publickey hash prefix
     * @param {Number} data.privatekey - The privatekey prefix
     * @param {Number} data.scripthash - The scripthash prefix
     * @param {Number} data.xpubkey - The extended public key magic
     * @param {Number} data.xprivkey - The extended private key magic
     * @param {Number} data.zaddr - The Zcash payment address prefix
     * @param {Number} data.zkey - The Zcash spending key prefix
     * @param {Number} data.networkMagic - The network magic number
     * @param {Number} data.port - The network port
     * @param {Array}  data.dnsSeeds - An array of dns seeds
     * @return Network
     */
    public static addNetwork(data) {
        const network = {
            name: data.name,
            alias: data.alias,
            pubkeyhash: data.pubkeyhash,
            privatekey: data.privatekey,
            scripthash: data.scripthash,
            xpubkey: data.xpubkey,
            xprivkey: data.xprivkey,
            zaddr: data.zaddr,
            zkey: data.zkey,
            networkMagic:
                data.networkMagic instanceof Buffer
                    ? data.networkMagic
                    : BufferUtil.integerAsBuffer(data.networkMagic),
            dnsSeeds: data.dnsSeeds,
            port: data.port
        };

        _.each(network, value => {
            if (
                !_.isUndefined(value) &&
                !_.isObject(value) &&
                typeof value === 'string'
            ) {
                networkMaps[value] = network;
            }
        });

        networks.push(new Network(network));

        return network;
    }
    /**
     * @function
     * @member Networks#remove
     * Will remove a custom network
     * @param {Network} network
     */
    public static removeNetwork(network) {
        for (var i = 0; i < networks.length; i++) {
            if (networks[i] === network) {
                networks.splice(i, 1);
            }
        }
        for (var key in networkMaps) {
            if (networkMaps[key] === network) {
                delete networkMaps[key];
            }
        }
    }

}

Network.addNetwork({
    name: 'livenet',
    alias: 'mainnet',
    pubkeyhash: 0x0001,
    privatekey: 0x80,
    scripthash: 0x0001,
    xpubkey: 0x04880001,
    xprivkey: 0x04880001,
    zaddr: 0x169a,
    zkey: 0xab36,
    networkMagic: 0x24c80001,
    port: 16113,
    dnsSeeds: [
        'dnsseed1.snowgem.org',
        'dnsseed2.snowgem.org',
        'dnsseed3.snowgem.org',
    ]
});

Network.livenet = Network.get('livenet');
Network.defaultNetwork = Network.get('livenet')
Network.addNetwork({
    name: 'testnet',
    alias: 'regtest',
    pubkeyhash: 0x0001,
    privatekey: 0xef,
    scripthash: 0x0001,
    xpubkey: 0x04350001,
    xprivkey: 0x04350001,
    zaddr: 0x0001,
    zkey: 0x0001,
    networkMagic: 0x24c80001,
    port: 26113,
    dnsSeeds: [
        'dnsseed1.snowgem.org',
        'dnsseed2.snowgem.org',
        'dnsseed3.snowgem.org',
    ]
});

Network.testnet = Network.get('testnet');