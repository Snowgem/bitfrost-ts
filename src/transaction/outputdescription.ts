import * as _ from 'lodash';
import $ from '../util/preconditions';
import { BitcoreBN } from '../crypto/bn';
import { Buffer } from 'buffer';
import { BufferUtil } from '../util/buffer';
import { JSUtil } from '../util/js';
import { BufferWriter } from '../encoding/bufferwriter';
import { BufferReader } from '../encoding/bufferreader';
// Sapling note magic values, copied from src/zcash/Zcash.h
const NOTEENCRYPTION_AUTH_BYTES = 16;
const ZC_NOTEPLAINTEXT_LEADING = 1;
const ZC_V_SIZE = 8;
const ZC_RHO_SIZE = 32;
const ZC_R_SIZE = 32;
const ZC_MEMO_SIZE = 512;
const ZC_DIVERSIFIER_SIZE = 11;
const ZC_JUBJUB_POINT_SIZE = 32;
const ZC_JUBJUB_SCALAR_SIZE = 32;
const ZC_NOTEPLAINTEXT_SIZE = ZC_NOTEPLAINTEXT_LEADING + ZC_V_SIZE + ZC_RHO_SIZE + ZC_R_SIZE + ZC_MEMO_SIZE;
const ZC_SAPLING_ENCPLAINTEXT_SIZE = ZC_NOTEPLAINTEXT_LEADING + ZC_DIVERSIFIER_SIZE + ZC_V_SIZE + ZC_R_SIZE + ZC_MEMO_SIZE;
const ZC_SAPLING_OUTPLAINTEXT_SIZE = ZC_JUBJUB_POINT_SIZE + ZC_JUBJUB_SCALAR_SIZE;
const ZC_SAPLING_ENCCIPHERTEXT_SIZE = ZC_SAPLING_ENCPLAINTEXT_SIZE + NOTEENCRYPTION_AUTH_BYTES;
const ZC_SAPLING_OUTCIPHERTEXT_SIZE = ZC_SAPLING_OUTPLAINTEXT_SIZE + NOTEENCRYPTION_AUTH_BYTES;

export namespace OutputDescription {
    export interface OutputDescriptionObj {
        cv: Buffer;
        cmu: Buffer;
        ephemeralKey: Buffer;
        encCipherText: Buffer;
        outCipherText: Buffer;
        proof: Buffer;
    }
}

export class OutputDescription {
    public cv: Buffer;
    public cmu: Buffer;
    public ephemeralKey: Buffer;
    public encCipherText: Buffer;
    public outCipherText: Buffer;
    public proof: Buffer;

    constructor(params?) {
        if (!(this instanceof OutputDescription)) {
            return new OutputDescription(params);
        }
        if (params) {
            return this._fromObject(params);
        }
    }
    public static fromObject = function (obj) {
        $.checkArgument(_.isObject(obj));
        var outputdesc = new OutputDescription();
        return outputdesc._fromObject(obj);
    };
    public _fromObject = function (params) {
        // TODO: Populate from parameters, but for now it's ok to do nothing.
        return this;
    };
    public toObject = function toObject() {
        // TODO: Populate JSON object, but for now it's ok to return a placeholder.
        var obj = {};
        return obj;
    };

    public toJSON = this.toObject;
    public static fromBufferReader = function (br) {
        var obj = new OutputDescription();
        obj.cv = br.read(32);
        obj.cmu = br.read(32);
        obj.ephemeralKey = br.read(32);
        obj.encCipherText = br.read(ZC_SAPLING_ENCCIPHERTEXT_SIZE);
        obj.outCipherText = br.read(ZC_SAPLING_OUTCIPHERTEXT_SIZE);
        obj.proof = br.read(48 + 96 + 48);
        return obj;
    };
    public toBufferWriter = function (writer) {
        var i;
        if (!writer) {
            writer = new BufferWriter();
        }
        writer.write(this.cv);
        writer.write(this.cmu);
        writer.write(this.ephemeralKey);
        writer.write(this.encCipherText);
        writer.write(this.outCipherText);
        writer.write(this.proof);
        return writer;
    };
}
