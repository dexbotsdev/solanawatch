import axios from 'axios'
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getMint } from "@solana/spl-token";
import { OPENBOOK, RAYDOIM, connection, findMarketId, findPoolId, metaplex } from '../config';
import { LIQUIDITY_STATE_LAYOUT_V4, Liquidity, MARKET_STATE_LAYOUT_V3 } from '@raydium-io/raydium-sdk';

const helius = "https://mainnet.helius-rpc.com/?api-key=bf5e4b5a-2f95-4fa6-aeaf-24a060faa175"


const getAsset = async (tokenAddress: any) => {
  const response = await axios.post(helius, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'my-id',
      method: 'getAsset',
      params: {
        id: tokenAddress,
        displayOptions: {
          showFungible: true,
        }
      },
    }),
  });
  const result = await response.data;
  console.log("Asset: ", result);


  return result;

};


export const processMessage = async (message: { message: any }) => {

  if (message && message.message) {
    const text = message.message;
    const addressInmessage = parseAddress(text);

    console.log(addressInmessage);

    const token = new PublicKey(addressInmessage);

    const tokenMint = await getMint(connection, token, 'finalized', TOKEN_PROGRAM_ID);
    const tokenStats = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(token) });

    let twitter: string, telegram: string, discord: any, poolOpenTime: any, lpdata: any;


    if (tokenStats.json.description.indexOf('t.me') > 0) telegram = '';
    if (tokenStats.json.description.indexOf('x.com') > 0) twitter = '';

    // const marketId = await findMarketId(token); 
    // 

    const poolId = await findPoolId(token);


    console.log(poolId)

    if (poolId)
      lpdata = LIQUIDITY_STATE_LAYOUT_V4.decode(poolId[0].account.data)




    const data = {
      baseMint: addressInmessage,
      name: tokenStats.json.name,
      symbol: tokenStats.json.symbol,
      image: tokenStats.json.image,
      twitter: tokenStats.json?.twitter,

      telegram: tokenStats.json?.telegram,
      mintAuthority: tokenMint.mintAuthority,
      supply: tokenMint.supply.toString(),
      decimals: tokenMint.decimals,
      freezeAuthority: tokenMint.freezeAuthority,
      marketId: lpdata?.marketId?.toString(),
      owner: lpdata?.marketId?.toString(),
      lpReserve: lpdata?.lpReserve?.toString(),
      openTime: lpdata?.poolOpenTime?.toString()

    }


    console.log(data);

    return data;
  }


}


const solanaAddressRegex = /\b[A-Za-z0-9]{40,44}\b/g;
function extractSolanaAddresses(text: string): string {
  const matches = text.match(solanaAddressRegex);
  if (matches) {
    return matches.join('\n'); // Join the matches with newline characters
  } else {
    return undefined;
  }
}

export const parseAddress = (text: any) => {

  // Extract Ethereum addresses using the regular expression
  const solanaAddress = extractSolanaAddresses(text);


  if (solanaAddress)
    return solanaAddress;
  else return null;

}


export const getPairData = async (address: any) => {

  const url = `https://api.dexscreener.com/latest/dex/search?q=${address}`;
  const result = await axios.get(url);

  if (result && result.data && result.data.pairs) {

    console.log(result.data);

    const resp = {
      tokenAddress: result.data.pairs[0]?.baseToken.address,
      url: result.data.pairs[0].url,
      tokenSymbol: result.data.pairs[0]?.baseToken.symbol,
      tokenName: result.data.pairs[0]?.baseToken.name,
      tokenAge: result.data.pairs[0]?.pairCreatedAt,
      tokenMC: result.data.pairs[0]?.fdv,
      liquiditySOL: result.data.pairs[0]?.liquidity.quote,
      currPrice: result.data.pairs[0]?.priceUsd,
      chainId: result.data.pairs[0]?.chainId,
      dex: result.data.pairs[0]?.dexId,
      version: result.data.pairs[0]?.labels[0]
    }


    return resp;
  } else return null;
}