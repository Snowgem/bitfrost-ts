"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Point = void 0;
const _1 = require(".");
const buffer_1 = require("../util/buffer");
const elliptic_1 = require("elliptic");
const secp256k1 = new elliptic_1.ec('secp256k1');
const curveInstance = secp256k1.curve;
const ecPointFromX = curveInstance.pointFromX.bind(secp256k1.curve);
class Point extends curveInstance.point {
    constructor(x, y, isRed = false) {
        super(x, y, isRed);
        this._getX = this.getX;
        this._getY = this.getY;
        try {
            super.validate();
            this.validate();
        }
        catch (e) {
            throw new Error('Invalid Point');
        }
    }
    static fromX(odd, x) {
        try {
            const point = ecPointFromX(x, odd);
            point.validate();
            return point;
        }
        catch (e) {
            throw new Error('Invalid X');
        }
    }
    static getG() {
        return secp256k1.curve.g;
    }
    getX() {
        return new _1.BitcoreBN(this._getX().toArray());
    }
    getY() {
        return new _1.BitcoreBN(this._getY().toArray());
    }
    validate() {
        if (this.isInfinity()) {
            throw new Error('Point cannot be equal to Infinity');
        }
        let p2;
        try {
            p2 = this.pointFromX(this.getX(), this.getY().isOdd());
        }
        catch (e) {
            throw new Error('Point does not lie on the curve');
        }
        if (p2.y.cmp(this.y) !== 0) {
            throw new Error('Invalid y value for curve.');
        }
        if (!this.mul(Point.getN()).isInfinity()) {
            throw new Error('Point times N must be infinity');
        }
        return this;
    }
    static pointToCompressed(point) {
        const xbuf = point.getX().toBuffer({ size: 32 });
        const ybuf = point.getY().toBuffer({ size: 32 });
        const odd = ybuf[ybuf.length - 1] % 2;
        const prefix = odd ? Buffer.from([0x03]) : Buffer.from([0x02]);
        return buffer_1.BufferUtil.concat([prefix, xbuf]);
    }
}
exports.Point = Point;
Point.getN = function getN() {
    return new _1.BitcoreBN(secp256k1.curve.n.toArray());
};
//# sourceMappingURL=point.js.map