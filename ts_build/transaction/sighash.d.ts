export declare const Sighash: {
    sighash: typeof sighash;
    verify: typeof verify;
    sign: typeof sign;
};
export declare function sighash(transaction: any, sighashType: any, inputNumber: any, subscript: any): any;
export declare function sign(transaction: any, privateKey: any, sighashType: any, inputIndex: any, subscript: any): any;
export declare function verify(transaction: any, signature: any, publicKey: any, inputIndex: any, subscript: any): any;
