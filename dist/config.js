"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPoolId = exports.findMarketId = exports.RAYDOIM = exports.OPENBOOK = exports.quoteMint = exports.metaplex = exports.connection = exports.RPC_URL = void 0;
const web3_js_1 = require("@solana/web3.js");
const js_1 = require("@metaplex-foundation/js");
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const serum_1 = require("@project-serum/serum");
exports.RPC_URL = 'https://solana-mainnet.g.alchemy.com/v2/w3QZWz-Bh19CfQn6C0N6oX2ExF_nqO8X';
exports.connection = new web3_js_1.Connection(exports.RPC_URL, 'finalized');
exports.metaplex = js_1.Metaplex.make(exports.connection);
exports.quoteMint = new web3_js_1.PublicKey('So11111111111111111111111111111111111111112');
exports.OPENBOOK = new web3_js_1.PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX");
exports.RAYDOIM = raydium_sdk_1.MAINNET_PROGRAM_ID.AmmV4;
const findMarketId = async (baseMint) => {
    const filters = [
        {
            memcmp: {
                offset: serum_1.Market.getLayout(exports.OPENBOOK).offsetOf('baseMint'),
                bytes: baseMint.toBase58(),
            },
        },
        {
            memcmp: {
                offset: serum_1.Market.getLayout(exports.OPENBOOK).offsetOf('quoteMint'),
                bytes: exports.quoteMint.toBase58(),
            },
        },
    ];
    const resp = await exports.connection.getProgramAccounts(exports.OPENBOOK, {
        commitment: exports.connection.commitment,
        encoding: 'base64',
        filters,
    });
    const marketId = resp[0]?.pubkey?.toString();
    return marketId;
};
exports.findMarketId = findMarketId;
const findPoolId = async (baseMint) => {
    const RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 = raydium_sdk_1.MAINNET_PROGRAM_ID.AmmV4;
    const { span } = raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4;
    const accounts = await exports.connection.getProgramAccounts(RAYDIUM_LIQUIDITY_PROGRAM_ID_V4, {
        dataSlice: { offset: 0, length: raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.span },
        commitment: 'processed',
        filters: [
            { dataSize: span },
            {
                memcmp: {
                    offset: raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.offsetOf('baseMint'),
                    bytes: baseMint.toBase58(),
                },
            },
            {
                memcmp: {
                    offset: raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.offsetOf('marketProgramId'),
                    bytes: exports.OPENBOOK.toBase58(),
                },
            },
        ],
    });
    return accounts;
};
exports.findPoolId = findPoolId;
