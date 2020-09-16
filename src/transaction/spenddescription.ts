import * as _ from 'lodash';
import $ from '../util/preconditions';
import { BitcoreBN } from '../crypto/bn';
import { Buffer } from 'buffer';
import { BufferUtil } from '../util/buffer';
import { JSUtil } from '../util/js';
import { BufferWriter } from '../encoding/bufferwriter';
import { BufferReader } from '../encoding/bufferreader';

export namespace SpendDescription {
    export interface SpendDescriptionObj {
        cv: Buffer;
        anchor: Buffer;
        nullifier: Buffer;
        rk: Buffer;
        proof: Buffer;
        spendAuthSig: Buffer;
    }
}

export class SpendDescription {
    public cv: Buffer;
    public anchor: Buffer;
    public nullifier: Buffer;
    public rk: Buffer;
    public proof: Buffer;
    public spendAuthSig: Buffer;
    constructor(params?) {
        if (!(this instanceof SpendDescription)) {
            return new SpendDescription(params);
        }
        if (params) {
            return this._fromObject(params);
        }
    }
    public static fromObject = function (obj) {
        $.checkArgument(_.isObject(obj));
        var spenddesc = new SpendDescription();
        return spenddesc._fromObject(obj);
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
        var obj = new SpendDescription();
        obj.cv = br.read(32);
        obj.anchor = br.read(32);
        obj.nullifier = br.read(32);
        obj.rk = br.read(32);
        obj.proof = br.read(48 + 96 + 48);
        obj.spendAuthSig = br.read(64);
        return obj;
    };
    public toBufferWriter = function (writer) {
        var i;
        if (!writer) {
            writer = new BufferWriter();
        }
        writer.write(this.cv);
        writer.write(this.anchor);
        writer.write(this.nullifier);
        writer.write(this.rk);
        writer.write(this.proof);
        writer.write(this.spendAuthSig);
        return writer;
    };
}
