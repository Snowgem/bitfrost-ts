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
exports.BitcoreError = void 0;
const spec_1 = require("./spec");
__exportStar(require("./spec"), exports);
function format(message, args) {
    return message
        .replace('{0}', args[0])
        .replace('{1}', args[1])
        .replace('{2}', args[2]);
}
class BitcoreError extends Error {
    constructor(errType, ...args) {
        const message = typeof errType === 'string'
            ? spec_1.ERROR_TYPES[errType].message
            : errType.message;
        const formattedMessage = typeof message === 'function'
            ? format(message(args), args)
            : format(message, args);
        super(formattedMessage);
    }
}
exports.BitcoreError = BitcoreError;
BitcoreError.Types = spec_1.ERROR_TYPES;
//# sourceMappingURL=index.js.map