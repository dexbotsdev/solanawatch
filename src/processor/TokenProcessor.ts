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
    if(!addressInmessage || addressInmessage == null) return;
    const marketData = await getPairData(addressInmessage);
    let data: any = {};
    if (marketData && marketData != null) {

      data = marketData
    } else {
      const token = new PublicKey(addressInmessage);  

       const tokenStats = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(token) });
      data = {
        tokenAddress: tokenStats.address.toBase58(), 
        tokenSymbol: tokenStats.symbol,
        tokenName: tokenStats.name,
        tokenMC: 0.0,
        priceChange24: 0.0,
      }
    }

 
    return data;
  }


}


const solanaAddressRegex = /\b[A-Za-z0-9]{40,44}\b/g;
function extractSolanaAddresses(text: string): string {
  const matches = text.match(solanaAddressRegex);

  console.log(matches)
  if (matches) {
    return matches[0]; // Join the matches with newline characters
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
  let result :any = await axios.get(url).then((res=>res));

  console.log(result.data)
  if (result && result.data && result.data.pairs.length>0) {

     result = JSON.parse(JSON.stringify(result.data));
    console.log(result.pairs[0]?.priceChange?.h24) 

    let pricechnge=0;
     if(result.pairs[0]?.priceChange?.h24)pricechnge=Number(result.pairs[0]?.priceChange?.h24);

    const resp = {
      tokenAddress: result.pairs[0]?.baseToken.address, 
      tokenSymbol: result.pairs[0]?.baseToken.symbol,
      tokenName: result.pairs[0]?.baseToken.name,
      tokenMC: result.pairs[0]?.fdv,
      priceChange24: Number(pricechnge),
    }

    console.log('processed data is ', resp) 

    return resp;
  } else return null;
}