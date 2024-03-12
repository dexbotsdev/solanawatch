import { ChannelLogs, Channels } from "../database/db";
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


export const NewMessageFormat = (commandDetail: any, totalCallsCount: number) => {

    return `
<b>💳 <a href="https://t.me/${commandDetail.channelName}/${commandDetail.callerPostId}">$${commandDetail.tokenSymbol}🚀 </a> ${commandDetail.priceChange24}% ROI</b>

${commandDetail.tokenMC > 0.0 ? '' : premarketData(commandDetail)} 
<b>💳 BASICS</b>

🔥 LP-Burned : 🔴
🌀 DexScreener Updated : 🔴
🎰 Sol Trending : 🔴
🏨 SafeGuard Trending : 🔴

💳<b> KOLS PUSH | Mcap | ROI </b>
${postLaunchCalls(commandDetail)} 

📈<b> TRADE</b> -- Links To bots

<code>${commandDetail.tokenAddress}</code>  

🎯<b>Ad</b>buy auto ads
`;
}


const preMarketingList = (premarketData) => {
    let ret = '';
    let i=1;
    premarketData.forEach((item, index) => {
        ret += `
<a href="https://t.me/${item.channelName}">${i++}. ${item.channelName}</a>`
    })
    return ret;
}


const kohlList = (kohlsStats) => {
    let ret = '';
    let i=1;

    kohlsStats.forEach((item, index) => {
        ret += `
<a href="https://t.me/${item.channelName}">${i++}. ${item.channelName} | ${formatNumber(item.tokenMC)} | ${Number(item.callROI).toFixed(0)}X</a>`
    })
    return ret;
}

export const UpdatedMessageFormat = (commandDetail: any, maxRoi: string, preMarketing: any, kohlsStats: any[]) => {

    return `
<b>💳 <a href="https://t.me/${commandDetail.channelName}/${commandDetail.callerPostId}">$${commandDetail.tokenSymbol}🚀 </a> ${maxRoi}% ROI</b>

<b>💳 Pre-Marketing</b> 
${preMarketingList(preMarketing)}

<b>💳 BASICS</b>

🔥 LP-Burned : ${commandDetail.lpBurned ? '🟢':'🔴'}
🌀 DexScreener Updated : ${commandDetail.dexUpdated ? '🟢':'🔴'}
🎰 Sol Trending :  ${commandDetail.solTrending ? '🟢':'🔴'}
🏨 SafeGuard Trending :  ${commandDetail.safeguarded ? '🟢':'🔴'}

💳<b> KOLS PUSH | Mcap | ROI </b>
${kohlList(kohlsStats)} 

📈<b> TRADE</b> -- Links To bots

<code>${commandDetail.tokenAddress}</code>  

🎯<b>Ad</b> buy auto ads
    `;
}





export const UpdateFromNewCall = (commandDetail: any, totalCallsCount: number) => {

    return `
    $${commandDetail.tokenSymbol} <b>New Call :</b>  <b> <a href="https://t.me/${commandDetail.channelName}/${commandDetail.callerPostId}">${commandDetail.callerTG}</a></b>

🟢 Token : $${commandDetail.tokenSymbol} || ${commandDetail.tokenName}

📊 Real-Time MCap:  $${formatter.format(commandDetail.tokenMC)}
 
⚠ CA : <code>${commandDetail.tokenAddress}</code>

 
Call Alerts from <b>@solanawatch</b>
`;
}





export const UpdateFromAddonCall = (commandDetail: any, totalCallsCount: number) => {

    return `
$${commandDetail.tokenSymbol} <b>New Call :</b>  <b> <a href="https://t.me/${commandDetail.channelName}/${commandDetail.callerPostId}">${commandDetail.callerTG}</a></b>


🟢 Token : $${commandDetail.tokenSymbol} || ${commandDetail.tokenName}

📊 Real-Time MCap:  $${formatter.format(commandDetail.tokenMC)}

⚠ CA : ${commandDetail.tokenAddress}

 
Call Alerts from <b>@solanawatch</b>
    `;
}

const getAlphaCount = (calls: any) => {


    //console.log("********************* IN Get Alpha Count Method ")
    let disp = 0;
    for (var i = 0; i < calls.length; i++) {

        if (Number(calls[i].isAlpha) === 1) {
            disp = disp + 1

        }
    }


    return disp;
}

const getCallCountBalls = (alphaCallsCount: any) => {
    let disp = '';
    for (var i = 0; i < alphaCallsCount; i++) {

        disp = disp + '🟢'
        if ((i + 1) % 3 === 0) disp = disp + '||';
    }
    return disp;
}

const getCallerLines = (calls: any) => {

    let outcome = '     ';

    for (var i = 0; i < calls.length; i++) {

        outcome += `    <b><u>${i + 1}. ${calls[i].callerTG}</u></b>
    
            🟦 <b> Market Cap : $${formatter.format(calls[i].mcap)} || ROI: ${calls[i].athROI}%</b>
    
    `
    }

    return outcome;
}