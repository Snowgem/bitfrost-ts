import * as _ from 'lodash';
import $ from './util/preconditions';
import { Address, Network, PublicKey } from '.';
import { Base58Check } from './encoding';
import { Random, Point, BitcoreBN } from './crypto';
import { JSUtil } from './util';
/**
 * Instantiate a PrivateKey from a BN, Buffer and WIF.
 *
 * @example
 * ```javascript
 * // generate a new random key
 * var key = PrivateKey();
 *
 * // get the associated address
 * var address = key.toAddress();
 *
 * // encode into wallet export format
 * var exported = key.toWIF();
 *
 * // instantiate from the exported (and saved) private key
 * var imported = PrivateKey.fromWIF(exported);
 * ```
 *
 * @param {string} data - The encoded data in various formats
 * @param {Network|string=} network - a {@link Network} object, or a string with the network name
 * @returns {PrivateKey} A new valid instance of an PrivateKey
 * @constructor
 */

declare namespace PrivateKey {
    export interface PrivateKeyObj {
        compressed: boolean;
        network: Network;
        bn: BitcoreBN;
    }
    export type DataType =
        | PrivateKey
        | PrivateKey.PrivateKeyObj
        | BitcoreBN
        | Buffer
        | string;
}

export class PrivateKey {
    public compressed: boolean;
    public network: Network;
    public bn: BitcoreBN;

    constructor(
        data?: PrivateKey.DataType,
        network?: Network | string
    ) {
        /* jshint maxstatements: 20 */
        /* jshint maxcomplexity: 8 */
        if (!(this instanceof PrivateKey)) {
            return new PrivateKey(data, network);
        }
        if (data instanceof PrivateKey) {
            return data;
        }
        var info = this._classifyArguments(data, network);
        // validation
        if (!info.bn || info.bn.cmp(new BitcoreBN(0)) === 0) {
            throw new TypeError('Number can not be equal to zero, undefined, null or false');
        }
        if (!info.bn.lt(Point.getN())) {
            throw new TypeError('Number must be less than N');
        }
        if (typeof (info.network) === 'undefined') {
            throw new TypeError('Must specify the network ("livenet" or "testnet")');
        }
        JSUtil.defineImmutable(this, {
            bn: info.bn,
            compressed: info.compressed,
            network: info.network
        });
        return this;
    }

    public get publicKey() {
        return this.toPublicKey();
    };
    /**
     * Internal helper to instantiate PrivateKey internal `info` object from
     * different kinds of arguments passed to the constructor.
     *
     * @param {*} data
     * @param {Network|string=} network - a {@link Network} object, or a string with the network name
     * @return {Object}
     */
    public _classifyArguments = function (data, network) {
        /* jshint maxcomplexity: 10 */
        let info: Partial<PrivateKey.PrivateKeyObj> = {
            compressed: true,
            network: network ? Network.get(network) : Network.defaultNetwork
        };
        // detect type of data
        if (_.isUndefined(data) || _.isNull(data)) {
            info.bn = PrivateKey._getRandomBN();
        }
        else if (data instanceof BitcoreBN) {
            info.bn = data as BitcoreBN;
        }
        else if (data instanceof Buffer || data instanceof Uint8Array) {
            info = PrivateKey._transformBuffer(data, network);
        }
        else if (data.bn && data.network) {
            info = PrivateKey._transformObject(data);
        }
        else if (!network && Network.get(data)) {
            info.bn = PrivateKey._getRandomBN();
            info.network = Network.get(data);
        }
        else if (typeof (data) === 'string') {
            if (JSUtil.isHexa(data)) {
                info.bn = new BitcoreBN(new Buffer(data, 'hex'));
            }
            else {
                info = PrivateKey._transformWIF(data, network);
            }
        }
        else {
            throw new TypeError('First argument is an unrecognized data type.');
        }
        return info;
    };
    /**
     * Internal function to get a random Big Number (BN)
     *
     * @returns {BN} A new randomly generated BN
     * @private
     */
    public static _getRandomBN = function () {
        var condition;
        var bn;
        do {
            var privbuf = Random.getRandomBuffer(32);
            bn = BitcoreBN.fromBuffer(privbuf);
            condition = bn.lt(Point.getN());
        } while (!condition);
        return bn;
    };
    /**
     * Internal function to transform a WIF Buffer into a private key
     *
     * @param {Buffer} buf - An WIF string
     * @param {Network|string=} network - a {@link Network} object, or a string with the network name
     * @returns {Object} An object with keys: bn, network and compressed
     * @private
     */
    public static _transformBuffer = function (buf, network) {
        const info: Partial<PrivateKey.PrivateKeyObj> = {};
        if (buf.length === 32) {
            return PrivateKey._transformBNBuffer(buf, network);
        }
        info.network = Network.get(buf[0], 'privatekey');
        if (!info.network) {
            throw new Error('Invalid network');
        }
        if (network && info.network !== Network.get(network)) {
            throw new TypeError('Private key network mismatch');
        }
        if (buf.length === 1 + 32 + 1 && buf[1 + 32 + 1 - 1] === 1) {
            info.compressed = true;
        }
        else if (buf.length === 1 + 32) {
            info.compressed = false;
        }
        else {
            throw new Error('Length of buffer must be 33 (uncompressed) or 34 (compressed)');
        }
        info.bn = BitcoreBN.fromBuffer(buf.slice(1, 32 + 1));
        return info;
    };
    /**
     * Internal function to transform a BN buffer into a private key
     *
     * @param {Buffer} buf
     * @param {Network|string=} network - a {@link Network} object, or a string with the network name
     * @returns {object} an Object with keys: bn, network, and compressed
     * @private
     */
    public static _transformBNBuffer = function (buf, network) {
        const info: Partial<PrivateKey.PrivateKeyObj> = {};
        info.network = Network.get(network) || Network.defaultNetwork;
        info.bn = BitcoreBN.fromBuffer(buf);
        info.compressed = false;
        return info;
    };
    /**
     * Internal function to transform a WIF string into a private key
     *
     * @param {string} buf - An WIF string
     * @returns {Object} An object with keys: bn, network and compressed
     * @private
     */
    public static _transformWIF = function (str, network) {
        return PrivateKey._transformBuffer(Base58Check.decode(str), network);
    };
    /**
     * Instantiate a PrivateKey from a Buffer with the DER or WIF representation
     *
     * @param {Buffer} arg
     * @param {Network} network
     * @return {PrivateKey}
     */
    public static fromBuffer = function (arg, network) {
        return new PrivateKey(arg, network);
    };
    /**
     * Internal function to transform a JSON string on plain object into a private key
     * return this.
     *
     * @param {string} json - A JSON string or plain object
     * @returns {Object} An object with keys: bn, network and compressed
     * @private
     */
    public static _transformObject = function (json) {
        var bn = new BitcoreBN(json.bn, 'hex');
        var network = Network.get(json.network);
        return {
            bn: bn,
            network: network,
            compressed: json.compressed
        };
    };
    /**
     * Instantiate a PrivateKey from a WIF string
     *
     * @param {string} str - The WIF encoded private key string
     * @returns {PrivateKey} A new valid instance of PrivateKey
     */
    public static fromString = function (str) {
        $.checkArgument(_.isString(str), 'First argument is expected to be a string.');
        return new PrivateKey(str);
    };

    public static fromWIF = PrivateKey.fromString;
    /**
     * Instantiate a PrivateKey from a plain JavaScript object
     *
     * @param {Object} obj - The output from privateKey.toObject()
     */
    public static fromObject = function (obj) {
        $.checkArgument(_.isObject(obj), 'First argument is expected to be an object.');
        return new PrivateKey(obj);
    };
    /**
     * Instantiate a PrivateKey from random bytes
     *
     * @param {string=} network - Either "livenet" or "testnet"
     * @returns {PrivateKey} A new valid instance of PrivateKey
     */
    public static fromRandom = function (network) {
        var bn = PrivateKey._getRandomBN();
        return new PrivateKey(bn, network);
    };
    /**
     * Check if there would be any errors when initializing a PrivateKey
     *
     * @param {string} data - The encoded data in various formats
     * @param {string=} network - Either "livenet" or "testnet"
     * @returns {null|Error} An error if exists
     */
    public static getValidationError = function (data, network) {
        var error;
        try {
            /* jshint nonew: false */
            new PrivateKey(data, network);
        }
        catch (e) {
            error = e;
        }
        return error;
    };
    /**
     * Check if the parameters are valid
     *
     * @param {string} data - The encoded data in various formats
     * @param {string=} network - Either "livenet" or "testnet"
     * @returns {Boolean} If the private key is would be valid
     */
    public static isValid(data?: PrivateKey.DataType, network?: Network) {
        if (!data) {
            return false;
        }
        return !PrivateKey.getValidationError(data, network);
    };
    /**
     * Will output the PrivateKey encoded as hex string
     *
     * @returns {string}
     */
    public toString = function () {
        return this.toBuffer().toString('hex');
    };
    /**
     * Will output the PrivateKey to a WIF string
     *
     * @returns {string} A WIP representation of the private key
     */
    public toWIF = function () {
        var network = this.network;
        var compressed = this.compressed;
        var buf;
        if (compressed) {
            buf = Buffer.concat([new Buffer([network.privatekey]),
            this.bn.toBuffer({ size: 32 }),
            new Buffer([0x01])]);
        }
        else {
            buf = Buffer.concat([new Buffer([network.privatekey]),
            this.bn.toBuffer({ size: 32 })]);
        }
        return Base58Check.encode(buf);
    };
    /**
     * Will return the private key as a BN instance
     *
     * @returns {BN} A BN instance of the private key
     */
    public toBigNumber = function () {
        return this.bn;
    };
    /**
     * Will return the private key as a BN buffer
     *
     * @returns {Buffer} A buffer of the private key
     */
    public toBuffer = function () {
        // TODO: use `return this.bn.toBuffer({ size: 32 })` in v1.0.0
        return this.bn.toBuffer();
    };
    /**
     * WARNING: This method will not be officially supported until v1.0.0.
     *
     *
     * Will return the private key as a BN buffer without leading zero padding
     *
     * @returns {Buffer} A buffer of the private key
     */
    public toBufferNoPadding = function () {
        return this.bn.toBuffer();
    };
    /**
     * Will return the corresponding public key
     *
     * @returns {PublicKey} A public key generated from the private key
     */
    public toPublicKey = function () {
        if (!this._pubkey) {
            this._pubkey = PublicKey.fromPrivateKey(this);
        }
        return this._pubkey;
    };
    /**
     * Will return an address for the private key
     * @param {Network=} network - optional parameter specifying
     * the desired network for the address
     *
     * @returns {Address} An address generated from the private key
     */
    public toAddress = function (network) {
        var pubkey = this.toPublicKey();
        return Address.fromPublicKey(pubkey, network || this.network);
    };
    /**
     * @returns {Object} A plain object representation
     */
    public toObject = function toObject() {
        return {
            bn: this.bn.toString('hex'),
            compressed: this.compressed,
            network: this.network.toString()
        };
    };
    public toJSON = this.toObject;
    /**
     * Will return a string formatted for the console
     *
     * @returns {string} Private key
     */
    public inspect = function () {
        var uncompressed = !this.compressed ? ', uncompressed' : '';
        return '<PrivateKey: ' + this.toString() + ', network: ' + this.network + uncompressed + '>';
    };
}
