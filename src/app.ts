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
      return;
    }
    config = JSON.parse(data);

    const tsA = new TelegramAccountService(config, eventEmitter); 

    eventEmitter.on('newListener', (event: string, listener: any) => {
      logger.info(`Added Signal Repeater Server ${event.toUpperCase()} listener.`);
    });
 
    eventEmitter.on('newSignal', async (tradeSignal: any) => {
      logger.info('Recieved ');
      console.log(JSON.stringify(tradeSignal, null, 2));

      try{

        const oldSignal = await ChannelLogs.findOne({
          where: {
            tokenAddress: tradeSignal.tokenAddress,
            channelName: tradeSignal.channelName,  
            userId: tradeSignal.userId, 
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
          const oldTokenSignal = await TokenCalls.findOne({
            where: {
              tokenAddress: tradeSignal.tokenAddress 
            }
          }) 
          if(oldTokenSignal == null) 
           {
            console.log('TOkenCalls create ',tradeSignal)

            await TokenCalls.create(tradeSignal);  
          }
          else 
          {
            console.log('TOkenCalls upsert ',tradeSignal)
            await TokenCalls.upsert(tradeSignal); 
          }
          logger.error('ChannelLogs.create  ')
  
          const tradeCommand = await ChannelLogs.findAll({
            where: {
                tokenAddress: tradeSignal.tokenAddress, 
                channelName: tradeSignal.channelName
            }
        })
        console.log(tradeSignal); 
        if (tradeCommand.length > 0) {
            logger.error('O')
             
        }else{
          await ChannelLogs.create(tradeSignal);}
          let showNew=true;
          try {
            if (tradeSignal.channelName == dexscreener_channel) {
              TokenCalls.update({
                dexUpdated: true
              }, {
                  where: {
                      tokenAddress: tradeSignal.tokenAddress,
                  },
              })
              showNew=false;
          } else
              if (tradeSignal.channelName == safeguard_channel) {
                  TokenCalls.update({
                      safeguarded: true
                  }, {
                      where: {
                          tokenAddress: tradeSignal.tokenAddress,
                      },
                  })
                  showNew=false;
  
              } else
                  if (tradeSignal.channelName == lpburned_channel) {
                      TokenCalls.update({
                          lpBurned: true
                      }, {
                          where: {
                              tokenAddress: tradeSignal.tokenAddress,
                          },
                      })
                      showNew=false;
  
                  } else
                      if (tradeSignal.channelName == soltrending_channel) {
  
   
                          TokenCalls.update({
                              solTrending: true
                          }, {
                              where: {
                                  tokenAddress: tradeSignal.tokenAddress,
                              },
                          })
                          showNew=false;
                      }
  
                     if (loggedSignal && loggedSignal.dataValues && loggedSignal.dataValues.tokenAddress) {
                      tsA.sendUpdatedMessageToChannel(JSON.stringify(tradeSignal), loggedSignal);
                    } else {

                      if(showNew)
                      tsA.sendNewMessageToChannel(JSON.stringify(tradeSignal));
                    }
                
  
  
  
          } catch (error) {
            console.log(error)
          }
        }
        
      }catch(error){
        console.log(error)
        logger.error('BOT CRASHED - SQL ERROR')
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


