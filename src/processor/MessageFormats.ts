import { s11, s8 } from "../utils";
import { ChannelLogs, Channels, TokenCalls } from "../database/db";
import moment from "moment";

let formatter = Intl.NumberFormat('en', { notation: 'compact' });

 
function formatNumber(num: number) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(0) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    } else {
        return Number(num).toFixed(0);
    }
}


export const NewMessageFormat = async (commandDetail: any, maxRoi: string, preMarketing: any, kohlsStats: any[]) => {

    let roi = isNaN(Number(maxRoi))? 0 : Number(maxRoi)>0? maxRoi: maxRoi;

    if(Number(roi) > Number.MAX_VALUE)roi='+0';

    const oldSignal = await TokenCalls.findOne({
        where: {
          tokenAddress: commandDetail.tokenAddress 
        }
      })
      let showpm = preMarketing.length>0?'<b>💳 Pre-Marketing</b> ':''; 
      
    return `
    <b>🪼 <a href="https://dexscreener.com/solana/${commandDetail.tokenAddress}">$${commandDetail.tokenSymbol}</a> 🧚 ${roi}% </b>
${preMarketingList(preMarketing)}  
 DexScreener Updated : ${oldSignal.dataValues.dexUpdated ? '🟢':'🔴'}
 Sol Trending :  ${oldSignal.dataValues.solTrending ? '🟢':'🔴'}

<b>⚡KOLS PUSH | Mcap | Owner</b>
${kohlList(kohlsStats)} 

<b> TRADE</b> -- <a href="https://t.me/SolTradingBot?start=w7XyTrwMT">SolTrading</a>

<code>${commandDetail.tokenAddress}</code>   

🎟️ <a href="https://t.me/devinsolana">Promo</a> | 🎟️ <a href="https://t.me/devinsolana">Ads</a>  | 🎤 <a href="https://t.me/devinsolana">Listing</a>
`;
}
 
const preMarketingList = (premarketData) => {
    let ret = '';
    let i=1;
    ret = premarketData.length>0?`<b>⚡ Pre-Marketing | Owner</b>
`:''; 

    premarketData.forEach((item, index) => {
        if(item.callerPostId) 
        ret += `<a href="https://t.me/${item.channelName}/${item.callerPostId}">${i++}. ${s11(item.channelName)}</a> | ${item.userId}
`
    })
    return ret;
}


const kohlList = (kohlsStats) => {
    let ret = '';
    let i=1;

    kohlsStats.forEach((item, index) => {
        if(item.tokenMC)
        ret += `<a href="https://t.me/${item.channelName}/${item.callerPostId}">${i++}. ${s11(item.channelName)}</a> | ${formatNumber(item.tokenMC)} | ${item.userId}
`
    })
    return ret;
}

export const UpdatedMessageFormat = async (commandDetail: any, maxRoi: string, preMarketing: any, kohlsStats: any[]) => {
    let roi = isNaN(Number(maxRoi))? 0 : maxRoi;
    if(Number(roi) > Number.MAX_VALUE)roi='+0';
    const oldSignal = await TokenCalls.findOne({
        where: {
          tokenAddress: commandDetail.tokenAddress 
        }
      })
       
    return `
<b>🪼 <a href="https://dexscreener.com/solana/${commandDetail.tokenAddress}">$${commandDetail.tokenSymbol}</a> 🧚 ${roi}% </b>
${preMarketingList(preMarketing)} 
 DexScreener Updated : ${oldSignal.dataValues.dexUpdated ? '🟢':'🔴'}
 Sol Trending :  ${oldSignal.dataValues.solTrending ? '🟢':'🔴'}

 <b>❄️ KOHLS PUSH | Mcap | Owner</b>
 ${kohlList(kohlsStats)} 
📈<b> TRADE</b> -- <a href="https://t.me/SolTradingBot?start=w7XyTrwMT">SolTrading</a>

<code>${commandDetail.tokenAddress}</code>  

🎟️ <a href="https://t.me/devinsolana">Promo</a> | 🎟️ <a href="https://t.me/devinsolana">Ads</a>  | 🎤 <a href="https://t.me/devinsolana">Listing</a>
`;
}


 