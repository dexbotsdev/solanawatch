import { QueryTypes } from "sequelize";
import { ChannelLogs, sequelize } from "./db";

export const getMaxRoi = async (tokenAddress: any, tradeSignal: { tokenMC: number; }) => {
    const result = [];
    const data: any[] = await sequelize.query(
        `SELECT min(tokenMC) as tokenMC from ChannelLogs where tokenAddress ='${tokenAddress}'`,
        {
            type: QueryTypes.SELECT
        }
    );
    let maxROI = '0';
 
    if (data && data.length > 0) {
        maxROI = Number(Number(tradeSignal.tokenMC - data[0].tokenMC)*100/ data[0].tokenMC).toFixed(2)
    }

    return maxROI;
}


export const getPremarketingCalls = async (tokenAddress: any) => {
    const result = [];
    const data: ChannelLogs[] = await sequelize.query(
        `SELECT distinct channelName from ChannelLogs where tokenAddress ='${tokenAddress}' and tokenMC=0`,
        {
            type: QueryTypes.SELECT
        }
    );
 
    return data;
}


export const getKohlsStats = async (tokenAddress: any, tradeSignal: { tokenMC: number; }) => {
    const result = [];
    const data: ChannelLogs[] = await sequelize.query(
        `SELECT   channelName ,tokenMC from ChannelLogs where tokenAddress ='${tokenAddress}'`,
        {
            type: QueryTypes.SELECT
        }
    );
     data.forEach((item :any) => {
        result.push({
            channelName: item.channelName,
            tokenMC: item.tokenMC,
            callROI: Number(Number(tradeSignal.tokenMC - item.tokenMC) / item.tokenMC).toFixed(2)
        });
    })

    return result;
}