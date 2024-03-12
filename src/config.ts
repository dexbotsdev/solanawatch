
import { Connection, Keypair, PublicKey } from "@solana/web3.js"; 
import { Metaplex } from '@metaplex-foundation/js';
import { LIQUIDITY_STATE_LAYOUT_V4, MAINNET_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { Market } from "@project-serum/serum";

export const RPC_URL =    'https://solana-mainnet.g.alchemy.com/v2/w3QZWz-Bh19CfQn6C0N6oX2ExF_nqO8X';
export const connection = new Connection(RPC_URL,'finalized')    
export const metaplex = Metaplex.make(connection);
export const quoteMint = new PublicKey('So11111111111111111111111111111111111111112')


export const dexscreener_channel='dexup00';
export const lpburned_channel='SolanaLiquidityBurns';
export const soltrending_channel='soltrendingl';
export const safeguard_channel='safeguardttt';

export const OPENBOOK = new PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX")
export const RAYDOIM =  MAINNET_PROGRAM_ID.AmmV4

export const findMarketId = async (baseMint:PublicKey) => {
  const filters = [
      {
          memcmp: {
              offset: Market.getLayout(OPENBOOK).offsetOf('baseMint'),
              bytes: baseMint.toBase58(),
          },
      },
      {
          memcmp: {
              offset: Market.getLayout(OPENBOOK).offsetOf('quoteMint'),
              bytes: quoteMint.toBase58(),
          },
      },
  ];

  const resp :any= await connection.getProgramAccounts(OPENBOOK, {
      commitment: connection.commitment,
      encoding: 'base64',
      filters,
  });

  
  const marketId = resp[0]?.pubkey?.toString();
   

  return marketId;

}


export const findPoolId = async (baseMint:PublicKey) => {
  
    const RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 =  MAINNET_PROGRAM_ID.AmmV4;
      const { span } = LIQUIDITY_STATE_LAYOUT_V4;
      const accounts  :any= await connection.getProgramAccounts(
          RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
          {
              dataSlice: { offset: 0, length: LIQUIDITY_STATE_LAYOUT_V4.span },
              commitment: 'processed',
              filters: [
                  { dataSize: span },
                  {
                      memcmp: {
                          offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('baseMint'),
                          bytes: baseMint.toBase58(),
                      },
                  },
                  {   
                      memcmp: {
                          offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('marketProgramId'),
                          bytes: OPENBOOK.toBase58(),
                      },
                  },
              ],
          },
      );
   
      return accounts;
  
  }
  