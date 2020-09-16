"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Network = void 0;
const _ = __importStar(require("lodash"));
const buffer_1 = require("./util/buffer");
const js_1 = require("./util/js");
const networks = [];
const networkMaps = {};
class Network {
    constructor(obj) {
        this.toString = function toString() {
            return this.name;
        };
        const { name, alias, pubkeyhash, privatekey, scripthash, xpubkey, xprivkey, networkMagic, port, dnsSeeds } = obj;
        Object.assign(this, {
            name,
            alias,
            pubkeyhash,
            privatekey,
            scripthash,
            xpubkey,
            xprivkey,
            networkMagic,
            port,
            dnsSeeds
        });
    }
    static get(arg, keys) {
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
        return networkMaps[arg.toString()];
    }
    static addNetwork(data) {
        var network = new Network();
        js_1.JSUtil.defineImmutable(network, {
            name: data.name,
            alias: data.alias,
            pubkeyhash: data.pubkeyhash,
            privatekey: data.privatekey,
            scripthash: data.scripthash,
            xpubkey: data.xpubkey,
            xprivkey: data.xprivkey,
            zaddr: data.zaddr,
            zkey: data.zkey
        });
        if (data.networkMagic) {
            js_1.JSUtil.defineImmutable(network, {
                networkMagic: buffer_1.BufferUtil.integerAsBuffer(data.networkMagic)
            });
        }
        if (data.port) {
            js_1.JSUtil.defineImmutable(network, {
                port: data.port
            });
        }
        if (data.dnsSeeds) {
            js_1.JSUtil.defineImmutable(network, {
                dnsSeeds: data.dnsSeeds
            });
        }
        _.each(network, function (value) {
            if (!_.isUndefined(value) && !_.isObject(value)) {
                networkMaps[value] = network;
            }
        });
        networks.push(network);
        return network;
    }
    static removeNetwork(network) {
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
exports.Network = Network;
Network.defaultNetwork = Network.get('livenet');
Network.livenet = Network.get('livenet');
Network.testnet = Network.get('testnet');
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
});
//# sourceMappingURL=networks.js.map