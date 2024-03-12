import { EventEmitter } from 'emitter'
import fs from 'fs'
import logger from './service/Logger'; 
import TelegramAccountService from './service/TelegramAccountService';
import { Channels, sequelize, TokenCalls } from './database/db';
import moment from 'moment';
 
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

    eventEmitter.on('newSignal', async (tradeSignal: any) => {
      logger.info('Recieved ');
    //console.log(tradeSignal);

     const oldSignal = await  TokenCalls.findOne({where :{
        tokenAddress : tradeSignal.tokenAddress,
        callerTG : tradeSignal.callerTG,
        callerPostId: tradeSignal.callerPostId
      }})

      if(oldSignal && oldSignal.dataValues && oldSignal.dataValues.tokenAddress){
        logger.error('skipping Duplicates')
      }else {
        await TokenCalls.create(tradeSignal);
        try{
        tsA.sendCallersMessageToChannel(JSON.stringify(tradeSignal)); 
        }catch(error){
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
      logger.info('Recieved 24 Hourly Stats --   '  );
       

    //console.log(message);

       

    }); 

 

  })
}

start();



