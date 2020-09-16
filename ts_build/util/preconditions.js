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
const _ = __importStar(require("lodash"));
const errors_1 = require("../errors");
exports.default = {
    checkState: function (condition, message) {
        if (!condition) {
            throw new errors_1.BitcoreError('InvalidState', message);
        }
    },
    checkArgument(condition, argumentName, message, docsPath) {
        if (!condition) {
            throw new errors_1.BitcoreError('InvalidArgument', argumentName, message, docsPath);
        }
    },
    checkArgumentType(argument, type, argumentName = '(unknown name)') {
        if (_.isString(type)) {
            if (type === 'Buffer') {
                const buffer = require('buffer');
                if (!buffer.Buffer.isBuffer(argument)) {
                    throw new errors_1.BitcoreError('InvalidArgumentType', argument, type, argumentName);
                }
            }
            else if (typeof argument !== type) {
                throw new errors_1.BitcoreError('InvalidArgumentType', argument, type, argumentName);
            }
        }
        else {
            if (!(argument instanceof type)) {
                throw new errors_1.BitcoreError('InvalidArgumentType', argument, type.name, argumentName);
            }
        }
    }
};
//# sourceMappingURL=preconditions.js.map