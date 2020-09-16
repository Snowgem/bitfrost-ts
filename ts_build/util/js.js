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
exports.JSUtil = void 0;
const _ = __importStar(require("lodash"));
class JSUtil {
    static isHexa(value) {
        if (!_.isString(value)) {
            return false;
        }
        return /^[0-9a-fA-F]+$/.test(value);
    }
    static isValidJSON(arg) {
        let parsed;
        if (!_.isString(arg)) {
            return false;
        }
        try {
            parsed = JSON.parse(arg);
        }
        catch (e) {
            return false;
        }
        if (typeof parsed === 'object') {
            return true;
        }
        return false;
    }
    static cloneArray(array) {
        return [].concat(array);
    }
    static defineImmutable(target, values) {
        Object.keys(values).forEach(key => {
            Object.defineProperty(target, key, {
                configurable: false,
                enumerable: true,
                value: values[key]
            });
        });
        return target;
    }
    static isNaturalNumber(value) {
        return (typeof value === 'number' &&
            isFinite(value) &&
            Math.floor(value) === value &&
            value >= 0);
    }
    static booleanToNumber(bool) {
        return bool ? 1 : 0;
    }
}
exports.JSUtil = JSUtil;
JSUtil.isHexaString = JSUtil.isHexa;
//# sourceMappingURL=js.js.map