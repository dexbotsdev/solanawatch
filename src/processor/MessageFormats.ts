import { ChannelLogs, Channels, TokenCalls } from "../database/db";
import moment from "moment";

let formatter = Intl.NumberFormat('en', { notation: 'compact' });

const postLaunchCalls = (commandDetail: any) => {

    const result = `
<a href="https://t.me/${commandDetail.channelName}/${commandDetail.callerPostId}">1. ${commandDetail.channelName} | ${formatNumber(commandDetail.tokenMC)} | ${Number(commandDetail.priceChange24 / 100).toFixed(0)}X</a>`

    return result;
}

const premarketData = (commandDetail: any) => {

    const result = `
<b>💳 Pre-Marketing</b>
<a href="https://t.me/${commandDetail.channelName}/${commandDetail.callerPostId}">1. ${commandDetail.channelName}</a>`

    return result;
}
function formatNumber(num: number) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(3) + ' M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(3) + ' K';
    } else {
        return Number(num).toFixed(0);
    }
}


export const NewMessageFormat = async (commandDetail: any, maxRoi: string, preMarketing: any, kohlsStats: any[]) => {

    const roi = isNaN(Number(maxRoi))? 0 : Number(maxRoi)>0? '+'+maxRoi: maxRoi;
    const oldSignal = await TokenCalls.findOne({
        where: {
          tokenAddress: commandDetail.tokenAddress 
        }
      })

      
    return `
    <b>💳 <a href="https://dexscreener.com/solana/${commandDetail.tokenAddress}">$${commandDetail.tokenSymbol}</a> 🚀${roi}% </b>

<b>💳 Pre-Marketing</b> 
${preMarketingList(preMarketing)}  
 <b>💳 BASICS</b> 
🔥 LP-Burned : ${oldSignal.dataValues.lpBurned ? '🟢':'🔴'}
🌀 DexScreener Updated : ${oldSignal.dataValues.dexUpdated ? '🟢':'🔴'}
🎰 Sol Trending :  ${oldSignal.dataValues.solTrending ? '🟢':'🔴'}

💳<b> KOLS PUSH | Mcap | ROI </b>
${kohlList(kohlsStats)} 

📈<b> TRADE</b> -- Links To bots

<code>${commandDetail.tokenAddress}</code>  

🎯<b>Ad</b>buy auto ads
`;
}


const preMarketingList = (premarketData) => {
    let ret = '';
    let i=1;
    premarketData.forEach((item, index) => {
        ret += `<a href="https://t.me/${item.channelName}">${i++}. ${item.channelName}</a>
`
    })
    return ret;
}


const kohlList = (kohlsStats) => {
    let ret = '';
    let i=1;

    kohlsStats.forEach((item, index) => {
        ret += `<a href="https://t.me/${item.channelName}">${i++}. ${item.channelName}</a> | ${formatNumber(item.tokenMC)} | ${Number(item.callROI).toFixed(0)}X
`
    })
    return ret;
}

export const UpdatedMessageFormat = (commandDetail: any, maxRoi: string, preMarketing: any, kohlsStats: any[]) => {
    const roi = isNaN(Number(maxRoi))? 0 : maxRoi;

    return `
<b>💳 <a href="https://dexscreener.com/solana/${commandDetail.tokenAddress}">$${commandDetail.tokenSymbol}</a> 🚀${roi}% </b>

<b>💳 Pre-Marketing</b> 
${preMarketingList(preMarketing)}

<b>💳 BASICS</b>

🔥 LP-Burned : ${commandDetail.lpBurned ? '🟢':'🔴'}
🌀 DexScreener Updated : ${commandDetail.dexUpdated ? '🟢':'🔴'}
🎰 Sol Trending :  ${commandDetail.solTrending ? '🟢':'🔴'}

💳<b> KOLS PUSH | Mcap | ROI </b>
${kohlList(kohlsStats)} 

📈<b> TRADE</b> -- Links To bots

<code>${commandDetail.tokenAddress}</code>  

🎯<b>Ad</b> buy auto ads
    `;
}


 