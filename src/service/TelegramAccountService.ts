import { Api, TelegramClient } from "telegram";
import { StoreSession } from "telegram/sessions/index.js";
import { text } from 'input'
import bigInt from "big-integer";
import { EventEmitter } from 'emitter'

import { Channels, TokenCalls, UpdateLogs } from "../database/db";
import { processMessage, parseAddress } from '../processor/TokenProcessor';
import { getKohlsStats, getMaxRoi, getPremarketingCalls } from "../database/CustomQuery";
import { NewMessageFormat, UpdatedMessageFormat } from "../processor/MessageFormats";
import { dexscreener_channel, lpburned_channel, safeguard_channel, soltrending_channel } from "../config";
import { where } from "sequelize";

class TelegramAccountService {

    client: TelegramClient;
    channels: any[];
    botClient: TelegramClient;
    em: EventEmitter;
    chatIds: any[];
    channelMaps: any[];
    publishChannel: any;
    publishTo: any;


    constructor(config: {

        publishChannel: any;
        followChannels: any[]; dataStoragePath: string; telegram_api_id: number; telegram_api_hash: string;
    }, em: EventEmitter) {

        this.client = new TelegramClient(new StoreSession(config.dataStoragePath), config.telegram_api_id, config.telegram_api_hash, {});
        this.channels = config.followChannels;

        this.chatIds = [];
        this.em = em;
        this.channelMaps = [];
        this.initClient();
        this.publishChannel = config.publishChannel;

    }

    disconnect = () => {

    }

    getGroupChatIdByName = async () => {


        try {
            const dialogs = await this.client.getDialogs();
            dialogs.forEach((element: any) => {



                if (element.entity?.className === 'Channel') {
                    if (Number(element.dialog.peer?.channelId)
                        && (this.channels.includes(element?.entity?.username) || this.channels.includes(element?.entity?.title))
                    ) {
                        this.chatIds.push(Number(element.dialog?.peer?.channelId));
                        this.channelMaps.push({
                            name: element?.entity?.username,
                            title: element?.entity?.title,
                            id: Number(element.dialog.peer?.channelId),
                        })
                    }
                } else if (element.entity?.className === 'Chat' && (this.channels.includes(element?.entity?.username) || this.channels.includes(element?.entity?.title)
                )
                ) {
                    this.chatIds.push(Number(element.entity?.id));
                    this.channelMaps.push({
                        name: element?.entity?.title,
                        title: element?.entity?.title,
                        id: Number(element.entity?.id),
                    })


                }

                console.log(element?.entity?.username + '-' + element?.entity?.title)

                if (this.publishChannel === element?.entity?.username || this.publishChannel === element?.entity?.title) {

                    this.publishTo = {
                        name: element?.entity?.username,
                        title: element?.entity?.title,
                        id: Number(element.dialog.peer?.channelId)
                    }

                    console.log(this.publishTo);
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
                    }

                    const chnl = await Channels.upsert(cnl);
                });

                await this.subscribe();

            }


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
                    let signal: any = {};
                    ////console.log(data);
                    //console.log('------------------------------------------------------');


                    if (data && data.tokenAddress) {

                        signal = {
                            callerPostId: event.message.id,
                            callerTG: this.channelMaps.find((item) => item.id === Number(chatId)).title,
                            channelName: this.channelMaps.find((item) => item.id === Number(chatId)).name,
                            isAlpha: this.channelMaps.find((item) => item.id === Number(chatId)).isAlpha,
                            callTime: Date.now(),
                            tokenAddress: data.tokenAddress,
                            tokenSymbol: data.tokenSymbol,
                            tokenName: data.tokenName,
                            tokenMC: data.tokenMC,
                            priceChange24: data.priceChange24
                        }

                        this.em.emit('newSignal', signal);
                    }
                }
            }



        })
    }

    sendNewMessageToChannel = async (tradeSignal: string) => {

        const botlinkedchannel = await this.client.getInputEntity(this.publishChannel);

        let tradingSignal = JSON.parse(tradeSignal);
        this.client.setParseMode("html");
        const tokenAddress = tradingSignal.tokenAddress;
        //const tokenStats = await getTokenStats(tradingSignal);
        let message = NewMessageFormat(tradingSignal, 0);

        console.log(tradeSignal);

        const resultLog = await this.client.sendMessage(botlinkedchannel, { message: message, parseMode: 'html', linkPreview: false });

        const resultLogData = JSON.parse(JSON.stringify(resultLog));

        await UpdateLogs.destroy({ where: { tokenAddress: tokenAddress } });

        await UpdateLogs.create({ lastMessageId: resultLogData.id, tokenAddress: tokenAddress });


    }

    sendUpdatedMessageToChannel = async (tradeSignal: string, loggedSignal: UpdateLogs) => {
        let tradingSignal = JSON.parse(tradeSignal);
        let oldMsgId = loggedSignal.dataValues.lastMessageId;

        console.log('Updating existing call for ' + oldMsgId);

        const botlinkedchannel = await this.client.getInputEntity(this.publishChannel);
        this.client.setParseMode("html");
        const tokenAddress = tradingSignal.tokenAddress;


        const maxRoi = await getMaxRoi(tokenAddress, tradingSignal);
        const preMarketing = await getPremarketingCalls(tokenAddress)
        const kohlsStats = await getKohlsStats(tokenAddress, tradingSignal);

        console.log(JSON.stringify(maxRoi, null, 2))
        console.log(JSON.stringify(preMarketing, null, 2))
        console.log(JSON.stringify(kohlsStats, null, 2))
        const tradeCommand = await TokenCalls.findAll({ where: { tokenAddress: tradingSignal.tokenAddress } })
        let message = UpdatedMessageFormat(tradeCommand[0].dataValues, maxRoi, preMarketing, kohlsStats);

        const resultLog = await this.client.editMessage(botlinkedchannel, { message: oldMsgId, text: message, parseMode: 'html', linkPreview: false });
        const resultLogData = JSON.parse(JSON.stringify(resultLog));

        await UpdateLogs.destroy({ where: { tokenAddress: tokenAddress } });

        await UpdateLogs.create({ lastMessageId: resultLogData.id, tokenAddress: tokenAddress });
    }


}


export default TelegramAccountService;

