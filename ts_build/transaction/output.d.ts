/// <reference types="node" />
import BN from 'bn.js';
import { BitcoreBN } from '../crypto/bn';
import { Script } from '../script';
import { BufferReader } from '../encoding/bufferreader';
export declare namespace Output {
    interface OutputObj {
        satoshis: number | BitcoreBN | string;
        script: Script | Buffer | string;
    }
}
export declare class Output {
    _scriptBuffer: Buffer;
    _script: Script;
    _satoshis: number;
    _satoshisBN: BN;
    constructor(args: Output.OutputObj);
    get script(): Script;
    get satoshis(): number;
    setSatoshis(num: number | string | BitcoreBN): void;
    invalidSatoshis: () => false | "transaction txout satoshis greater than max safe integer" | "transaction txout satoshis has corrupted value" | "transaction txout negative";
    toObject: () => {
        satoshis: any;
        script: any;
    };
    toJSON: () => {
        satoshis: any;
        script: any;
    };
    static fromObject: (data: any) => Output;
    setScriptFromBuffer: (buffer: any) => void;
    setScript: (script: any) => any;
    inspect: () => string;
    static fromBufferReader: (br: BufferReader) => Output;
    toBufferWriter: (writer: any) => any;
}
