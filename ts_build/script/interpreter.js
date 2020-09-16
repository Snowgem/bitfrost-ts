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
exports.Interpreter = void 0;
const signature_1 = require("../crypto/signature");
const _ = __importStar(require("lodash"));
const script_1 = require("./script");
const opcode_1 = require("../opcode");
const crypto_1 = require("../crypto");
const publickey_1 = require("../publickey");
const transaction_1 = require("../transaction");
class Interpreter {
    constructor(obj) {
        if (!(this instanceof Interpreter)) {
            return new Interpreter(obj);
        }
        if (obj) {
            this.initialize();
            this.set(obj);
        }
        else {
            this.initialize();
        }
    }
    verifyWitnessProgram(version, program, witness, satoshis, flags) {
        let scriptPubKey = new script_1.Script();
        let stack = [];
        if (version === 0) {
            if (program.length === 32) {
                if (witness.length === 0) {
                    this.errstr = 'SCRIPT_ERR_WITNESS_PROGRAM_WITNESS_EMPTY';
                    return false;
                }
                const scriptPubKeyBuffer = witness[witness.length - 1];
                scriptPubKey = new script_1.Script(scriptPubKeyBuffer);
                const hash = crypto_1.Hash.sha256(scriptPubKeyBuffer);
                if (hash.toString('hex') !== program.toString('hex')) {
                    this.errstr = 'SCRIPT_ERR_WITNESS_PROGRAM_MISMATCH';
                    return false;
                }
                stack = witness.slice(0, -1);
            }
            else if (program.length === 20) {
                if (witness.length !== 2) {
                    this.errstr = 'SCRIPT_ERR_WITNESS_PROGRAM_MISMATCH';
                    return false;
                }
                scriptPubKey.add(opcode_1.OP_CODES.OP_DUP);
                scriptPubKey.add(opcode_1.OP_CODES.OP_HASH160);
                scriptPubKey.add(program);
                scriptPubKey.add(opcode_1.OP_CODES.OP_EQUALVERIFY);
                scriptPubKey.add(opcode_1.OP_CODES.OP_CHECKSIG);
                stack = witness;
            }
            else {
                this.errstr = 'SCRIPT_ERR_WITNESS_PROGRAM_WRONG_LENGTH';
                return false;
            }
        }
        else if (flags & Interpreter.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_WITNESS_PROGRAM) {
            this.errstr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_WITNESS_PROGRAM';
            return false;
        }
        else {
            return true;
        }
        this.initialize();
        this.set({
            script: scriptPubKey,
            stack,
            sigversion: 1,
            satoshis
        });
        if (!this.evaluate()) {
            return false;
        }
        if (this.stack.length !== 1) {
            this.errstr = 'SCRIPT_ERR_EVAL_FALSE';
            return false;
        }
        const buf = this.stack[this.stack.length - 1];
        if (!Interpreter.castToBool(buf)) {
            this.errstr = 'SCRIPT_ERR_EVAL_FALSE_IN_STACK';
            return false;
        }
        return true;
    }
    verify(scriptSig, scriptPubkey, tx, nin, flags, witness, satoshis) {
        if (_.isUndefined(tx)) {
            tx = new transaction_1.Transaction();
        }
        if (_.isUndefined(nin)) {
            nin = 0;
        }
        if (_.isUndefined(flags)) {
            flags = 0;
        }
        if (_.isUndefined(witness)) {
            witness = null;
        }
        if (_.isUndefined(satoshis)) {
            satoshis = 0;
        }
        this.set({
            script: scriptSig,
            tx,
            nin,
            sigversion: 0,
            satoshis: 0,
            flags
        });
        let stackCopy;
        if ((flags & Interpreter.SCRIPT_VERIFY_SIGPUSHONLY) !== 0 &&
            !scriptSig.isPushOnly()) {
            this.errstr = 'SCRIPT_ERR_SIG_PUSHONLY';
            return false;
        }
        if (!this.evaluate()) {
            return false;
        }
        if (flags & Interpreter.SCRIPT_VERIFY_P2SH) {
            stackCopy = this.stack.slice();
        }
        let stack = this.stack;
        this.initialize();
        this.set({
            script: scriptPubkey,
            stack,
            tx,
            nin,
            flags
        });
        if (!this.evaluate()) {
            return false;
        }
        if (this.stack.length === 0) {
            this.errstr = 'SCRIPT_ERR_EVAL_FALSE_NO_RESULT';
            return false;
        }
        const buf = this.stack[this.stack.length - 1];
        if (!Interpreter.castToBool(buf)) {
            this.errstr = 'SCRIPT_ERR_EVAL_FALSE_IN_STACK';
            return false;
        }
        let hadWitness = false;
        if (flags & Interpreter.SCRIPT_VERIFY_WITNESS) {
            const witnessValues = {};
            if (scriptPubkey.isWitnessProgram(witnessValues)) {
                hadWitness = true;
                if (scriptSig.toBuffer().length !== 0) {
                    return false;
                }
                if (!this.verifyWitnessProgram(witnessValues.version, witnessValues.program, witness, satoshis, flags)) {
                    return false;
                }
            }
        }
        if (flags & Interpreter.SCRIPT_VERIFY_P2SH &&
            scriptPubkey.isScriptHashOut()) {
            if (!scriptSig.isPushOnly()) {
                this.errstr = 'SCRIPT_ERR_SIG_PUSHONLY';
                return false;
            }
            if (stackCopy.length === 0) {
                throw new Error('internal error - stack copy empty');
            }
            const redeemScriptSerialized = stackCopy[stackCopy.length - 1];
            const redeemScript = script_1.Script.fromBuffer(redeemScriptSerialized);
            stackCopy.pop();
            this.initialize();
            this.set({
                script: redeemScript,
                stack: stackCopy,
                tx,
                nin,
                flags
            });
            if (!this.evaluate()) {
                return false;
            }
            if (stackCopy.length === 0) {
                this.errstr = 'SCRIPT_ERR_EVAL_FALSE_NO_P2SH_STACK';
                return false;
            }
            if (!Interpreter.castToBool(stackCopy[stackCopy.length - 1])) {
                this.errstr = 'SCRIPT_ERR_EVAL_FALSE_IN_P2SH_STACK';
                return false;
            }
            if (flags & Interpreter.SCRIPT_VERIFY_WITNESS) {
                const p2shWitnessValues = {};
                if (redeemScript.isWitnessProgram(p2shWitnessValues)) {
                    hadWitness = true;
                    const redeemScriptPush = new script_1.Script();
                    redeemScriptPush.add(redeemScript.toBuffer());
                    if (scriptSig.toHex() !== redeemScriptPush.toHex()) {
                        this.errstr = 'SCRIPT_ERR_WITNESS_MALLEATED_P2SH';
                        return false;
                    }
                    if (!this.verifyWitnessProgram(p2shWitnessValues.version, p2shWitnessValues.program, witness, satoshis, flags)) {
                        return false;
                    }
                    stack = [stack[0]];
                }
            }
            if (flags & Interpreter.SCRIPT_VERIFY_WITNESS) {
                if (!hadWitness && witness.length > 0) {
                    this.errstr = 'SCRIPT_ERR_WITNESS_UNEXPECTED';
                    return false;
                }
            }
        }
        return true;
    }
    initialize() {
        this.stack = [];
        this.altstack = [];
        this.pc = 0;
        this.satoshis = 0;
        this.sigversion = 0;
        this.pbegincodehash = 0;
        this.nOpCount = 0;
        this.vfExec = [];
        this.errstr = '';
        this.flags = 0;
    }
    set(obj) {
        this.script = obj.script || this.script;
        this.tx = obj.tx || this.tx;
        this.nin = typeof obj.nin !== 'undefined' ? obj.nin : this.nin;
        this.stack = obj.stack || this.stack;
        this.altstack = obj.altack || this.altstack;
        this.pc = typeof obj.pc !== 'undefined' ? obj.pc : this.pc;
        this.pbegincodehash =
            typeof obj.pbegincodehash !== 'undefined'
                ? obj.pbegincodehash
                : this.pbegincodehash;
        this.sigversion =
            typeof obj.sigversion !== 'undefined' ? obj.sigversion : this.sigversion;
        this.satoshis =
            typeof obj.satoshis !== 'undefined' ? obj.satoshis : this.satoshis;
        this.nOpCount =
            typeof obj.nOpCount !== 'undefined' ? obj.nOpCount : this.nOpCount;
        this.vfExec = obj.vfExec || this.vfExec;
        this.errstr = obj.errstr || this.errstr;
        this.flags = typeof obj.flags !== 'undefined' ? obj.flags : this.flags;
    }
    static castToBool(buf) {
        for (let i = 0; i < buf.length; i++) {
            if (buf[i] !== 0) {
                if (i === buf.length - 1 && buf[i] === 0x80) {
                    return false;
                }
                return true;
            }
        }
        return false;
    }
    checkSignatureEncoding(buf) {
        let sig;
        if ((this.flags &
            (Interpreter.SCRIPT_VERIFY_DERSIG |
                Interpreter.SCRIPT_VERIFY_LOW_S |
                Interpreter.SCRIPT_VERIFY_STRICTENC)) !==
            0 &&
            !signature_1.Signature.isTxDER(buf)) {
            this.errstr = 'SCRIPT_ERR_SIG_DER_INVALID_FORMAT';
            return false;
        }
        else if ((this.flags & Interpreter.SCRIPT_VERIFY_LOW_S) !== 0) {
            sig = signature_1.Signature.fromTxFormat(buf);
            if (!sig.hasLowS()) {
                this.errstr = 'SCRIPT_ERR_SIG_DER_HIGH_S';
                return false;
            }
        }
        else if ((this.flags & Interpreter.SCRIPT_VERIFY_STRICTENC) !== 0) {
            sig = signature_1.Signature.fromTxFormat(buf);
            if (!sig.hasDefinedHashtype()) {
                this.errstr = 'SCRIPT_ERR_SIG_HASHTYPE';
                return false;
            }
        }
        return true;
    }
    checkPubkeyEncoding(buf) {
        if ((this.flags & Interpreter.SCRIPT_VERIFY_STRICTENC) !== 0 &&
            !publickey_1.PublicKey.isValid(buf)) {
            this.errstr = 'SCRIPT_ERR_PUBKEYTYPE';
            return false;
        }
        return true;
    }
    evaluate() {
        if (this.script.toBuffer().length > 10000) {
            this.errstr = 'SCRIPT_ERR_SCRIPT_SIZE';
            return false;
        }
        try {
            while (this.pc < this.script.chunks.length) {
                const fSuccess = this.step();
                if (!fSuccess) {
                    return false;
                }
            }
            if (this.stack.length + this.altstack.length > 1000) {
                this.errstr = 'SCRIPT_ERR_STACK_SIZE';
                return false;
            }
        }
        catch (e) {
            this.errstr = 'SCRIPT_ERR_UNKNOWN_ERROR: ' + e;
            return false;
        }
        if (this.vfExec.length > 0) {
            this.errstr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL';
            return false;
        }
        return true;
    }
    checkLockTime(nLockTime) {
        if (!((this.tx.nLockTime < Interpreter.LOCKTIME_THRESHOLD &&
            nLockTime.lt(Interpreter.LOCKTIME_THRESHOLD_BN)) ||
            (this.tx.nLockTime >= Interpreter.LOCKTIME_THRESHOLD &&
                nLockTime.gte(Interpreter.LOCKTIME_THRESHOLD_BN)))) {
            return false;
        }
        if (nLockTime.gt(new crypto_1.BitcoreBN(this.tx.nLockTime))) {
            return false;
        }
        if (!this.tx.inputs[this.nin].isFinal()) {
            return false;
        }
        return true;
    }
    step() {
        const fRequireMinimal = (this.flags & Interpreter.SCRIPT_VERIFY_MINIMALDATA) !== 0;
        const fExec = this.vfExec.indexOf(false) === -1;
        let buf;
        let buf1;
        let buf2;
        let spliced;
        let n;
        let x1;
        let x2;
        let bn;
        let bn1;
        let bn2;
        let bufSig;
        let bufPubkey;
        let subscript;
        let sig;
        let pubkey;
        let fValue;
        let fSuccess;
        const chunk = this.script.chunks[this.pc];
        this.pc++;
        const opcodenum = chunk.opcodenum;
        if (_.isUndefined(opcodenum)) {
            this.errstr = 'SCRIPT_ERR_UNDEFINED_OPCODE';
            return false;
        }
        if (chunk.buf && chunk.buf.length > Interpreter.MAX_SCRIPT_ELEMENT_SIZE) {
            this.errstr = 'SCRIPT_ERR_PUSH_SIZE';
            return false;
        }
        if (opcodenum > opcode_1.OP_CODES.OP_16 && ++this.nOpCount > 201) {
            this.errstr = 'SCRIPT_ERR_OP_COUNT';
            return false;
        }
        if (opcodenum === opcode_1.OP_CODES.OP_CAT ||
            opcodenum === opcode_1.OP_CODES.OP_SUBSTR ||
            opcodenum === opcode_1.OP_CODES.OP_LEFT ||
            opcodenum === opcode_1.OP_CODES.OP_RIGHT ||
            opcodenum === opcode_1.OP_CODES.OP_INVERT ||
            opcodenum === opcode_1.OP_CODES.OP_AND ||
            opcodenum === opcode_1.OP_CODES.OP_OR ||
            opcodenum === opcode_1.OP_CODES.OP_XOR ||
            opcodenum === opcode_1.OP_CODES.OP_2MUL ||
            opcodenum === opcode_1.OP_CODES.OP_2DIV ||
            opcodenum === opcode_1.OP_CODES.OP_MUL ||
            opcodenum === opcode_1.OP_CODES.OP_DIV ||
            opcodenum === opcode_1.OP_CODES.OP_MOD ||
            opcodenum === opcode_1.OP_CODES.OP_LSHIFT ||
            opcodenum === opcode_1.OP_CODES.OP_RSHIFT) {
            this.errstr = 'SCRIPT_ERR_DISABLED_OPCODE';
            return false;
        }
        if (fExec && 0 <= opcodenum && opcodenum <= opcode_1.OP_CODES.OP_PUSHDATA4) {
            if (fRequireMinimal && !this.script.checkMinimalPush(this.pc - 1)) {
                this.errstr = 'SCRIPT_ERR_MINIMALDATA';
                return false;
            }
            if (!chunk.buf) {
                this.stack.push(Interpreter.false);
            }
            else if (chunk.len !== chunk.buf.length) {
                throw new Error('Length of push value not equal to length of data');
            }
            else {
                this.stack.push(chunk.buf);
            }
        }
        else if (fExec ||
            (opcode_1.OP_CODES.OP_IF <= opcodenum && opcodenum <= opcode_1.OP_CODES.OP_ENDIF)) {
            switch (opcodenum) {
                case opcode_1.OP_CODES.OP_1NEGATE:
                case opcode_1.OP_CODES.OP_1:
                case opcode_1.OP_CODES.OP_2:
                case opcode_1.OP_CODES.OP_3:
                case opcode_1.OP_CODES.OP_4:
                case opcode_1.OP_CODES.OP_5:
                case opcode_1.OP_CODES.OP_6:
                case opcode_1.OP_CODES.OP_7:
                case opcode_1.OP_CODES.OP_8:
                case opcode_1.OP_CODES.OP_9:
                case opcode_1.OP_CODES.OP_10:
                case opcode_1.OP_CODES.OP_11:
                case opcode_1.OP_CODES.OP_12:
                case opcode_1.OP_CODES.OP_13:
                case opcode_1.OP_CODES.OP_14:
                case opcode_1.OP_CODES.OP_15:
                case opcode_1.OP_CODES.OP_16:
                    {
                        n = opcodenum - (opcode_1.OP_CODES.OP_1 - 1);
                        buf = new crypto_1.BitcoreBN(n).toScriptNumBuffer();
                        this.stack.push(buf);
                    }
                    break;
                case opcode_1.OP_CODES.OP_NOP:
                    break;
                case opcode_1.OP_CODES.OP_NOP2:
                case opcode_1.OP_CODES.OP_CHECKLOCKTIMEVERIFY:
                    if (!(this.flags & Interpreter.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY)) {
                        if (this.flags & Interpreter.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS) {
                            this.errstr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS';
                            return false;
                        }
                        break;
                    }
                    if (this.stack.length < 1) {
                        this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                        return false;
                    }
                    const nLockTime = crypto_1.BitcoreBN.fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal, 5);
                    if (nLockTime.lt(new crypto_1.BitcoreBN(0))) {
                        this.errstr = 'SCRIPT_ERR_NEGATIVE_LOCKTIME';
                        return false;
                    }
                    if (!this.checkLockTime(nLockTime)) {
                        this.errstr = 'SCRIPT_ERR_UNSATISFIED_LOCKTIME';
                        return false;
                    }
                    break;
                case opcode_1.OP_CODES.OP_NOP1:
                case opcode_1.OP_CODES.OP_NOP3:
                case opcode_1.OP_CODES.OP_NOP4:
                case opcode_1.OP_CODES.OP_NOP5:
                case opcode_1.OP_CODES.OP_NOP6:
                case opcode_1.OP_CODES.OP_NOP7:
                case opcode_1.OP_CODES.OP_NOP8:
                case opcode_1.OP_CODES.OP_NOP9:
                case opcode_1.OP_CODES.OP_NOP10:
                    {
                        if (this.flags & Interpreter.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS) {
                            this.errstr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS';
                            return false;
                        }
                    }
                    break;
                case opcode_1.OP_CODES.OP_IF:
                case opcode_1.OP_CODES.OP_NOTIF:
                    {
                        fValue = false;
                        if (fExec) {
                            if (this.stack.length < 1) {
                                this.errstr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL';
                                return false;
                            }
                            buf = this.stack.pop();
                            fValue = Interpreter.castToBool(buf);
                            if (opcodenum === opcode_1.OP_CODES.OP_NOTIF) {
                                fValue = !fValue;
                            }
                        }
                        this.vfExec.push(fValue);
                    }
                    break;
                case opcode_1.OP_CODES.OP_ELSE:
                    {
                        if (this.vfExec.length === 0) {
                            this.errstr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL';
                            return false;
                        }
                        this.vfExec[this.vfExec.length - 1] = !this.vfExec[this.vfExec.length - 1];
                    }
                    break;
                case opcode_1.OP_CODES.OP_ENDIF:
                    {
                        if (this.vfExec.length === 0) {
                            this.errstr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL';
                            return false;
                        }
                        this.vfExec.pop();
                    }
                    break;
                case opcode_1.OP_CODES.OP_VERIFY:
                    {
                        if (this.stack.length < 1) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        buf = this.stack[this.stack.length - 1];
                        fValue = Interpreter.castToBool(buf);
                        if (fValue) {
                            this.stack.pop();
                        }
                        else {
                            this.errstr = 'SCRIPT_ERR_VERIFY';
                            return false;
                        }
                    }
                    break;
                case opcode_1.OP_CODES.OP_RETURN:
                    {
                        this.errstr = 'SCRIPT_ERR_OP_RETURN';
                        return false;
                    }
                    break;
                case opcode_1.OP_CODES.OP_TOALTSTACK:
                    {
                        if (this.stack.length < 1) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        this.altstack.push(this.stack.pop());
                    }
                    break;
                case opcode_1.OP_CODES.OP_FROMALTSTACK:
                    {
                        if (this.altstack.length < 1) {
                            this.errstr = 'SCRIPT_ERR_INVALID_ALTSTACK_OPERATION';
                            return false;
                        }
                        this.stack.push(this.altstack.pop());
                    }
                    break;
                case opcode_1.OP_CODES.OP_2DROP:
                    {
                        if (this.stack.length < 2) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        this.stack.pop();
                        this.stack.pop();
                    }
                    break;
                case opcode_1.OP_CODES.OP_2DUP:
                    {
                        if (this.stack.length < 2) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        buf1 = this.stack[this.stack.length - 2];
                        buf2 = this.stack[this.stack.length - 1];
                        this.stack.push(buf1);
                        this.stack.push(buf2);
                    }
                    break;
                case opcode_1.OP_CODES.OP_3DUP:
                    {
                        if (this.stack.length < 3) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        buf1 = this.stack[this.stack.length - 3];
                        buf2 = this.stack[this.stack.length - 2];
                        const buf3 = this.stack[this.stack.length - 1];
                        this.stack.push(buf1);
                        this.stack.push(buf2);
                        this.stack.push(buf3);
                    }
                    break;
                case opcode_1.OP_CODES.OP_2OVER:
                    {
                        if (this.stack.length < 4) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        buf1 = this.stack[this.stack.length - 4];
                        buf2 = this.stack[this.stack.length - 3];
                        this.stack.push(buf1);
                        this.stack.push(buf2);
                    }
                    break;
                case opcode_1.OP_CODES.OP_2ROT:
                    {
                        if (this.stack.length < 6) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        spliced = this.stack.splice(this.stack.length - 6, 2);
                        this.stack.push(spliced[0]);
                        this.stack.push(spliced[1]);
                    }
                    break;
                case opcode_1.OP_CODES.OP_2SWAP:
                    {
                        if (this.stack.length < 4) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        spliced = this.stack.splice(this.stack.length - 4, 2);
                        this.stack.push(spliced[0]);
                        this.stack.push(spliced[1]);
                    }
                    break;
                case opcode_1.OP_CODES.OP_IFDUP:
                    {
                        if (this.stack.length < 1) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        buf = this.stack[this.stack.length - 1];
                        fValue = Interpreter.castToBool(buf);
                        if (fValue) {
                            this.stack.push(buf);
                        }
                    }
                    break;
                case opcode_1.OP_CODES.OP_DEPTH:
                    {
                        buf = new crypto_1.BitcoreBN(this.stack.length).toScriptNumBuffer();
                        this.stack.push(buf);
                    }
                    break;
                case opcode_1.OP_CODES.OP_DROP:
                    {
                        if (this.stack.length < 1) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        this.stack.pop();
                    }
                    break;
                case opcode_1.OP_CODES.OP_DUP:
                    {
                        if (this.stack.length < 1) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        this.stack.push(this.stack[this.stack.length - 1]);
                    }
                    break;
                case opcode_1.OP_CODES.OP_NIP:
                    {
                        if (this.stack.length < 2) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        this.stack.splice(this.stack.length - 2, 1);
                    }
                    break;
                case opcode_1.OP_CODES.OP_OVER:
                    {
                        if (this.stack.length < 2) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        this.stack.push(this.stack[this.stack.length - 2]);
                    }
                    break;
                case opcode_1.OP_CODES.OP_PICK:
                case opcode_1.OP_CODES.OP_ROLL:
                    {
                        if (this.stack.length < 2) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        buf = this.stack[this.stack.length - 1];
                        bn = crypto_1.BitcoreBN.fromScriptNumBuffer(buf, fRequireMinimal);
                        n = bn.toNumber();
                        this.stack.pop();
                        if (n < 0 || n >= this.stack.length) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        buf = this.stack[this.stack.length - n - 1];
                        if (opcodenum === opcode_1.OP_CODES.OP_ROLL) {
                            this.stack.splice(this.stack.length - n - 1, 1);
                        }
                        this.stack.push(buf);
                    }
                    break;
                case opcode_1.OP_CODES.OP_ROT:
                    {
                        if (this.stack.length < 3) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        x1 = this.stack[this.stack.length - 3];
                        x2 = this.stack[this.stack.length - 2];
                        const x3 = this.stack[this.stack.length - 1];
                        this.stack[this.stack.length - 3] = x2;
                        this.stack[this.stack.length - 2] = x3;
                        this.stack[this.stack.length - 1] = x1;
                    }
                    break;
                case opcode_1.OP_CODES.OP_SWAP:
                    {
                        if (this.stack.length < 2) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        x1 = this.stack[this.stack.length - 2];
                        x2 = this.stack[this.stack.length - 1];
                        this.stack[this.stack.length - 2] = x2;
                        this.stack[this.stack.length - 1] = x1;
                    }
                    break;
                case opcode_1.OP_CODES.OP_TUCK:
                    {
                        if (this.stack.length < 2) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        this.stack.splice(this.stack.length - 2, 0, this.stack[this.stack.length - 1]);
                    }
                    break;
                case opcode_1.OP_CODES.OP_SIZE:
                    {
                        if (this.stack.length < 1) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        bn = new crypto_1.BitcoreBN(this.stack[this.stack.length - 1].length);
                        this.stack.push(bn.toScriptNumBuffer());
                    }
                    break;
                case opcode_1.OP_CODES.OP_EQUAL:
                case opcode_1.OP_CODES.OP_EQUALVERIFY:
                    {
                        if (this.stack.length < 2) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        buf1 = this.stack[this.stack.length - 2];
                        buf2 = this.stack[this.stack.length - 1];
                        const fEqual = buf1.toString('hex') === buf2.toString('hex');
                        this.stack.pop();
                        this.stack.pop();
                        this.stack.push(fEqual ? Interpreter.true : Interpreter.false);
                        if (opcodenum === opcode_1.OP_CODES.OP_EQUALVERIFY) {
                            if (fEqual) {
                                this.stack.pop();
                            }
                            else {
                                this.errstr = 'SCRIPT_ERR_EQUALVERIFY';
                                return false;
                            }
                        }
                    }
                    break;
                case opcode_1.OP_CODES.OP_1ADD:
                case opcode_1.OP_CODES.OP_1SUB:
                case opcode_1.OP_CODES.OP_NEGATE:
                case opcode_1.OP_CODES.OP_ABS:
                case opcode_1.OP_CODES.OP_NOT:
                case opcode_1.OP_CODES.OP_0NOTEQUAL:
                    {
                        if (this.stack.length < 1) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        buf = this.stack[this.stack.length - 1];
                        bn = crypto_1.BitcoreBN.fromScriptNumBuffer(buf, fRequireMinimal);
                        switch (opcodenum) {
                            case opcode_1.OP_CODES.OP_1ADD:
                                bn = bn.add(crypto_1.BitcoreBN.One);
                                break;
                            case opcode_1.OP_CODES.OP_1SUB:
                                bn = bn.sub(crypto_1.BitcoreBN.One);
                                break;
                            case opcode_1.OP_CODES.OP_NEGATE:
                                bn = bn.neg();
                                break;
                            case opcode_1.OP_CODES.OP_ABS:
                                if (bn.cmp(crypto_1.BitcoreBN.Zero) < 0) {
                                    bn = bn.neg();
                                }
                                break;
                            case opcode_1.OP_CODES.OP_NOT:
                                bn = new crypto_1.BitcoreBN(Interpreter.booleanToNumber(bn.cmp(crypto_1.BitcoreBN.Zero) === 0) + 0);
                                break;
                            case opcode_1.OP_CODES.OP_0NOTEQUAL:
                                bn = new crypto_1.BitcoreBN(Interpreter.booleanToNumber(bn.cmp(crypto_1.BitcoreBN.Zero) !== 0) + 0);
                                break;
                        }
                        this.stack.pop();
                        this.stack.push(bn.toScriptNumBuffer());
                    }
                    break;
                case opcode_1.OP_CODES.OP_ADD:
                case opcode_1.OP_CODES.OP_SUB:
                case opcode_1.OP_CODES.OP_BOOLAND:
                case opcode_1.OP_CODES.OP_BOOLOR:
                case opcode_1.OP_CODES.OP_NUMEQUAL:
                case opcode_1.OP_CODES.OP_NUMEQUALVERIFY:
                case opcode_1.OP_CODES.OP_NUMNOTEQUAL:
                case opcode_1.OP_CODES.OP_LESSTHAN:
                case opcode_1.OP_CODES.OP_GREATERTHAN:
                case opcode_1.OP_CODES.OP_LESSTHANOREQUAL:
                case opcode_1.OP_CODES.OP_GREATERTHANOREQUAL:
                case opcode_1.OP_CODES.OP_MIN:
                case opcode_1.OP_CODES.OP_MAX:
                    {
                        if (this.stack.length < 2) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        bn1 = crypto_1.BitcoreBN.fromScriptNumBuffer(this.stack[this.stack.length - 2], fRequireMinimal);
                        bn2 = crypto_1.BitcoreBN.fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal);
                        bn = new crypto_1.BitcoreBN(0);
                        switch (opcodenum) {
                            case opcode_1.OP_CODES.OP_ADD:
                                bn = bn1.add(bn2);
                                break;
                            case opcode_1.OP_CODES.OP_SUB:
                                bn = bn1.sub(bn2);
                                break;
                            case opcode_1.OP_CODES.OP_BOOLAND:
                                bn = new crypto_1.BitcoreBN(Interpreter.booleanToNumber(bn1.cmp(crypto_1.BitcoreBN.Zero) !== 0 &&
                                    bn2.cmp(crypto_1.BitcoreBN.Zero) !== 0) + 0);
                                break;
                            case opcode_1.OP_CODES.OP_BOOLOR:
                                bn = new crypto_1.BitcoreBN(Interpreter.booleanToNumber(bn1.cmp(crypto_1.BitcoreBN.Zero) !== 0 ||
                                    bn2.cmp(crypto_1.BitcoreBN.Zero) !== 0) + 0);
                                break;
                            case opcode_1.OP_CODES.OP_NUMEQUAL:
                                bn = new crypto_1.BitcoreBN(Interpreter.booleanToNumber(bn1.cmp(bn2) === 0) + 0);
                                break;
                            case opcode_1.OP_CODES.OP_NUMEQUALVERIFY:
                                bn = new crypto_1.BitcoreBN(Interpreter.booleanToNumber(bn1.cmp(bn2) === 0) + 0);
                                break;
                            case opcode_1.OP_CODES.OP_NUMNOTEQUAL:
                                bn = new crypto_1.BitcoreBN(Interpreter.booleanToNumber(bn1.cmp(bn2) !== 0) + 0);
                                break;
                            case opcode_1.OP_CODES.OP_LESSTHAN:
                                bn = new crypto_1.BitcoreBN(Interpreter.booleanToNumber(bn1.cmp(bn2) < 0) + 0);
                                break;
                            case opcode_1.OP_CODES.OP_GREATERTHAN:
                                bn = new crypto_1.BitcoreBN(Interpreter.booleanToNumber(bn1.cmp(bn2) > 0) + 0);
                                break;
                            case opcode_1.OP_CODES.OP_LESSTHANOREQUAL:
                                bn = new crypto_1.BitcoreBN(Interpreter.booleanToNumber(bn1.cmp(bn2) <= 0) + 0);
                                break;
                            case opcode_1.OP_CODES.OP_GREATERTHANOREQUAL:
                                bn = new crypto_1.BitcoreBN(Interpreter.booleanToNumber(bn1.cmp(bn2) >= 0) + 0);
                                break;
                            case opcode_1.OP_CODES.OP_MIN:
                                bn = bn1.cmp(bn2) < 0 ? bn1 : bn2;
                                break;
                            case opcode_1.OP_CODES.OP_MAX:
                                bn = bn1.cmp(bn2) > 0 ? bn1 : bn2;
                                break;
                        }
                        this.stack.pop();
                        this.stack.pop();
                        this.stack.push(bn.toScriptNumBuffer());
                        if (opcodenum === opcode_1.OP_CODES.OP_NUMEQUALVERIFY) {
                            if (Interpreter.castToBool(this.stack[this.stack.length - 1])) {
                                this.stack.pop();
                            }
                            else {
                                this.errstr = 'SCRIPT_ERR_NUMEQUALVERIFY';
                                return false;
                            }
                        }
                    }
                    break;
                case opcode_1.OP_CODES.OP_WITHIN:
                    {
                        if (this.stack.length < 3) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        bn1 = crypto_1.BitcoreBN.fromScriptNumBuffer(this.stack[this.stack.length - 3], fRequireMinimal);
                        bn2 = crypto_1.BitcoreBN.fromScriptNumBuffer(this.stack[this.stack.length - 2], fRequireMinimal);
                        const bn3 = crypto_1.BitcoreBN.fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal);
                        fValue = bn2.cmp(bn1) <= 0 && bn1.cmp(bn3) < 0;
                        this.stack.pop();
                        this.stack.pop();
                        this.stack.pop();
                        this.stack.push(fValue ? Interpreter.true : Interpreter.false);
                    }
                    break;
                case opcode_1.OP_CODES.OP_RIPEMD160:
                case opcode_1.OP_CODES.OP_SHA1:
                case opcode_1.OP_CODES.OP_SHA256:
                case opcode_1.OP_CODES.OP_HASH160:
                case opcode_1.OP_CODES.OP_HASH256:
                    {
                        if (this.stack.length < 1) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        buf = this.stack[this.stack.length - 1];
                        let bufHash;
                        if (opcodenum === opcode_1.OP_CODES.OP_RIPEMD160) {
                            bufHash = crypto_1.Hash.ripemd160(buf);
                        }
                        else if (opcodenum === opcode_1.OP_CODES.OP_SHA1) {
                            bufHash = crypto_1.Hash.sha1(buf);
                        }
                        else if (opcodenum === opcode_1.OP_CODES.OP_SHA256) {
                            bufHash = crypto_1.Hash.sha256(buf);
                        }
                        else if (opcodenum === opcode_1.OP_CODES.OP_HASH160) {
                            bufHash = crypto_1.Hash.sha256ripemd160(buf);
                        }
                        else if (opcodenum === opcode_1.OP_CODES.OP_HASH256) {
                            bufHash = crypto_1.Hash.sha256sha256(buf);
                        }
                        this.stack.pop();
                        this.stack.push(bufHash);
                    }
                    break;
                case opcode_1.OP_CODES.OP_CODESEPARATOR:
                    {
                        this.pbegincodehash = this.pc;
                    }
                    break;
                case opcode_1.OP_CODES.OP_CHECKSIG:
                case opcode_1.OP_CODES.OP_CHECKSIGVERIFY:
                    {
                        if (this.stack.length < 2) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        bufSig = this.stack[this.stack.length - 2];
                        bufPubkey = this.stack[this.stack.length - 1];
                        subscript = new script_1.Script().set({
                            chunks: this.script.chunks.slice(this.pbegincodehash)
                        });
                        const tmpScript = new script_1.Script().add(bufSig);
                        subscript.findAndDelete(tmpScript);
                        if (!this.checkSignatureEncoding(bufSig) ||
                            !this.checkPubkeyEncoding(bufPubkey)) {
                            return false;
                        }
                        try {
                            sig = signature_1.Signature.fromTxFormat(bufSig);
                            pubkey = publickey_1.PublicKey.fromBuffer(bufPubkey, false);
                            fSuccess = this.tx.verifySignature(sig, pubkey, this.nin, subscript);
                        }
                        catch (e) {
                            fSuccess = false;
                        }
                        this.stack.pop();
                        this.stack.pop();
                        this.stack.push(fSuccess ? Interpreter.true : Interpreter.false);
                        if (opcodenum === opcode_1.OP_CODES.OP_CHECKSIGVERIFY) {
                            if (fSuccess) {
                                this.stack.pop();
                            }
                            else {
                                this.errstr = 'SCRIPT_ERR_CHECKSIGVERIFY';
                                return false;
                            }
                        }
                    }
                    break;
                case opcode_1.OP_CODES.OP_CHECKMULTISIG:
                case opcode_1.OP_CODES.OP_CHECKMULTISIGVERIFY:
                    {
                        let i = 1;
                        if (this.stack.length < i) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        let nKeysCount = crypto_1.BitcoreBN.fromScriptNumBuffer(this.stack[this.stack.length - i], fRequireMinimal).toNumber();
                        if (nKeysCount < 0 || nKeysCount > 20) {
                            this.errstr = 'SCRIPT_ERR_PUBKEY_COUNT';
                            return false;
                        }
                        this.nOpCount += nKeysCount;
                        if (this.nOpCount > 201) {
                            this.errstr = 'SCRIPT_ERR_OP_COUNT';
                            return false;
                        }
                        let ikey = ++i;
                        i += nKeysCount;
                        if (this.stack.length < i) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        let nSigsCount = crypto_1.BitcoreBN.fromScriptNumBuffer(this.stack[this.stack.length - i], fRequireMinimal).toNumber();
                        if (nSigsCount < 0 || nSigsCount > nKeysCount) {
                            this.errstr = 'SCRIPT_ERR_SIG_COUNT';
                            return false;
                        }
                        let isig = ++i;
                        i += nSigsCount;
                        if (this.stack.length < i) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        subscript = new script_1.Script().set({
                            chunks: this.script.chunks.slice(this.pbegincodehash)
                        });
                        for (let k = 0; k < nSigsCount; k++) {
                            bufSig = this.stack[this.stack.length - isig - k];
                            subscript.findAndDelete(new script_1.Script().add(bufSig));
                        }
                        fSuccess = true;
                        while (fSuccess && nSigsCount > 0) {
                            bufSig = this.stack[this.stack.length - isig];
                            bufPubkey = this.stack[this.stack.length - ikey];
                            if (!this.checkSignatureEncoding(bufSig) ||
                                !this.checkPubkeyEncoding(bufPubkey)) {
                                return false;
                            }
                            let fOk;
                            try {
                                sig = signature_1.Signature.fromTxFormat(bufSig);
                                pubkey = publickey_1.PublicKey.fromBuffer(bufPubkey, false);
                                fOk = this.tx.verifySignature(sig, pubkey, this.nin, subscript);
                            }
                            catch (e) {
                                fOk = false;
                            }
                            if (fOk) {
                                isig++;
                                nSigsCount--;
                            }
                            ikey++;
                            nKeysCount--;
                            if (nSigsCount > nKeysCount) {
                                fSuccess = false;
                            }
                        }
                        while (i-- > 1) {
                            this.stack.pop();
                        }
                        if (this.stack.length < 1) {
                            this.errstr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                            return false;
                        }
                        if (this.flags & Interpreter.SCRIPT_VERIFY_NULLDUMMY &&
                            this.stack[this.stack.length - 1].length) {
                            this.errstr = 'SCRIPT_ERR_SIG_NULLDUMMY';
                            return false;
                        }
                        this.stack.pop();
                        this.stack.push(fSuccess ? Interpreter.true : Interpreter.false);
                        if (opcodenum === opcode_1.OP_CODES.OP_CHECKMULTISIGVERIFY) {
                            if (fSuccess) {
                                this.stack.pop();
                            }
                            else {
                                this.errstr = 'SCRIPT_ERR_CHECKMULTISIGVERIFY';
                                return false;
                            }
                        }
                    }
                    break;
                default:
                    this.errstr = 'SCRIPT_ERR_BAD_OPCODE';
                    return false;
            }
        }
        return true;
    }
    static booleanToNumber(bool) {
        return bool ? 1 : 0;
    }
}
exports.Interpreter = Interpreter;
Interpreter.true = Buffer.from([1]);
Interpreter.false = Buffer.from([]);
Interpreter.MAX_SCRIPT_ELEMENT_SIZE = 520;
Interpreter.LOCKTIME_THRESHOLD = 500000000;
Interpreter.LOCKTIME_THRESHOLD_BN = new crypto_1.BitcoreBN(Interpreter.LOCKTIME_THRESHOLD);
Interpreter.SCRIPT_VERIFY_NONE = 0;
Interpreter.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_WITNESS_PROGRAM = 1 << 12;
Interpreter.SCRIPT_VERIFY_P2SH = 1 << 0;
Interpreter.SCRIPT_VERIFY_STRICTENC = 1 << 1;
Interpreter.SCRIPT_VERIFY_DERSIG = 1 << 2;
Interpreter.SCRIPT_VERIFY_LOW_S = 1 << 3;
Interpreter.SCRIPT_VERIFY_NULLDUMMY = 1 << 4;
Interpreter.SCRIPT_VERIFY_SIGPUSHONLY = 1 << 5;
Interpreter.SCRIPT_VERIFY_MINIMALDATA = 1 << 6;
Interpreter.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY = 1 << 9;
Interpreter.SCRIPT_VERIFY_WITNESS = 1 << 10;
Interpreter.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS = 1 << 11;
//# sourceMappingURL=interpreter.js.map