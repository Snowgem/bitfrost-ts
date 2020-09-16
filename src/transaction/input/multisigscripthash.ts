'use strict';

/* jshint maxparams:5 */

import * as _ from 'lodash';
import { Input, InputTypes } from './input';
import { Output } from '../output';
import $ from '../../util/preconditions';

import { Script } from '../../script';
import { Signature } from '../../crypto/signature';
import { sighash, Sighash } from '../sighash';
import { BufferWriter } from '../../encoding/bufferwriter';
import { BufferUtil } from '../../util/buffer';
import { TransactionSignature } from '../signature';
import { PublicKey } from '../../publickey';
import { Transaction } from '../transaction';
import { PrivateKey } from '../../privatekey';
import { JSUtil } from '../../util/js';
import { Hash } from '../../crypto/hash';

/**
 * @constructor
 */
export class MultiSigScriptHashInput extends Input {
  public static OPCODES_SIZE = 7; // serialized size (<=3) + 0 .. N .. M OP_CHECKMULTISIG
  public static SIGNATURE_SIZE = 74; // size (1) + DER (<=72) + sighash (1)
  public static PUBKEY_SIZE = 34; // size (1) + DER (<=33)

  public nestedWitness: boolean;
  public publicKeys: Array<PublicKey>;
  public redeemScript: Script;
  public output: Output;
  public threshold: number;
  public signatures: Array<TransactionSignature>;
  public publicKeyIndex = {};

  constructor(
    input: MultiSigScriptHashInput | InputTypes.InputObj,
    pubkeys?: Array<PublicKey>,
    threshold?: number,
    signatures?: Array<Signature | Signature.PostSignature>,
    nestedWitness?: boolean
  ) {
    super();
    pubkeys = pubkeys || (input as MultiSigScriptHashInput).publicKeys;
    threshold = threshold || (input as MultiSigScriptHashInput).threshold;
    const inputSignatures =
      signatures || (input as MultiSigScriptHashInput).signatures;
    this.nestedWitness = nestedWitness ? true : false;
    this.publicKeys = _.sortBy(pubkeys, publicKey => {
      return publicKey.toString();
    });
    this.redeemScript = Script.buildMultisigOut(this.publicKeys, threshold);
    if (this.nestedWitness) {
      const nested = Script.buildWitnessMultisigOutFromScript(
        this.redeemScript
      );
      $.checkState(
        Script.buildScriptHashOut(nested).equals(this.output.script),
        "Provided public keys don't hash to the provided output (nested witness)"
      );
      const scriptSig = new Script();
      scriptSig.add(nested.toBuffer());
      this.setScript(scriptSig);
    } else {
      $.checkState(
        Script.buildScriptHashOut(this.redeemScript).equals(this.output.script),
        "Provided public keys don't hash to the provided output"
      );
    }

    _.each(this.publicKeys, (publicKey, index) => {
      this.publicKeyIndex[publicKey.toString()] = index;
    });
    this.threshold = threshold;
    // Empty array of signatures
    this.signatures = inputSignatures
      ? this._deserializeSignatures(signatures)
      : new Array(this.publicKeys.length);
  }

  public toObject() {
    const obj = Input.prototype.toObject.apply(this, arguments);
    obj.threshold = this.threshold;
    obj.publicKeys = _.map(this.publicKeys, publicKey => {
      return publicKey.toString();
    });
    obj.signatures = this._serializeSignatures();
    return obj;
  }

  public _deserializeSignatures(signatures) {
    return _.map(signatures, signature => {
      if (!signature) {
        return undefined;
      }
      return new TransactionSignature(signature);
    });
  }

  public _serializeSignatures() {
    return _.map(this.signatures, signature => {
      if (!signature) {
        return undefined;
      }
      return signature.toObject();
    });
  }

  public getScriptCode() {
    const writer = new BufferWriter();
    if (!this.redeemScript.hasCodeseparators()) {
      const redeemScriptBuffer = this.redeemScript.toBuffer();
      writer.writeVarintNum(redeemScriptBuffer.length);
      writer.write(redeemScriptBuffer);
    } else {
      throw new Error('@TODO');
    }
    return writer.toBuffer();
  }

  public getSignatures(
    transaction: Transaction,
    privateKey: PrivateKey,
    index: number,
    sigtype: number = Signature.SIGHASH_ALL,
  ): Array<TransactionSignature>{
    $.checkState(
        this.output instanceof Output,
        'output property should be an Output'
      );
        sigtype = sigtype || Signature.SIGHASH_ALL;
      
        var self = this;
        var results = [];
        _.each(this.publicKeys, function(publicKey) {
          if (publicKey.toString() === privateKey.publicKey.toString()) {
            results.push(new TransactionSignature({
              publicKey: privateKey.publicKey,
              prevTxId: self.prevTxId,
              outputIndex: self.outputIndex,
              inputIndex: index,
              signature: Sighash.sign(transaction, privateKey, sigtype, index, self.redeemScript),
              sigtype: sigtype
            }));
          }
        });
        return results;
      };

  public addSignature(
    transaction: Transaction,
    signature: TransactionSignature
  ) {
    $.checkState(!this.isFullySigned(), 'All needed signatures have already been added');
    $.checkArgument(!_.isUndefined(this.publicKeyIndex[signature.publicKey.toString()]),
                    'Signature has no matching public key');
    $.checkState(this.isValidSignature(transaction, signature), 'Signature must be valid');
    this.signatures[this.publicKeyIndex[signature.publicKey.toString()]] = signature;
    this._updateScript();
    return this;
  }

  public _updateScript() {
    this.setScript(Script.buildP2SHMultisigIn(
        this.publicKeys,
        this.threshold,
        this._createSignatures(),
        { cachedMultisig: this.redeemScript }
      ));
      return this;
  }

  public _createSignatures() {
    return _.map(
      _.filter(this.signatures, signature => {
        return !_.isUndefined(signature);
      }),
      signature => {
        return BufferUtil.concat([
          signature.signature.toDER(),
          BufferUtil.integerAsSingleByteBuffer(signature.sigtype)
        ]);
      }
    );
  }

  public clearSignatures() {
    this.signatures = new Array(this.publicKeys.length);
    this._updateScript();
  }

  public isFullySigned() {
    return this.countSignatures() === this.threshold;
  }

  public countMissingSignatures() {
    return this.threshold - this.countSignatures();
  }

  public countSignatures() {
    return _.reduce(
      this.signatures,
      (sum, signature) => {
        return sum + JSUtil.booleanToNumber(!!signature);
      },
      0
    );
  }

  public publicKeysWithoutSignature() {
    return _.filter(this.publicKeys, publicKey => {
      return !this.signatures[this.publicKeyIndex[publicKey.toString()]];
    });
  }

  public isValidSignature(
    transaction: Transaction,
    signature: Partial<TransactionSignature>
  ) {
    signature.signature.nhashtype = signature.sigtype;
    return Sighash.verify(
        transaction,
        signature.signature,
        signature.publicKey,
        signature.inputIndex,
        this.redeemScript
    );
  }

  public _estimateSize() {
    return (
      MultiSigScriptHashInput.OPCODES_SIZE +
      this.threshold * MultiSigScriptHashInput.SIGNATURE_SIZE +
      this.publicKeys.length * MultiSigScriptHashInput.PUBKEY_SIZE
    );
  }
}
