export declare class Unit {
    static BTC: number[];
    static mBTC: number[];
    static uBTC: number[];
    static bits: number[];
    static satoshis: number[];
    get BTC(): any;
    get mBTC(): any;
    get uBTC(): any;
    get bits(): any;
    get satoshis(): any;
    _value: number;
    constructor(amount: any, code: any);
    static fromObject(data: any): Unit;
    static fromJSON: typeof Unit.fromObject;
    static fromBTC(amount: any): Unit;
    static fromMilis(amount: any): Unit;
    static fromMicros(amount: any): Unit;
    static fromBits: typeof Unit.fromMicros;
    static fromSatoshis(amount: any): Unit;
    static fromFiat(amount: any, rate: any): Unit;
    _from(amount: any, code: any): number;
    to(code: any): any;
    toBTC(): any;
    toMillis(): any;
    toMilis: () => any;
    toMicros(): any;
    toBits: () => any;
    toSatoshis(): any;
    atRate(rate: any): any;
    toString(): string;
    toObject(): {
        amount: any;
        code: any;
    };
    toJSON: () => {
        amount: any;
        code: any;
    };
    inspect(): string;
}
