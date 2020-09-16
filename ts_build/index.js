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
exports.BitFrostLib = void 0;
const unspentoutput_1 = require("./transaction/unspentoutput");
const uri_1 = require("./uri");
const block_1 = require("./block/block");
const crypto_1 = require("./crypto");
const encoding_1 = require("./encoding");
const errors_1 = require("./errors");
const networks_1 = require("./networks");
const merkleblock_1 = require("./block/merkleblock");
const script_1 = require("./script/script");
const transaction_1 = require("./transaction/transaction");
const util_1 = require("./util");
const hdprivatekey_1 = require("./hdprivatekey");
const hdpublickey_1 = require("./hdpublickey");
const address_1 = require("./address");
const opcode_1 = require("./opcode");
const privatekey_1 = require("./privatekey");
const publickey_1 = require("./publickey");
const unit_1 = require("./unit");
const blockheader_1 = require("./block/blockheader");
exports.BitFrostLib = {
    Address: address_1.Address,
    Block: block_1.Block,
    BlockHeader: blockheader_1.BlockHeader,
    crypto: crypto_1.Crypto,
    encoding: encoding_1.Encoding,
    errors: errors_1.BitcoreError,
    Script: script_1.Script,
    UnspentOutput: unspentoutput_1.UnspentOutput,
    Transaction: transaction_1.Transaction,
    HDPrivateKey: hdprivatekey_1.HDPrivateKey,
    HDPublicKey: hdpublickey_1.HDPublicKey,
    Network: networks_1.Network,
    Opcode: opcode_1.Opcode,
    PrivateKey: privatekey_1.PrivateKey,
    MerkleBlock: merkleblock_1.MerkleBlock,
    PublicKey: publickey_1.PublicKey,
    Unit: unit_1.Unit,
    util: util_1.Util,
    URI: uri_1.URI,
    version: 'v' + require('./package.json').version,
    versionGuard(version) {
        if (version !== undefined) {
            const message = 'More than one instance of bitcore-lib found. ' +
                'Please make sure to require bitcore-lib and check that submodules do' +
                ' not also include their own bitcore-lib dependency.';
            throw new Error(message);
        }
    }
};
global._bitcore = exports.BitFrostLib.version;
__exportStar(require("./address"), exports);
__exportStar(require("./hdprivatekey"), exports);
__exportStar(require("./hdpublickey"), exports);
__exportStar(require("./networks"), exports);
__exportStar(require("./opcode"), exports);
__exportStar(require("./privatekey"), exports);
__exportStar(require("./publickey"), exports);
__exportStar(require("./unit"), exports);
__exportStar(require("./uri"), exports);
__exportStar(require("./transaction"), exports);
__exportStar(require("./crypto"), exports);
__exportStar(require("./networks"), exports);
__exportStar(require("./encoding"), exports);
__exportStar(require("./script"), exports);
//# sourceMappingURL=index.js.map