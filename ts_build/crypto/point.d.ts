/// <reference types="node" />
import { BitcoreBN } from '.';
import BN from 'bn.js';
declare const curveInstance: Curve;
declare class EcPoint {
    validate(): void;
    isInfinity(): boolean;
    mul(num: BitcoreBN): EcPoint;
    pointFromX(x: number, isOdd: boolean): EcPoint;
    y: BN;
    x: BN;
    dblp(k: number): EcPoint;
    encode(encoding: string, compressed: boolean): BN;
    encodeCompressed(compressed: boolean): BN;
    eq(other: EcPoint): any;
    precompute(power: number): EcPoint;
}
interface PointConstructor {
    new (x: number, y: number, isRed: boolean): EcPoint;
}
declare class Curve {
    pointFromX(x: number, odd: boolean): Point;
    validate(): boolean;
    point: PointConstructor;
}
export declare class Point extends curveInstance.point {
    point: any;
    constructor(x: any, y: any, isRed?: boolean);
    static fromX(odd: any, x: any): any;
    static getG(): any;
    static getN: () => BitcoreBN;
    _getX: () => any;
    getX(): any;
    _getY: () => any;
    getY(): any;
    validate(): this;
    static pointToCompressed(point: any): Buffer;
}
export {};
