import { EventEmitter } from 'emitter'
import fs from 'fs'
import logger from './service/Logger';
import TelegramAccountService from './service/TelegramAccountService';
import { ChannelLogs, sequelize, TokenCalls, UpdateLogs } from './database/db';
import { dexscreener_channel, safeguard_channel, lpburned_channel, soltrending_channel } from './config';

const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(1);

let config = null;
async function start() {
  await sequelize.sync({ force: false, alter: true });


  fs.readFile('./client.config.json', 'utf8', (error, data) => {
    if (error) {
      //console.log(error);
      return;
    }
    config = JSON.parse(data);

    const tsA = new TelegramAccountService(config, eventEmitter);


    eventEmitter.on('newListener', (event: string, listener: any) => {
      logger.info(`Added Signal Repeater Server ${event.toUpperCase()} listener.`);
    });

    eventEmitter.on('updateSignal', async (tradeSignal: any) => {
      logger.info('Recieved  updateSignal');
      console.log(JSON.stringify(tradeSignal, null, 2));

      const loggedSignal = await UpdateLogs.findOne({
        where: {
          tokenAddress: tradeSignal.tokenAddress,
        }
      })

      try {

        if (loggedSignal && loggedSignal.dataValues && loggedSignal.dataValues.tokenAddress) {
          tsA.sendUpdatedMessageToChannel(JSON.stringify(tradeSignal), loggedSignal);
        } else {
          tsA.sendNewMessageToChannel(JSON.stringify(tradeSignal));
        }

      } catch (error) {
        console.log(error)
      }

    });
    eventEmitter.on('newSignal', async (tradeSignal: any) => {
      logger.info('Recieved ');
      console.log(JSON.stringify(tradeSignal, null, 2));
      const oldSignal = await ChannelLogs.findOne({
        where: {
          tokenAddress: tradeSignal.tokenAddress,
          channelName: tradeSignal.channelName, 
        }
      })
      const loggedSignal = await UpdateLogs.findOne({
        where: {
          tokenAddress: tradeSignal.tokenAddress,
        }
      })

      if (oldSignal && oldSignal.dataValues && oldSignal.dataValues.tokenAddress) {
        logger.error('skipping Duplicates')
      } else {

        logger.error('TokenCalls.upsert ')


        await TokenCalls.upsert(tradeSignal);

        logger.error('ChannelLogs.create  ')

        await ChannelLogs.create(tradeSignal);
        try {
          if (tradeSignal.channelName == dexscreener_channel) {
            TokenCalls.update({
              dexUpdated: true
            }, {
                where: {
                    tokenAddress: tradeSignal.tokenAddress,
                },
            })

        } else
            if (tradeSignal.channelName == safeguard_channel) {
                TokenCalls.update({
                    safeguarded: true
                }, {
                    where: {
                        tokenAddress: tradeSignal.tokenAddress,
                    },
                })

            } else
                if (tradeSignal.channelName == lpburned_channel) {
                    TokenCalls.update({
                        lpBurned: true
                    }, {
                        where: {
                            tokenAddress: tradeSignal.tokenAddress,
                        },
                    })

                } else
                    if (tradeSignal.channelName == soltrending_channel) {

                        console.log('@@@@@@@@@@@@@@@@@@@@@@@soltrending_channel@@@@@@@@@@@@@@@@@@@@@@');

                        TokenCalls.update({
                            solTrending: true
                        }, {
                            where: {
                                tokenAddress: tradeSignal.tokenAddress,
                            },
                        })
                    }

                   if (loggedSignal && loggedSignal.dataValues && loggedSignal.dataValues.tokenAddress) {
                    tsA.sendUpdatedMessageToChannel(JSON.stringify(tradeSignal), loggedSignal);
                  } else {
                    tsA.sendNewMessageToChannel(JSON.stringify(tradeSignal));
                  }
              



        } catch (error) {
          console.log(error)
        }
      }

    });

    eventEmitter.on('Disconnected', (message: string) => {
      logger.info('Disconnected -- need to restart ' + message.toUpperCase());
      eventEmitter.removeAllListeners();
      tsA.disconnect();
      start();

    });

    eventEmitter.on('24hourlyStats', async (message: string) => {
      logger.info('Recieved 24 Hourly Stats --   ');





    });



  })
}

start();


