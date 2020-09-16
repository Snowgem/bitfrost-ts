"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Random = void 0;
class Random {
    static getRandomBuffer(size) {
        if (process.browser) {
            return Random.getRandomBufferBrowser(size);
        }
        else {
            return Random.getRandomBufferNode(size);
        }
    }
    static getRandomBufferNode(size) {
        const crypto = require('crypto');
        return crypto.randomBytes(size);
    }
    static getRandomBufferBrowser(size) {
        if (window) {
            if (!window.crypto && !window.msCrypto) {
                throw new Error('window.crypto not available');
            }
            let crypto;
            if (window.crypto && window.crypto.getRandomValues) {
                crypto = window.crypto;
            }
            else if (window.msCrypto && window.msCrypto.getRandomValues) {
                crypto = window.msCrypto;
            }
            else {
                throw new Error('window.crypto.getRandomValues not available');
            }
            const bbuf = new Uint8Array(size);
            crypto.getRandomValues(bbuf);
            const buf = Buffer.from(bbuf);
            return buf;
        }
    }
    static getPseudoRandomBuffer(size) {
        const b32 = 0x100000000;
        const b = Buffer.alloc(size);
        let r;
        for (let i = 0; i <= size; i++) {
            const j = Math.floor(i / 4);
            const k = i - j * 4;
            if (k === 0) {
                r = Math.random() * b32;
                b[i] = r & 0xff;
            }
            else {
                b[i] = (r = r >>> 8) & 0xff;
            }
        }
        return b;
    }
}
exports.Random = Random;
//# sourceMappingURL=random.js.map