/// <reference types="node" />
import { Script } from './script';
import { BitcoreBN } from '../crypto';
import { Transaction } from '../transaction';
declare namespace Interpreter {
    interface WitnessValue {
        version: number;
        program: Buffer;
    }
    interface InterpreterObj {
        stack: Array<Buffer>;
        altstack: Array<Buffer>;
        pc: number;
        satoshis: number;
        sigversion: number;
        pbegincodehash: number;
        nOpCount: number;
        vfExec: Array<boolean>;
        errstr: string;
        flags: number;
        script: Script;
        tx: Transaction;
        nin: number;
    }
}
export declare class Interpreter {
    stack: Array<Buffer>;
    altstack: Array<Buffer>;
    pc: number;
    satoshis: number;
    sigversion: number;
    pbegincodehash: number;
    nOpCount: number;
    vfExec: Array<boolean>;
    errstr: string;
    flags: number;
    script: Script;
    tx: Transaction;
    nin: number;
    static true: Buffer;
    static false: Buffer;
    static MAX_SCRIPT_ELEMENT_SIZE: number;
    static LOCKTIME_THRESHOLD: number;
    static LOCKTIME_THRESHOLD_BN: BitcoreBN;
    static SCRIPT_VERIFY_NONE: number;
    static SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_WITNESS_PROGRAM: number;
    static SCRIPT_VERIFY_P2SH: number;
    static SCRIPT_VERIFY_STRICTENC: number;
    static SCRIPT_VERIFY_DERSIG: number;
    static SCRIPT_VERIFY_LOW_S: number;
    static SCRIPT_VERIFY_NULLDUMMY: number;
    static SCRIPT_VERIFY_SIGPUSHONLY: number;
    static SCRIPT_VERIFY_MINIMALDATA: number;
    static SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY: number;
    static SCRIPT_VERIFY_WITNESS: number;
    static SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS: number;
    constructor(obj?: Interpreter | Interpreter.InterpreterObj);
    verifyWitnessProgram(version: any, program: any, witness: any, satoshis: any, flags: any): boolean;
    verify(scriptSig: any, scriptPubkey: any, tx?: Transaction, nin?: number, flags?: number, witness?: Array<string>, satoshis?: number): boolean;
    initialize(): void;
    set(obj: any): void;
    static castToBool(buf: any): boolean;
    checkSignatureEncoding(buf: any): boolean;
    checkPubkeyEncoding(buf: any): boolean;
    evaluate(): boolean;
    checkLockTime(nLockTime: any): boolean;
    step(): boolean;
    static booleanToNumber(bool: boolean): 1 | 0;
}
export {};
