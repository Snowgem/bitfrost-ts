"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Encoding = void 0;
const bufferreader_1 = require("./bufferreader");
const varint_1 = require("./varint");
const bufferwriter_1 = require("./bufferwriter");
const base58check_1 = require("./base58check");
const base58_1 = require("./base58");
exports.Encoding = {
    Base58: base58_1.Base58,
    Base58Check: base58check_1.Base58Check,
    BufferReader: bufferreader_1.BufferReader,
    BufferWriter: bufferwriter_1.BufferWriter,
    Varint: varint_1.Varint
};
__exportStar(require("./bufferreader"), exports);
__exportStar(require("./varint"), exports);
__exportStar(require("./bufferwriter"), exports);
__exportStar(require("./base58check"), exports);
__exportStar(require("./base58"), exports);
//# sourceMappingURL=index.js.map