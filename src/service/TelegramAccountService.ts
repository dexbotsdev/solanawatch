import { Api, TelegramClient } from "telegram";
import { StoreSession } from "telegram/sessions/index.js";
import { text } from 'input'
import bigInt from "big-integer";
import { EventEmitter } from 'emitter'

import { Channels, TokenCalls, UpdateLogs } from "../database/db";
import { processMessage, parseAddress } from '../processor/TokenProcessor';
import { getTokenStats } from "../database/CustomQuery";
import { AllCallsMessage, NewMessageFormat, UpdateFromAddonCall, UpdateFromNewCall } from "../processor/MessageFormats";

class TelegramAccountService {
    client: TelegramClient;
    channels: any[];
    botClient: TelegramClient;
    em: EventEmitter;
    chatIds: any[];
    channelMaps: any[];
    alphachannelMaps: any[];
    publishChannel: any;
    publishTo: any;
    alphaChannels: any;


    constructor(config: {
        alphaChannels: any;
        publishChannel: any;
        followChannels: any[]; dataStoragePath: string; telegram_api_id: number; telegram_api_hash: string;
    }, em: EventEmitter) {

        this.client = new TelegramClient(new StoreSession(config.dataStoragePath), config.telegram_api_id, config.telegram_api_hash, {});
        this.channels = config.followChannels;
        this.alphaChannels = config.alphaChannels;
        this.chatIds = [];
        this.em = em;
        this.channelMaps = [];
        this.initClient();
        this.publishChannel = config.publishChannel;

    }

    disconnect = () => {

        this.client.disconnect();
    }

    getGroupChatIdByName = async () => {


        try {
            const dialogs = await this.client.getDialogs(); 
            dialogs.forEach((element: any) => {


                console.log(element.entity.username);
                console.log(element.entity.title);

                let alpha = this.alphaChannels.includes(element?.entity?.username);

                if(!element.entity.username){
                    alpha = this.alphaChannels.includes(element?.entity?.title);
                }

                if (element.entity?.className === 'Channel') {
                    if (Number(element.dialog.peer?.channelId)
                        && (this.channels.includes(element?.entity?.username) || this.channels.includes(element?.entity?.title)
                            || this.alphaChannels.includes(element?.entity?.username) || this.alphaChannels.includes(element?.entity?.title))
                    ) {
                        this.chatIds.push(Number(element.dialog?.peer?.channelId));
                        this.channelMaps.push({
                            name: element?.entity?.username,
                            title: element?.entity?.title,
                            id: Number(element.dialog.peer?.channelId),
                            isAlpha: alpha
                        })
                    }
                } else if (element.entity?.className === 'Chat' && (this.channels.includes(element?.entity?.username) || this.channels.includes(element?.entity?.title)
                    || this.alphaChannels.includes(element?.entity?.username) || this.alphaChannels.includes(element?.entity?.title))
                ) {
                    this.chatIds.push(Number(element.entity?.id));
                    this.channelMaps.push({
                        name: element?.entity?.title,
                        title: element?.entity?.title,
                        id: Number(element.entity?.id),
                        isAlpha: alpha
                    })


                }

                if (this.publishChannel === element?.entity?.username || this.publishChannel === element?.entity?.title) {

                    this.publishTo = {
                        name: element?.entity?.username,
                        title: element?.entity?.title,
                        id: Number(element.dialog.peer?.channelId)
                    }


                }
            });



            //console.log(this.channelMaps.length);

            if (this.channelMaps.length > 0) {

                this.channelMaps.forEach(async (element: any) => {
                    const cnl = {
                        channelId: Number(element.id),
                        channelName: element?.name,
                        channelTitle: element?.title,
                        enabled: true,
                        isAlpha: this.alphaChannels.includes(element?.name)
                    }

                    const chnl = await Channels.upsert(cnl).then((result) => { console.log(result) });
                });

                await this.subscribe();

            }

            console.log(this.channelMaps);

        } catch (error) {
            //console.log(error)
            throw new Error(`Group not found.`);

        } finally {
            //console.log(this.channelMaps);
        }
    }


    initClient = async () => {


        //console.log("starting" );


        await this.client.start({
            phoneNumber: async () => await text("Please enter your number: "),
            password: async () => await text("Please enter your password: "),
            phoneCode: async () =>
                await text("Please enter the code you received: "),
            onError: (err: any) => console.log(err),
        });

        const me = await this.client.getMe();
        //console.log("starting me" );

        if (me) {
            //console.log("starting getGroupChatIdByName" );

            this.getGroupChatIdByName();
        }

    }


    subscribe = async () => {
        //console.log("starting   subscribe" ); 

        this.client.addEventHandler(async (event: any) => {
            if (event?.message) {
                // 
                ////console.log(this.chatIds); 

                const chatId = event.message?.peerId?.channelId ? event.message?.peerId?.channelId : event.message?.peerId?.chatId;

                if (this.chatIds.includes(Number(chatId))) {

                    //console.log('------------------------------------------------------');
                    //console.log(' Message from ' + this.channelMaps.find((item) => item.id === Number(chatId)).title);
                    let data = await processMessage(event.message);
                    let signal = {};
                    ////console.log(data);
                    //console.log('------------------------------------------------------');
 

                    if (data) {
                        signal = {
                            callerPostId: event.message.id,
                            callerTG: this.channelMaps.find((item) => item.id === Number(chatId)).title,
                            channelName: this.channelMaps.find((item) => item.id === Number(chatId)).name,
                            isAlpha: this.channelMaps.find((item) => item.id === Number(chatId)).isAlpha,
                            callTime: Date.now(),
                            tokenAddress: data.tokenAddress,
                            tokenSymbol: data.tokenSymbol,
                            tokenName: data.tokenName,
                            tokenAge: data.tokenAge,
                            tokenMC: data.tokenMC,
                            liquidityETH: data.liquidityETH,
                            currPrice: data.currPrice,
                            chainId: data.chainId,
                            dex: data.dex,
                            version: data.version,
                            athROI: "0",
                            url: data.url
                        }
                        this.em.emit('newSignal', signal);
                    }
                } else {
                    //console.log(event.message);
                }
            }



        })
    }


    sendCallersMessageToChannel = async (tradeSignal: string) => {

        


            const botlinkedchannel = await this.client.getInputEntity(this.publishChannel);

            let tradingSignal = JSON.parse(tradeSignal);
            this.client.setParseMode("html");

            const tokenAddress = tradingSignal.tokenAddress;
            const tokenStats = await getTokenStats(tradingSignal);
            let totalCallsCount = tokenStats.callCount;


            let channelsCallCount = 0;
            let alphaCallsCount = 0;

            tokenStats.calls.forEach(element => {
                if (element.callerTG === tradingSignal.callerTG) {
                    channelsCallCount = element.calls;
                }
                if (Number(element.isAlpha) === 1) {
                    alphaCallsCount ++;
                }
            });


            let message = NewMessageFormat(tradingSignal, totalCallsCount);

            console.log(message);


            const tradeLogMessage = await AllCallsMessage(JSON.parse(tradeSignal), tokenStats,alphaCallsCount); 

            
                const oldLogsOpenData = await UpdateLogs.findOne({
                    where: {
                        tokenAddress: tokenAddress
                    }
                })


                const oldMessageId = oldLogsOpenData?.dataValues?.lastMessageId ? oldLogsOpenData?.dataValues?.lastMessageId : 0;


                console.log("oldLogsOpenData" + oldLogsOpenData); 
                
                try{

                
                if (oldMessageId === 0) {

                    if(!tradingSignal.isAlpha)
                    await this.client.sendMessage(botlinkedchannel, { message: message, parseMode: 'html', linkPreview: false });


                    const resultLog = await this.client.sendMessage(botlinkedchannel, { message: tradeLogMessage, parseMode: 'html', linkPreview: false });

                    const resultLogData = JSON.parse(JSON.stringify(resultLog)); 

                    await UpdateLogs.create({ lastMessageId: resultLogData.id, tokenAddress: tokenAddress });
                } else {

                    if (!tradingSignal.isAlpha) {

                        if (totalCallsCount === 1 && channelsCallCount === 1) {
                            await this.client.sendMessage(botlinkedchannel, { 
                                message: message, parseMode: 'html', linkPreview: false
                            });
                        }else
                        await this.client.sendMessage(botlinkedchannel, {
                            replyTo: oldMessageId,
                            message: message, parseMode: 'html', linkPreview: false
                        });
                    }

                    const resultLog = await this.client.editMessage(botlinkedchannel, { message: oldMessageId, text: tradeLogMessage, parseMode: 'html', linkPreview: false });

                    const resultLogData = JSON.parse(JSON.stringify(resultLog));

                    await UpdateLogs.destroy({ where: { tokenAddress: tokenAddress } });

                    await UpdateLogs.create({ lastMessageId: resultLogData.id, tokenAddress: tokenAddress });


                } 
            }catch(Error){
                console.log(Error);
            }
        
    }


    // sendTokenCallMessage = async (tradeSignal: string) => {

    //     const botlinkedchannel = await this.client.getInputEntity(this.publishChannel);

    //     let tradingSignal = JSON.parse(tradeSignal);
    //     this.client.setParseMode("html");

    //     const tokenAddress = tradingSignal.tokenAddress;
    //     const tokenStats = await getTokenStats(tokenAddress);

    //     const callerTG = tradingSignal.callerTG;
    //     let currTGCallsCount = 0;
    //     let totalCallsCount = tokenStats.callCount;

    //     //console.log(tokenStats);

    //     tokenStats.calls.forEach(element => {
    //         if (element.callerTG === callerTG) {
    //             currTGCallsCount = element.calls;
    //             //callerTG , tokenName,tokenSymbol, tokenAddress, min(tokenMC) as mcap,count(*) as calls 

    //         }

    //     });

    //     // console.log(tokenStats);
    //     //console.log(totalCallsCount);
    //     //console.log(currTGCallsCount);

    //     let message = '';


    //     if (tokenStats.calls.length > 0) {
    //         tradingSignal.minCallerTG = tokenStats.calls[0].callerTG;
    //         tradingSignal.minCallerMcap = tokenStats.calls[0].mcap
    //         tradingSignal.minCallerChannelName = tokenStats.calls[0].channelName
    //         tradingSignal.minCallercallerPostId = tokenStats.calls[0].callerPostId
    //     }
    //     if (totalCallsCount === 1 && currTGCallsCount === 1 && !tradingSignal.isAlpha) {

    //         //console.log('Calling NEW MESSAGE since only 1 Record ')

    //         message = NewMessageFormat(tradingSignal, totalCallsCount);
    //     }
    //     else if (totalCallsCount > 1 && currTGCallsCount === 1 && !tradingSignal.isAlpha) {

    //         //console.log('Calling NEW MESSAGE after 1 Record ')


    //         message = NewMessageFormat(tradingSignal, totalCallsCount);
    //     }

    //     if (totalCallsCount > 1 && currTGCallsCount > 1 && !tradingSignal.isAlpha) {
    //         //console.log('Calling AddOnCall MESSAGE after 1 Record ')

    //         message = NewMessageFormat(tradingSignal, currTGCallsCount);


    //     }

    //     if (!tradingSignal.isAlpha)
    //         await this.client.sendMessage(botlinkedchannel, { message: message, parseMode: 'html', linkPreview: false });


    //     const tradeLogMessage = await AllCallsMessage(JSON.parse(tradeSignal), tokenStats,1);

    //     const oldLogsOpenData = await UpdateLogs.findOne({
    //         where: {
    //             tokenAddress: tokenAddress
    //         }
    //     })


    //     const oldMessageId = oldLogsOpenData?.dataValues?.lastMessageId ? oldLogsOpenData?.dataValues?.lastMessageId : 0;


    //     if (oldMessageId === 0) {
    //         // const resultLog  = await this.client.invoke(
    //         //     new Api.messages.SendMessage({
    //         //         peer: "botlinkedchannel",
    //         //         message: tradeLogMessage,
    //         //         noWebpage:true, 
    //         //         randomId: bigInt.fromArray([parseInt("" + Math.random() * 10 ** 10)]),

    //         //     })
    //         // );

    //         const resultLog = await this.client.sendMessage(botlinkedchannel, { message: tradeLogMessage, parseMode: 'html', linkPreview: false });

    //         const resultLogData = JSON.parse(JSON.stringify(resultLog));


    //         await UpdateLogs.create({ lastMessageId: resultLogData.id, tokenAddress: tokenAddress });

    //     } else {
    //         try {


    //             //console.log(botlinkedchannel);
    //             if (!tradingSignal.isAlpha) {
    //                 await this.client.sendMessage(botlinkedchannel, {
    //                     replyTo: oldMessageId,
    //                     message: message, parseMode: 'html', linkPreview: false
    //                 });
    //             }

    //             // const resultX  = await this.client.invoke(
    //             //     new Api.messages.SendMessage({
    //             //         peer: "botlinkedchannel",
    //             //         message: message,
    //             //         noWebpage:true, 
    //             //         randomId: bigInt.fromArray([parseInt("" + Math.random() * 10 ** 10)]),

    //             //     })
    //             // );



    //             const resultLog = await this.client.editMessage(botlinkedchannel, { message: oldMessageId, text: tradeLogMessage, parseMode: 'html', linkPreview: false });

    //             // const resultLog  = await this.client.invoke(
    //             //     new Api.messages.EditMessage({
    //             //         peer: "botlinkedchannel",
    //             //         message: tradeLogMessage,
    //             //         noWebpage:true,
    //             //         id: oldMessageId
    //             //      })
    //             // );

    //             const resultLogData = JSON.parse(JSON.stringify(resultLog));


    //             await UpdateLogs.destroy({ where: { tokenAddress: tokenAddress } });

    //             await UpdateLogs.create({ lastMessageId: resultLogData.id, tokenAddress: tokenAddress });

    //         } catch (err) {
    //             //console.log(err);
    //         }
    //     }




    // }

}


export default TelegramAccountService;