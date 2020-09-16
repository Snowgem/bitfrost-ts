import * as _ from 'lodash';
import $ from '../util/preconditions';
import { BitcoreBN } from '../crypto/bn';
import { Buffer } from 'buffer';
import { BufferUtil } from '../util/buffer';
import { JSUtil } from '../util/js';
import { BufferWriter } from '../encoding/bufferwriter';
import { BufferReader } from '../encoding/bufferreader';

export namespace JSDescription {
    export interface JSDescriptionObj {
        nullifiers: Array<Buffer>;
        commitments: Array<Buffer>;
        ciphertexts: Array<Buffer>;
        macs: Array<Buffer>;
    }
}
// TODO: Update ZCProof for Groth
//var ZCProof = require('../zcash/proof');
const ZC_NUM_JS_INPUTS = 2;
const ZC_NUM_JS_OUTPUTS = 2;
// leading + v + rho + r + memo + auth
const ZC_NOTECIPHERTEXT_SIZE = 1 + 8 + 32 + 32 + 512 + 16;

export class JSDescription {

    public nullifiers: Array<Buffer>;
    public commitments: Array<Buffer>;
    public ciphertexts: Array<Buffer>;
    public macs: Array<Buffer>;
    public _vpub_old;
    public _vpub_oldBN;
    public _vpub_new;
    public _vpub_newBN;

    public anchor: Buffer;
    public ephemeralKey: Buffer;
    public randomSeed: Buffer;
    public proof: Buffer;

    constructor(params?: JSDescription.JSDescriptionObj) {
        if (!(this instanceof JSDescription)) {
            return new JSDescription(params);
        }
        this.nullifiers = [];
        this.commitments = [];
        this.ciphertexts = [];
        this.macs = [];
        this._vpub_old = null;
        if (params) {
            return this._fromObject(params);
        }
    }

    public get vpub_old() {
        return this._vpub_old;
    }

    public setVpubOld(num) {
        if (num instanceof BitcoreBN) {
            this._vpub_oldBN = num;
            this._vpub_old = num.toNumber();
        }
        else if (_.isString(num)) {
            this._vpub_old = parseInt(num);
            this._vpub_oldBN = BitcoreBN.fromNumber(this._vpub_old);
        }
        else {
            $.checkArgument(JSUtil.isNaturalNumber(num), 'vpub_old is not a natural number');
            this._vpub_oldBN = BitcoreBN.fromNumber(num);
            this._vpub_old = num;
        }
        $.checkState(JSUtil.isNaturalNumber(this._vpub_old), 'vpub_old is not a natural number');
    }

    public get vpub_new() {
        return this._vpub_new;
    }

    public setVpubNew(num) {
        if (num instanceof BitcoreBN) {
            this._vpub_newBN = num;
            this._vpub_new = num.toNumber();
        }
        else if (_.isString(num)) {
            this._vpub_new = parseInt(num);
            this._vpub_newBN = BitcoreBN.fromNumber(this._vpub_new);
        }
        else {
            $.checkArgument(JSUtil.isNaturalNumber(num), 'vpub_new is not a natural number');
            this._vpub_newBN = BitcoreBN.fromNumber(num);
            this._vpub_new = num;
        }
        $.checkState(JSUtil.isNaturalNumber(this._vpub_new), 'vpub_new is not a natural number');
    }

    public static fromObject(obj) {
        $.checkArgument(_.isObject(obj));
        var jsdesc = new JSDescription();
        return jsdesc._fromObject(obj);
    };
    public _fromObject(params) {
        var nullifiers = [];
        _.each(params.nullifiers, function (nullifier) {
            nullifiers.push(BufferUtil.reverse(new Buffer(nullifier, 'hex')));
        });
        var commitments = [];
        _.each(params.commitments, function (commitment) {
            commitments.push(BufferUtil.reverse(new Buffer(commitment, 'hex')));
        });
        var ciphertexts = [];
        _.each(params.ciphertexts, function (ciphertext) {
            ciphertexts.push(new Buffer(ciphertext, 'hex'));
        });
        var macs = [];
        _.each(params.macs, function (mac) {
            macs.push(BufferUtil.reverse(new Buffer(mac, 'hex')));
        });
        this.setVpubOld(params.vpub_old);
        this.setVpubNew(params.vpub_new);
        this.anchor = BufferUtil.reverse(new Buffer(params.anchor, 'hex'));
        this.nullifiers = nullifiers;
        this.commitments = commitments;
        this.ephemeralKey = BufferUtil.reverse(new Buffer(params.ephemeralKey, 'hex'));
        this.ciphertexts = ciphertexts;
        this.randomSeed = BufferUtil.reverse(new Buffer(params.randomSeed, 'hex'));
        this.macs = macs;
        this.proof = params.proof; // TODO: Update ZCProof for Groth: ZCProof.fromObject(params.proof);
        return this;
    };
    public toObject() {
        var nullifiers = [];
        _.each(this.nullifiers, function (nullifier) {
            nullifiers.push(BufferUtil.reverse(nullifier).toString('hex'));
        });
        var commitments = [];
        _.each(this.commitments, function (commitment) {
            commitments.push(BufferUtil.reverse(commitment).toString('hex'));
        });
        var ciphertexts = [];
        _.each(this.ciphertexts, function (ciphertext) {
            ciphertexts.push(ciphertext.toString('hex'));
        });
        var macs = [];
        _.each(this.macs, function (mac) {
            macs.push(BufferUtil.reverse(mac).toString('hex'));
        });
        var obj = {
            vpub_old: this.vpub_old,
            vpub_new: this.vpub_new,
            anchor: BufferUtil.reverse(this.anchor).toString('hex'),
            nullifiers: nullifiers,
            commitments: commitments,
            ephemeralKey: BufferUtil.reverse(this.ephemeralKey).toString('hex'),
            ciphertexts: ciphertexts,
            randomSeed: BufferUtil.reverse(this.randomSeed).toString('hex'),
            macs: macs,
            proof: this.proof,
        };
        return obj;
    };

    public toJSON = this.toObject;
    public static fromBufferReader(br: BufferReader, useGrothFlagParam) {
        var i;
        var jsdesc = new JSDescription();
        jsdesc.setVpubOld(br.readUInt64LEBN());
        jsdesc.setVpubNew(br.readUInt64LEBN());
        jsdesc.anchor = br.read(32);
        for (i = 0; i < ZC_NUM_JS_INPUTS; i++) {
            jsdesc.nullifiers.push(br.read(32));
        }
        for (i = 0; i < ZC_NUM_JS_OUTPUTS; i++) {
            jsdesc.commitments.push(br.read(32));
        }
        jsdesc.ephemeralKey = br.read(32);
        jsdesc.randomSeed = br.read(32);
        for (i = 0; i < ZC_NUM_JS_INPUTS; i++) {
            jsdesc.macs.push(br.read(32));
        }
        // Default parameter requires ECMASCript 6 which might not be available, so use workaround.
        var useGrothFlag = useGrothFlagParam || false;
        if (!useGrothFlag) {
            jsdesc.proof = br.read(296); // TODO: Update ZCProof for Groth: ZCProof.fromBufferReader(br);
        }
        else {
            jsdesc.proof = br.read(48 + 96 + 48);
        }
        for (i = 0; i < ZC_NUM_JS_OUTPUTS; i++) {
            jsdesc.ciphertexts.push(br.read(ZC_NOTECIPHERTEXT_SIZE));
        }
        return jsdesc;
    };
    public toBufferWriter(writer) {
        var i;
        if (!writer) {
            writer = new BufferWriter();
        }
        writer.writeUInt64LEBN(this._vpub_oldBN);
        writer.writeUInt64LEBN(this._vpub_newBN);
        writer.write(this.anchor);
        for (i = 0; i < ZC_NUM_JS_INPUTS; i++) {
            writer.write(this.nullifiers[i]);
        }
        for (i = 0; i < ZC_NUM_JS_OUTPUTS; i++) {
            writer.write(this.commitments[i]);
        }
        writer.write(this.ephemeralKey);
        writer.write(this.randomSeed);
        for (i = 0; i < ZC_NUM_JS_INPUTS; i++) {
            writer.write(this.macs[i]);
        }
        // TODO: Update ZCProof for Groth: this.proof.toBufferWriter(writer);
        writer.write(this.proof);
        for (i = 0; i < ZC_NUM_JS_OUTPUTS; i++) {
            writer.write(this.ciphertexts[i]);
        }
        return writer;
    };
}
